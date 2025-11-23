import React, { useState, useCallback } from 'react';
import { generateImage } from '../services/geminiService';
import { Spinner } from '../components/Spinner';
import { SparklesIcon } from '../components/icons';

const OutfitGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleSubmit = useCallback(async () => {
        if (!prompt) {
            setError('Please enter a description for the outfit.');
            return;
        }

        setIsLoading(true);
        setError('');
        setGeneratedImage(null);

        try {
            const imageB64 = await generateImage(prompt);
            setGeneratedImage(`data:image/png;base64,${imageB64}`);
        } catch (err) {
            console.error(err);
            setError('Sorry, could not generate the image. Please try a different prompt.');
        } finally {
            setIsLoading(false);
        }
    }, [prompt]);

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
            {/* Input Section */}
            <div className="bg-stone-900/40 rounded-2xl p-6 flex flex-col gap-6 backdrop-blur-md border border-stone-800 shadow-xl">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-orange-300 to-yellow-100">Describe an Outfit to Visualize</h2>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A stylish woman wearing a vintage leather jacket, a white silk blouse, and high-waisted dark blue jeans, walking on a rainy street in Paris at night."
                    className="w-full h-32 p-4 bg-stone-900/60 border border-stone-700 rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:outline-none transition-all resize-none text-white shadow-inner"
                    disabled={isLoading}
                />

                {error && <p className="text-red-400 text-sm bg-red-900/20 p-2 rounded">{error}</p>}

                <button
                    onClick={handleSubmit}
                    disabled={isLoading || !prompt}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-stone-900 font-bold py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] duration-300 shadow-lg"
                >
                    <SparklesIcon />
                    {isLoading ? 'Generating...' : 'Visualize Outfit'}
                </button>
            </div>

            {/* Output Section */}
            <div className="bg-stone-900/40 rounded-2xl p-6 backdrop-blur-md border border-stone-800 shadow-xl min-h-[400px] flex items-center justify-center">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <Spinner size="lg" />
                        <p className="mt-4 text-orange-200 animate-pulse">Creating your vision...</p>
                    </div>
                )}
                {!isLoading && !generatedImage && (
                    <div className="text-center text-stone-500">
                        <SparklesIcon />
                        <p className="mt-2">Your generated outfit will appear here.</p>
                    </div>
                )}
                {generatedImage && (
                    <img src={generatedImage} alt="Generated outfit" className="rounded-lg max-w-full max-h-[512px] w-auto h-auto object-contain shadow-2xl border border-stone-700" />
                )}
            </div>
        </div>
    );
};

export default OutfitGenerator;