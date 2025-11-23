import { GoogleGenAI, Chat, GroundingChunk, FunctionDeclaration, Type, Modality } from "@google/genai";

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

export interface OutfitRating {
    overallScore: number;
    outfitAnalysis: {
        score: number;
        comments: string;
    };
    facialAnalysis: {
        score: number;
        comments: string;
    };
    summary: string;
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}


export async function getFashionAdvice(prompt: string, images: { imageBase64: string, mimeType: string }[]): Promise<FashionAdviceResponse> {
  const ai = getAiClient();
  try {
    const imageParts = images.map(image => ({
      inlineData: {
        mimeType: image.mimeType,
        data: image.imageBase64,
      },
    }));

    const textPart = {
      text: prompt,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [...imageParts, textPart] },
      config: {
          systemInstruction: "You are Fashio.AI, an expert fashion stylist. The user has provided one or more images of clothing items. Analyze the user's clothing items and their request. Provide clear, helpful, and inspiring fashion advice on how to combine them or what to add. Use markdown for readability. Be specific and actionable. IMPORTANT: After your main advice, add a new section starting with the keyword 'VISUALIZE:'. The text following this keyword should be a single, detailed paragraph describing a complete outfit based on your advice, suitable for an AI image generator. This description should be vivid, including clothing items, colors, styles, and a potential setting.",
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

export async function getOutfitRating(images: { imageBase64: string, mimeType: string }[]): Promise<OutfitRating> {
  const ai = getAiClient();
  try {
    const imageParts = images.map(image => ({
      inlineData: {
        mimeType: image.mimeType,
        data: image.imageBase64,
      },
    }));

    const textPart = {
      text: "Please rate the outfit and, if a face is clearly visible, the facial beauty and symmetry. Provide scores and constructive, positive feedback.",
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [...imageParts, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                overallScore: {
                    type: Type.NUMBER,
                    description: "An overall score from 1 to 10 for the entire look, including outfit and facial aesthetics. Can be a decimal."
                },
                outfitAnalysis: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.NUMBER, description: "A score from 1 to 10 for the outfit only. Can be a decimal." },
                        comments: { type: Type.STRING, description: "Constructive feedback on the outfit's color coordination, style, fit, and occasion appropriateness." }
                    },
                    required: ['score', 'comments'],
                },
                facialAnalysis: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.NUMBER, description: "A score from 1 to 10 for facial beauty and symmetry. Be positive and respectful. If no face is visible, score 0." },
                        comments: { type: Type.STRING, description: "Positive comments on facial features, symmetry, and harmony. Focus on strengths. If no face is visible, state that." }
                    },
                    required: ['score', 'comments'],
                },
                summary: {
                    type: Type.STRING,
                    description: "A final summary with encouraging words and one key suggestion for improvement."
                }
            },
            required: ['overallScore', 'outfitAnalysis', 'facialAnalysis', 'summary'],
        },
      }
    });
    
    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as OutfitRating;
  } catch (error) {
    console.error("Error calling Gemini API for outfit rating:", error);
    throw error;
  }
}

export async function getRatingChatResponse(
    initialRating: OutfitRating,
    chatHistory: ChatMessage[],
    newUserMessage: string
): Promise<string> {
    const ai = getAiClient();
    try {
        const history = chatHistory.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }],
        }));

        const contents = [
            ...history,
            { role: 'user', parts: [{ text: newUserMessage }] }
        ];

        const systemInstruction = `You are Fashio.AI, an expert fashion stylist continuing a conversation with a user about a rating you just gave them for an image they previously uploaded.
The initial rating you provided was: ${JSON.stringify(initialRating)}.
You must act as if you are continuing the same conversation. Be encouraging, positive, and helpful.

**IMPORTANT RULES:**
1. Maintain the context of the initial rating and the conversation history. The user has not re-uploaded the image, so refer to your memory of it based on the initial rating.
2. If the user asks to be compared to the rest of the world, or for a percentage-based beauty score (e.g., 'am I in the top 10%?', 'how many people are less beautiful than me?'), you **MUST NOT** provide a quantitative answer.
3. Instead of a quantitative comparison, you must gently decline by explaining that beauty is subjective, diverse, and cannot be measured on a single scale. Then, pivot to a positive and empowering statement about the user's unique features, referencing your original analysis if possible. Example response: "That's a thoughtful question! Beauty is wonderfully diverse and isn't something that can be ranked with a number or percentage. Everyone's appeal is unique. Based on my analysis, you have very striking features, and the way your outfit complements your style is fantastic. Let's focus on what makes you uniquely you!"
4. For all other questions, provide helpful, specific fashion and style advice.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
            }
        });
        
        return response.text;

    } catch (error) {
        console.error("Error calling Gemini API for rating chat:", error);
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

export async function editImage(prompt: string, imageBase64: string, mimeType: string): Promise<string> {
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
      model: 'gemini-2.5-flash-image',
      contents: { parts: [imagePart, textPart] },
      config: {
          responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data; // This is the base64 string
      }
    }
    
    throw new Error("No image was returned from the API.");

  } catch (error) {
    console.error("Error calling Gemini API for image editing:", error);
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