
import React, { useState, useRef, useEffect } from 'react';
import { Message, Vendor, GroundingSource, WeddingPlan } from '../types';
import { sendMessageToAI, analyzeImage, generateImage, editImage, virtualTryOn, sendMessageWithGrounding, sendComplexMessageWithThinking, analyzeVideo } from '../services/geminiService';
import { PaperclipIcon, SendIcon, MicIcon, BotIcon, UserIcon } from './icons';
import VendorCard from './VendorCard';
import LiveChat from './LiveChat';
import { GenerateContentResponse } from '@google/genai';

interface ChatProps {
    weddingPlan: WeddingPlan;
}

const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve({ base64, mimeType: file.type });
        };
        reader.onerror = error => reject(error);
    });
};

const Chat: React.FC<ChatProps> = ({ weddingPlan }) => {
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', sender: 'ai', text: `Namaste, ${weddingPlan.coupleNames[0]} & ${weddingPlan.coupleNames[1]}! I am SanskaraAI, your Sarathi. I'm here to help orchestrate your perfect wedding. What shall we plan first?` }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLiveChatOpen, setIsLiveChatOpen] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const virtualTryOnState = useRef<{ stage: 'person' | 'clothing' | null, clothing?: { base64: string, mimeType: string, url: string }, person?: { base64: string, mimeType: string, url: string } }>({ stage: null });
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (prompt: string, attachedFile?: File) => {
        if (!prompt && !attachedFile) return;

        setIsLoading(true);
        setInput('');

        const userMessage: Message = { id: Date.now().toString(), sender: 'user', text: prompt };
        setMessages(prev => [...prev, userMessage]);
        
        const loadingMessageId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: loadingMessageId, sender: 'ai', isLoading: true }]);

        try {
            let response: GenerateContentResponse | null = null;
            let aiMessage: Partial<Message> = {};

            if (attachedFile) {
                const { base64, mimeType } = await fileToBase64(attachedFile);
                if (mimeType.startsWith('image/')) {
                    if (virtualTryOnState.current.stage === 'person') {
                        virtualTryOnState.current.clothing = { base64, mimeType, url: URL.createObjectURL(attachedFile) };
                        virtualTryOnState.current.stage = 'clothing';
                        aiMessage = { text: "Great! Now, please upload a full-length photo of the person who will be wearing this." };
                    } else if (virtualTryOnState.current.stage === 'clothing') {
                        virtualTryOnState.current.person = { base64, mimeType, url: URL.createObjectURL(attachedFile) };
                        const { person, clothing } = virtualTryOnState.current;
                        if (person && clothing) {
                           const resultBase64 = await virtualTryOn(person, clothing);
                           if (resultBase64) {
                               aiMessage = { virtualTryOn: { person: person.url, clothing: clothing.url, result: `data:image/png;base64,${resultBase64}` } };
                           } else {
                               aiMessage = { text: "I'm sorry, I couldn't create the virtual try-on image." };
                           }
                        }
                        virtualTryOnState.current = { stage: null };
                    } else {
                        response = await analyzeImage(prompt || "What is in this image?", base64, mimeType);
                    }
                } else if (mimeType.startsWith('video/')) {
                     response = await analyzeVideo(prompt || "Summarize this video.");
                } else {
                    // For text files, etc.
                    const textContent = await attachedFile.text();
                    response = await sendMessageToAI(`${prompt}\n\nFile Content:\n${textContent}`);
                }
            } else if (prompt.toLowerCase().includes("generate image")) {
                const imagePrompt = prompt.replace(/generate image/i, "").trim();
                const imageBase64 = await generateImage(imagePrompt);
                if (imageBase64) {
                    aiMessage = { generatedImage: `data:image/jpeg;base64,${imageBase64}` };
                } else {
                    aiMessage = { text: "I'm sorry, I couldn't generate the image." };
                }
            } else if (prompt.toLowerCase().includes("edit this image")) {
                // This would require a more complex state management to know "which" image to edit.
                // For simplicity, we assume the user will upload an image to edit.
                aiMessage = { text: "Please upload the image you'd like me to edit, and tell me the changes to make." };
            }
            else if (prompt.toLowerCase().includes("find") || prompt.toLowerCase().includes("nearby") || prompt.toLowerCase().includes("recommend")) {
                const useMaps = prompt.toLowerCase().includes("nearby");
                let location: GeolocationCoordinates | null = null;
                if (useMaps) {
                    try {
                        const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject));
                        location = position.coords;
                    } catch (e) {
                        console.warn("Could not get location for maps grounding.");
                    }
                }
                response = await sendMessageWithGrounding(prompt, useMaps, location);
            } else if (prompt.length > 150 || prompt.toLowerCase().includes("analyze") || prompt.toLowerCase().includes("complex")) {
                 response = await sendComplexMessageWithThinking(prompt);
            } else {
                response = await sendMessageToAI(prompt);
            }

            if(response) {
                const responseText = response.text;
                try {
                    const jsonResponse = JSON.parse(responseText.replace(/```json\n?|```/g, ''));
                    if (Array.isArray(jsonResponse) && jsonResponse[0].name && jsonResponse[0].type === 'Venue') {
                        aiMessage = { vendors: jsonResponse as Vendor[] };
                    } else {
                         aiMessage = { text: responseText };
                    }
                } catch (e) {
                     aiMessage = { text: responseText };
                }
                
                const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
                if (groundingChunks) {
                    aiMessage.groundingSources = groundingChunks.map((chunk: any) => ({
                        title: chunk.web?.title || chunk.maps?.title || 'Source',
                        uri: chunk.web?.uri || chunk.maps?.uri,
                        type: chunk.web ? 'web' : 'maps',
                    })).filter((source: any) => source.uri);
                }
            }
            
            if (prompt.toLowerCase().includes("virtual try on")) {
                virtualTryOnState.current.stage = 'person';
                aiMessage = { text: "Of course! Please upload a photo of the clothing or outfit first." };
            }

            setMessages(prev => prev.filter(m => m.id !== loadingMessageId).concat({ id: loadingMessageId, sender: 'ai', ...aiMessage }));

        } catch (error) {
            console.error("Error sending message:", error);
            setMessages(prev => prev.filter(m => m.id !== loadingMessageId).concat({ id: loadingMessageId, sender: 'ai', text: "I'm having trouble connecting right now. Please try again later." }));
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            let promptText = "Please analyze this file.";
            if (virtualTryOnState.current.stage === 'person') {
                 promptText = "Here is the clothing item.";
            } else if (virtualTryOnState.current.stage === 'clothing') {
                 promptText = "Here is the person.";
            }
            await handleSendMessage(promptText, file);
        }
    };


    return (
        <div className="flex flex-col h-full bg-white rounded-t-2xl shadow-2xl">
            {isLiveChatOpen && <LiveChat onClose={() => setIsLiveChatOpen(false)} />}
            {/* Header */}
            <div className="p-4 border-b border-orange-100 flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-orange-800">Your Sarathi</h1>
                  <p className="text-sm text-gray-500">Planning for {weddingPlan.coupleNames.join(' & ')}</p>
                </div>
                <button 
                  onClick={() => setIsLiveChatOpen(true)}
                  className="p-2 rounded-full hover:bg-orange-100 text-orange-600 transition-colors"
                  title="Start Live Conversation"
                >
                  <MicIcon />
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'ai' && <BotIcon />}
                        <div className={`max-w-xl ${msg.sender === 'user' ? 'bg-orange-500 text-white' : 'bg-orange-100 text-gray-800'} rounded-2xl p-4 shadow-sm`}>
                            {msg.isLoading && <div className="flex items-center gap-2"><div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div><div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse [animation-delay:0.2s]"></div><div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse [animation-delay:0.4s]"></div></div>}
                            {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                            {msg.vendors && (
                                <div className="flex flex-wrap gap-4 mt-2">
                                    {msg.vendors.map((vendor, index) => <VendorCard key={index} vendor={vendor} />)}
                                </div>
                            )}
                            {msg.generatedImage && <img src={msg.generatedImage} alt="Generated" className="mt-2 rounded-lg" />}
                             {msg.virtualTryOn && (
                                <div>
                                    <p className="mb-2 font-semibold">Virtual Try-On Result:</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        <img src={msg.virtualTryOn.person} alt="Person" className="rounded-lg" title="Person"/>
                                        <img src={msg.virtualTryOn.clothing} alt="Clothing" className="rounded-lg" title="Clothing"/>
                                        <img src={msg.virtualTryOn.result} alt="Result" className="rounded-lg" title="Result"/>
                                    </div>
                                </div>
                            )}
                            {msg.groundingSources && msg.groundingSources.length > 0 && (
                                <div className="mt-4 border-t border-orange-200 pt-2">
                                    <h4 className="text-xs font-semibold text-gray-500 mb-1">Sources:</h4>
                                    <ul className="text-xs space-y-1">
                                        {msg.groundingSources.map(source => (
                                            <li key={source.uri}><a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{source.title}</a></li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        {msg.sender === 'user' && <UserIcon />}
                    </div>
                ))}
                 <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-orange-100">
                <div className="flex items-center bg-gray-100 rounded-full p-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage(input)}
                        placeholder="Ask your Sarathi anything..."
                        className="flex-1 bg-transparent outline-none px-4 text-gray-700"
                        disabled={isLoading}
                    />
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="p-2 text-gray-500 hover:text-orange-600 transition-colors">
                        <PaperclipIcon />
                    </button>
                    <button onClick={() => handleSendMessage(input)} disabled={isLoading || !input.trim()} className="p-2 rounded-full bg-orange-600 text-white hover:bg-orange-700 disabled:bg-gray-400 transition-colors">
                        <SendIcon />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chat;
