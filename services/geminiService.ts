
import { GoogleGenAI, Chat, GenerateContentResponse, Type, Modality } from "@google/genai";
import { SANSKARA_AI_SYSTEM_PROMPT } from '../constants';

// NOTE: process.env.API_KEY is magically available in this environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
let chat: Chat | null = null;

const getChat = (): Chat => {
  if (!chat) {
    chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SANSKARA_AI_SYSTEM_PROMPT,
      },
    });
  }
  return chat;
};

export const sendMessageToAI = async (message: string) => {
  const chatInstance = getChat();
  const result = await chatInstance.sendMessage({ message });
  return result;
};

export const analyzeImage = async (prompt: string, imageBase64: string, mimeType: string) => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { text: prompt },
                { inlineData: { data: imageBase64, mimeType } }
            ]
        }
    });
    return response;
};

export const analyzeVideo = async (prompt: string) => {
    // Placeholder for video analysis. Actual video analysis requires more complex processing.
    // This function simulates a call to a more capable model.
    console.log("Using gemini-2.5-pro for complex video analysis prompt.");
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `(Simulating Video Analysis) User wants to know: "${prompt}". Based on the hypothetical video content, provide a detailed analysis.`
    });
    return response;
};


export const generateImage = async (prompt: string) => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '1:1',
        },
    });
    return response.generatedImages[0]?.image?.imageBytes;
};

export const editImage = async (prompt: string, imageBase64: string, mimeType: string) => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: imageBase64, mimeType } },
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }
    return null;
};

export const virtualTryOn = async (personImage: {base64: string, mimeType: string}, clothingImage: {base64: string, mimeType: string}) => {
    const prompt = "Virtually place the clothing from the second image onto the person in the first image. Ensure the fit and style look natural. Output only the resulting image.";
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: personImage.base64, mimeType: personImage.mimeType } },
                { inlineData: { data: clothingImage.base64, mimeType: clothingImage.mimeType } },
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }
    return null;
};

export const sendMessageWithGrounding = async (message: string, useMaps: boolean = false, location: GeolocationCoordinates | null = null) => {
    const tools: any[] = [{ googleSearch: {} }];
    if (useMaps) {
        tools.push({ googleMaps: {} });
    }
    
    const toolConfig: any = {};
    if (useMaps && location) {
        toolConfig.retrievalConfig = {
            latLng: {
                latitude: location.latitude,
                longitude: location.longitude,
            }
        };
    }

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: message,
        config: { tools },
        ...(Object.keys(toolConfig).length > 0 && { toolConfig }),
    });
    return response;
};

export const sendComplexMessageWithThinking = async (message: string) => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: message,
        config: {
            thinkingConfig: { thinkingBudget: 32768 }
        }
    });
    return response;
};
