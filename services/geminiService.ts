import { GoogleGenAI, Chat, GroundingChunk, FunctionDeclaration, Type } from "@google/genai";

// This creates a new client for each request, ensuring the latest API key from the environment is used.
const getAiClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        // This error will be caught by the UI components and handled gracefully.
        throw new Error("API_KEY environment variable not set. Please select an API key.");
    }
    return new GoogleGenAI({ apiKey });
};


interface FashionAdviceResponse {
    text: string;
    sources?: GroundingChunk[];
}

export async function getFashionAdvice(prompt: string, imageBase64: string, mimeType: string): Promise<FashionAdviceResponse> {
  const ai = getAiClient();
  try {
    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: imageBase64,
      },
    };

    const textPart = {
      text: prompt,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
          systemInstruction: "You are Fashio.AI, an expert fashion stylist. Analyze the user's clothing item and their request. Provide clear, helpful, and inspiring fashion advice. Use your search capabilities to find current trends and information. Format your response using markdown for readability (e.g., use lists for outfit suggestions). Give a detail info about what to wear and what type of hairstyle to chose based on the picture. Give natural hacks. Be specific and actionable.",
          tools: [{googleSearch: {}}],
      }
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    return { text: response.text, sources };
  } catch (error) {
    console.error("Error calling Gemini API for fashion advice:", error);
    // Re-throw the error to be handled by the calling component
    throw error;
  }
}

export async function generateImage(prompt: string): Promise<string> {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages[0].image.imageBytes;
        } else {
            throw new Error("No image was generated.");
        }

    } catch (error) {
        console.error("Error calling Gemini API for image generation:", error);
        // Re-throw the error to be handled by the calling component
        throw error;
    }
}

const generateOutfitImageFunctionDeclaration: FunctionDeclaration = {
    name: 'generateOutfitImage',
    description: 'Generates an image of an outfit based on a detailed description.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            description: {
                type: Type.STRING,
                description: 'A detailed description of the outfit, including clothing items, styles, colors, and setting.',
            },
        },
        required: ['description'],
    },
};


export function createChat(): Chat {
    const ai = getAiClient();
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: "You are Fashio.AI, a friendly and knowledgeable fashion chatbot. You can chat with users about style, trends, and clothing care. You can also visualize outfits for them. If the user asks you to show, draw, generate, or visualize an outfit, use the `generateOutfitImage` tool.",
            tools: [{ functionDeclarations: [generateOutfitImageFunctionDeclaration] }],
        }
    });
    return chat;
}
