
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

const getAiClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is not set");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// 1. AI Chatbot using gemini-3-pro-preview
export const createChatSession = () => {
  const ai = getAiClient();
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: "You are the Forge Oracle, an expert crypto trading assistant with 25 years of experience in market mechanics. You speak with authority, precision, and an industrial/cyberpunk tone. You analyze market trends for pump.fun, TRX, and other volatile assets.",
    },
  });
};

export const sendMessageToChat = async (chat: Chat, message: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await chat.sendMessage({ message });
    return response.text || "Systems error: No response text generated.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "Critical Failure: Unable to connect to the Oracle network.";
  }
};

// 2. Image Editing using gemini-2.5-flash-image
export const editImageInForge = async (base64Image: string, prompt: string): Promise<string | null> => {
  const ai = getAiClient();
  try {
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: 'image/png', // Assuming PNG for simplicity in this demo context
      },
    };
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
            imagePart,
            { text: prompt }
        ]
      },
    });

    // Check for image in response parts
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            // Find the image part, do not assume it is the first part.
            if (part.inlineData && part.inlineData.data) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
    }
    
    return null;
  } catch (error) {
    console.error("Forge Error:", error);
    throw error;
  }
};

// 3. Image Generation using gemini-3-pro-image-preview (Nano Banana Pro)
export const generateImageInForge = async (
    prompt: string, 
    size: '1K' | '2K' | '4K' = '1K', 
    aspectRatio: '1:1' | '16:9' | '4:3' | '3:4' | '9:16' = '1:1'
): Promise<string | null> => {
    const ai = getAiClient();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
            imageConfig: {
                imageSize: size,
                aspectRatio: aspectRatio
            }
        }
      });
  
      if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
              if (part.inlineData && part.inlineData.data) {
                  return `data:image/png;base64,${part.inlineData.data}`;
              }
          }
      }
      return null;
    } catch (error) {
      console.error("Forge Gen Error:", error);
      throw error;
    }
};

// 4. Market Analysis using gemini-2.5-flash
export const analyzeMarketData = async (marketSummary: string): Promise<string> => {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze this crypto market data and provide a concise, industrial-style tactical summary for a high-frequency trader. Highlight volatility and potential opportunities.\n\nData Snapshot: ${marketSummary}`
        });
        return response.text || "Tactical analysis unavailable.";
    } catch (error) {
        console.error("Analysis Error:", error);
        return "Market uplink unstable. Unable to compute tactical summary.";
    }
};

// 5. Deep Thinking using gemini-3-pro-preview with thinkingBudget
export const performDeepStrategy = async (query: string): Promise<string> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: query,
      config: {
        thinkingConfig: {
            thinkingBudget: 32768, // Max budget for deep reasoning
        }
      }
    });
    return response.text || "Analysis incomplete.";
  } catch (error) {
    console.error("Deep Strategy Error:", error);
    return "Strategic computation failed due to network entropy.";
  }
};
