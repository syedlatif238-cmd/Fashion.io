import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { Chat as ChatSession } from '@google/genai';
import { createChat, generateImage } from '../services/geminiService';
import { PaperAirplaneIcon, MicrophoneIcon, ChatBubbleIcon } from '../components/icons';
import { Spinner } from '../components/Spinner';

interface Message {
    role: 'user' | 'model';
    text: string;
    imageUrl?: string;
    isLoadingImage?: boolean;
}

// Extend the window object for SpeechRecognition
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

const Chat: React.FC = () => {
    const [chatSession, setChatSession] = useState<ChatSession | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // --- Speech Recognition State ---
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const speechSupported = useRef(false);

    useEffect(() => {
        // One-time setup for Speech Recognition
        if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            speechSupported.current = true;
            const recognition = recognitionRef.current;
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';
            
            recognition.onresult = (event: any) => {
                const transcript = event.results[event.results.length - 1][0].transcript;
                setUserInput(prev => (prev ? prev + ' ' : '') + transcript.trim());
            };
            
            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setError(`Speech recognition error: ${event.error}`);
            };
            
            recognition.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

     const toggleListening = () => {
        if (!speechSupported.current) return;
        
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

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
                    // Fix: Cast function call argument to string, as it's typed as `unknown`.
                    const description = fc.args.description as string;
                    
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
        <div className="max-w-4xl mx-auto h-full max-h-[75vh] flex flex-col bg-stone-900/40 rounded-2xl p-4 md:p-6 backdrop-blur-md border border-stone-800 shadow-2xl">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-orange-400 mb-4 px-2">Chat with your Stylist</h2>
            
            <div className="flex-grow overflow-y-auto mb-4 pr-2 custom-scrollbar">
                {messages.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-stone-500 gap-4">
                        <div className="p-4 bg-stone-800/50 rounded-full border border-stone-700">
                           <ChatBubbleIcon />
                        </div>
                        <p>Ask me to visualize an outfit for you!</p>
                    </div>
                )}
                <div className="space-y-6">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-lg rounded-2xl transition-all duration-300 shadow-md ${
                                msg.role === 'user' 
                                ? 'bg-gradient-to-br from-orange-600 to-yellow-600 text-white rounded-br-none shadow-orange-900/20' 
                                : 'bg-stone-800/80 text-stone-200 rounded-bl-none border border-stone-700'
                            }`}>
                                <div className="px-5 py-3">
                                  {msg.isLoadingImage && (
                                      <div className="flex flex-col items-center p-4">
                                          <Spinner />
                                          <p className="mt-2 text-sm text-stone-300">{msg.text}</p>
                                      </div>
                                  )}
                                  {msg.imageUrl && (
                                      <img src={msg.imageUrl} alt="Generated outfit" className="rounded-lg mb-2 max-w-sm border border-stone-600" />
                                  )}
                                  {msg.text && !msg.isLoadingImage && (
                                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                                  )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div ref={messagesEndRef} />
            </div>

            {error && <p className="text-red-400 text-sm mb-2 px-2 bg-red-900/20 p-2 rounded">{error}</p>}

            <form onSubmit={handleSubmit} className="flex items-center gap-2 md:gap-4 p-2 bg-stone-900/60 border border-stone-700 rounded-xl focus-within:ring-2 focus-within:ring-orange-500/50 focus-within:border-orange-500/50 transition-all shadow-inner">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type a message or describe an outfit..."
                    className="flex-grow p-2 bg-transparent focus:outline-none text-white placeholder-stone-500"
                    disabled={isLoading || !chatSession}
                    aria-label="Chat input"
                />
                {speechSupported.current && (
                    <button
                        type="button"
                        onClick={toggleListening}
                        className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-lg transition-all duration-300 ${
                            isListening
                                ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40'
                                : 'bg-stone-800 text-stone-400 hover:bg-orange-500 hover:text-white'
                        }`}
                        aria-label={isListening ? 'Stop listening' : 'Start listening'}
                        disabled={isLoading || !chatSession}
                    >
                        <MicrophoneIcon />
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isLoading || !userInput.trim() || !chatSession}
                    className="flex-shrink-0 flex items-center justify-center h-10 w-10 bg-gradient-to-r from-orange-500 to-yellow-500 text-stone-900 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-110 shadow-lg hover:shadow-orange-500/30"
                    aria-label="Send message"
                >
                    {isLoading ? <Spinner size="sm" /> : <PaperAirplaneIcon />}
                </button>
            </form>
        </div>
    );
};

export default Chat;