import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { Chat as ChatSession } from '@google/genai';
import { createChat, generateImage } from '../services/geminiService';
import { PaperAirplaneIcon } from '../components/icons';
import { Spinner } from '../components/Spinner';

interface Message {
    role: 'user' | 'model';
    text: string;
    imageUrl?: string;
    isLoadingImage?: boolean;
}

const Chat: React.FC = () => {
    const [chatSession, setChatSession] = useState<ChatSession | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            const session = createChat();
            setChatSession(session);
        } catch (err: any) {
            console.error("Failed to create chat session:", err);
            setError("Could not initialize the chat. Please refresh the page.");
        }
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading || !chatSession) return;

        const newUserMessage: Message = { role: 'user', text: userInput };
        setMessages(prev => [...prev, newUserMessage]);
        const currentInput = userInput;
        setUserInput('');
        setIsLoading(true);
        setError('');

        try {
            const response = await chatSession.sendMessage({ message: currentInput });
            const functionCalls = response.functionCalls;

            if (functionCalls && functionCalls.length > 0) {
                const fc = functionCalls[0];
                if (fc.name === 'generateOutfitImage') {
                    const description = fc.args.description;
                    
                    const imagePlaceholderMessage: Message = {
                        role: 'model',
                        text: `Generating an image of: "${description}"`,
                        isLoadingImage: true,
                    };
                    setMessages(prev => [...prev, imagePlaceholderMessage]);

                    const imageB64 = await generateImage(description);
                    const imageUrl = `data:image/png;base64,${imageB64}`;

                    setMessages(prev => prev.map(msg => 
                        msg === imagePlaceholderMessage ? { ...msg, imageUrl, isLoadingImage: false, text: '' } : msg
                    ));

                    const toolResponse = await chatSession.sendMessage({
                        message: [
                            {
                                functionResponse: {
                                    id: fc.id,
                                    name: fc.name,
                                    response: { success: true, message: "Image generated successfully." },
                                }
                            }
                        ]
                    });

                    const finalResponseText = toolResponse.text;
                    if (finalResponseText) {
                        setMessages(prev => [...prev, { role: 'model', text: finalResponseText }]);
                    }
                }
            } else {
                const textResponse = response.text;
                setMessages(prev => [...prev, { role: 'model', text: textResponse }]);
            }
        } catch (err: any) {
            console.error("Error sending message:", err);
            setError("Sorry, something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto h-full max-h-[75vh] flex flex-col bg-gray-800/50 rounded-2xl p-4 md:p-6 backdrop-blur-sm border border-gray-700">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-500 mb-4 px-2">Chat with your Stylist</h2>
            
            <div className="flex-grow overflow-y-auto mb-4 pr-2">
                {messages.length === 0 && !isLoading && (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <p>Ask me to visualize an outfit for you!</p>
                    </div>
                )}
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-lg rounded-2xl transition-all duration-300 ${msg.role === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                                <div className="px-4 py-2">
                                  {msg.isLoadingImage && (
                                      <div className="flex flex-col items-center p-4">
                                          <Spinner />
                                          <p className="mt-2 text-sm text-gray-300">{msg.text}</p>
                                      </div>
                                  )}
                                  {msg.imageUrl && (
                                      <img src={msg.imageUrl} alt="Generated outfit" className="rounded-lg mb-2 max-w-sm" />
                                  )}
                                  {msg.text && !msg.isLoadingImage && (
                                      <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                                  )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div ref={messagesEndRef} />
            </div>

            {error && <p className="text-red-400 text-sm mb-2 px-2">{error}</p>}

            <form onSubmit={handleSubmit} className="flex items-center gap-2 md:gap-4 p-1 bg-gray-900/70 border border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-green-500">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type a message or describe an outfit..."
                    className="flex-grow p-2 bg-transparent focus:outline-none"
                    disabled={isLoading || !chatSession}
                    aria-label="Chat input"
                />
                <button
                    type="submit"
                    disabled={isLoading || !userInput.trim() || !chatSession}
                    className="flex-shrink-0 flex items-center justify-center h-9 w-9 bg-gradient-to-r from-green-500 to-cyan-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-110"
                    aria-label="Send message"
                >
                    {isLoading ? <Spinner size="sm" /> : <PaperAirplaneIcon />}
                </button>
            </form>
        </div>
    );
};

export default Chat;
