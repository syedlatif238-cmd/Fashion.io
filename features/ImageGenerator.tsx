import React, { useState, useCallback } from 'react';
import { generateImage } from '../services/geminiService';
import { Spinner } from '../components/Spinner';
import { SparklesIcon } from '../components/icons';

const ImageGenerator: React.FC = () => {
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
            <div className="bg-gray-800/50 rounded-2xl p-6 flex flex-col gap-6 backdrop-blur-sm border border-gray-700">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">Describe an Outfit to Visualize</h2>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A stylish woman wearing a vintage leather jacket, a white silk blouse, and high-waisted dark blue jeans, walking on a rainy street in Paris at night."
                    className="w-full h-32 p-4 bg-gray-900/70 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all resize-none"
                    disabled={isLoading}
                />

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <button
                    onClick={handleSubmit}
                    disabled={isLoading || !prompt}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 duration-300"
                >
                    <SparklesIcon />
                    {isLoading ? 'Generating...' : 'Visualize Outfit'}
                </button>
            </div>

            {/* Output Section */}
            <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm border border-gray-700 min-h-[400px] flex items-center justify-center">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <Spinner />
                        <p className="mt-4 text-gray-400">Creating your vision...</p>
                    </div>
                )}
                {!isLoading && !generatedImage && (
                    <div className="text-center text-gray-500">
                        <p>Your generated outfit will appear here.</p>
                    </div>
                )}
                {generatedImage && (
                    <img src={generatedImage} alt="Generated outfit" className="rounded-lg max-w-full max-h-[512px] w-auto h-auto object-contain" />
                )}
            </div>
        </div>
    );
};

export default ImageGenerator;
