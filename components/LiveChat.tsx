
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';
import React, { useState, useRef, useEffect } from 'react';
import { encode } from '../services/audioUtils';
import { decode, decodeAudioData } from '../services/audioUtils';
// FIX: Import SANSKARA_AI_SYSTEM_PROMPT to resolve the reference error.
import { SANSKARA_AI_SYSTEM_PROMPT } from '../constants';

// NOTE: process.env.API_KEY is magically available in this environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// FIX: Add createBlob helper function for efficient audio data encoding as per guidelines.
function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    // The supported audio MIME type is 'audio/pcm'. Do not use other types.
    mimeType: 'audio/pcm;rate=16000',
  };
}

const LiveChat: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [isLive, setIsLive] = useState(false);
  const [status, setStatus] = useState('Idle. Press Start to begin.');
  
  const sessionRef = useRef<LiveSession | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const startLiveSession = async () => {
    if (isLive) return;

    try {
      setStatus('Connecting...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsLive(true);
      
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus('Connected! Speak now.');
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            mediaStreamSourceRef.current = source;
            
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              // FIX: Use the createBlob helper for efficient encoding.
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
              const source = outputAudioContextRef.current.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAudioContextRef.current.destination);
              source.addEventListener('ended', () => {
                audioSourcesRef.current.delete(source);
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              audioSourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              audioSourcesRef.current.forEach(source => source.stop());
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Live session error:', e);
            setStatus(`Error: ${e.message}. Please try again.`);
            stopLiveSession();
          },
          onclose: (e: CloseEvent) => {
            setStatus('Session closed.');
            stopLiveSession(false);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: SANSKARA_AI_SYSTEM_PROMPT,
        },
      });

      sessionRef.current = await sessionPromise;
    } catch (error) {
      console.error('Failed to start live session:', error);
      setStatus('Failed to get microphone access.');
      setIsLive(false);
    }
  };

  const stopLiveSession = (closeSession = true) => {
    if (!isLive && !sessionRef.current) return;

    if (closeSession && sessionRef.current) {
      sessionRef.current.close();
    }
    
    scriptProcessorRef.current?.disconnect();
    mediaStreamSourceRef.current?.disconnect();
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();

    audioSourcesRef.current.forEach(source => source.stop());
    audioSourcesRef.current.clear();
    
    scriptProcessorRef.current = null;
    mediaStreamSourceRef.current = null;
    inputAudioContextRef.current = null;
    outputAudioContextRef.current = null;
    sessionRef.current = null;
    
    setIsLive(false);
    setStatus('Idle. Press Start to begin.');
  };

  useEffect(() => {
    return () => {
      stopLiveSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-lg w-full text-center">
        <h2 className="text-3xl font-bold text-orange-700 mb-4">Live Conversation</h2>
        <div className="my-8">
          <div className="relative inline-flex items-center justify-center">
              <div className={`absolute w-24 h-24 rounded-full bg-orange-400 ${isLive ? 'animate-ping' : ''}`}></div>
              <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
                      <path fillRule="evenodd" d="M5.5 8a.5.5 0 00.5.5v1.5a4 4 0 004 4h0a4 4 0 004-4V8.5a.5.5 0 001 0V9a5 5 0 01-5 5h0a5 5 0 01-5-5V8.5A.5.5 0 005.5 8z" clipRule="evenodd" />
                  </svg>
              </div>
          </div>
        </div>
        <p className="text-lg text-gray-600 mb-6 min-h-[2.5rem]">{status}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={startLiveSession}
            disabled={isLive}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
          >
            Start
          </button>
          <button
            onClick={() => stopLiveSession()}
            disabled={!isLive}
            className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
          >
            Stop
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveChat;