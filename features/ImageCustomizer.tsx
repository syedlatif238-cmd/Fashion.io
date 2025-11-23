import React, { useState, useCallback } from 'react';
import { fileToBase64 } from '../utils/fileUtils';
import { editImage } from '../services/geminiService';
import { ImageUpload } from '../components/ImageUpload';
import { Spinner } from '../components/Spinner';
import { EditIcon, DownloadIcon } from '../components/icons';

const ExamplePromptButton: React.FC<{ onClick: () => void; children: React.ReactNode; }> = ({ onClick, children }) => (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-xs font-medium bg-stone-800/60 text-stone-300 border border-stone-700 rounded-full hover:bg-orange-500/20 hover:text-orange-200 hover:border-orange-500/50 transition-all duration-300"
    >
      {children}
    </button>
);


const ImageCustomizer: React.FC = () => {
    // Input state
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('');

    // Output state
    const [editedImage, setEditedImage] = useState<string | null>(null);

    // Control state
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isImageProcessing, setIsImageProcessing] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleAddImage = (file: File) => {
        if (file) {
            setIsImageProcessing(true);
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                // Add slight delay for visual feedback
                setTimeout(() => {
                    setImagePreview(reader.result as string);
                    setIsImageProcessing(false);
                }, 500);
            };
            reader.readAsDataURL(file);
            setError('');
            setEditedImage(null); // Reset output when input changes
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setEditedImage(null);
        setError('');
    };
    
    const handleExampleClick = (examplePrompt: string) => {
        setPrompt(examplePrompt);
    };

    const handleSubmit = useCallback(async () => {
        if (!imageFile || !prompt.trim()) {
            setError('Please upload an image and provide editing instructions.');
            return;
        }

        setIsLoading(true);
        setError('');
        setEditedImage(null);

        try {
            const finalPrompt = prompt.trim();
            const { mimeType, data } = await fileToBase64(imageFile);
            const editedImageB64 = await editImage(finalPrompt, data, mimeType);
            setEditedImage(`data:image/png;base64,${editedImageB64}`);
        } catch (err) {
            console.error(err);
            setError('Sorry, could not customize the image. Please try a different prompt.');
        } finally {
            setIsLoading(false);
        }
    }, [imageFile, prompt]);
    
    const handleDownload = () => {
        if (!editedImage) return;
        const link = document.createElement('a');
        link.href = editedImage;
        link.download = `fashio-ai-edit-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="bg-stone-900/40 rounded-2xl p-6 flex flex-col gap-6 backdrop-blur-md border border-stone-800 shadow-xl self-start">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-yellow-200">1. Upload Image</h2>
                <ImageUpload 
                    imagePreviews={imagePreview ? [imagePreview] : []}
                    onAddImage={handleAddImage}
                    onRemoveImage={handleRemoveImage}
                    maxFiles={1}
                    disabled={isLoading}
                    isLoading={isImageProcessing}
                />
                
                <div className="flex flex-col gap-4">
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-yellow-200">2. Instruct Your AI Assistant</h2>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., Change the background to a sunny beach. Make the jacket red..."
                        className="w-full h-32 p-4 bg-stone-900/60 border border-stone-700 rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:outline-none transition-all resize-none text-white shadow-inner placeholder-stone-500"
                        disabled={isLoading || isImageProcessing}
                    />
                     <div className="flex flex-col gap-2">
                        <p className="text-sm text-stone-400">Need inspiration? Try one of these:</p>
                        <div className="flex flex-wrap gap-2">
                            <ExamplePromptButton onClick={() => handleExampleClick("Change the background to a bustling Tokyo street at night.")}>
                                🌃 Change background
                            </ExamplePromptButton>
                            <ExamplePromptButton onClick={() => handleExampleClick("Make my blue shirt a vibrant red color.")}>
                                🎨 Change color
                            </ExamplePromptButton>
                            <ExamplePromptButton onClick={() => handleExampleClick("Add a pair of cool sunglasses.")}>
                                😎 Add object
                            </ExamplePromptButton>
                            <ExamplePromptButton onClick={() => handleExampleClick("Turn this into a vintage black and white photograph.")}>
                                🎞️ Apply filter
                            </ExamplePromptButton>
                        </div>
                    </div>
                </div>
                
                {error && <p className="text-red-400 text-sm bg-red-900/20 p-2 rounded border border-red-900/50">{error}</p>}

                <button
                    onClick={handleSubmit}
                    disabled={isLoading || isImageProcessing || !imageFile || !prompt.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-stone-900 font-bold py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] duration-300 shadow-lg"
                >
                    <EditIcon />
                    {isLoading ? 'Customizing...' : 'Customize Image'}
                </button>
            </div>

            {/* Output Section */}
            <div className="bg-stone-900/40 rounded-2xl p-6 backdrop-blur-md border border-stone-800 shadow-xl min-h-[400px] flex flex-col items-center justify-center self-start">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-yellow-200 w-full mb-4">Result</h2>
                 <div className="w-full flex-grow bg-stone-900/50 rounded-xl min-h-[256px] flex items-center justify-center p-4 border border-stone-800">
                    {isLoading && (
                        <div className="flex flex-col items-center">
                            <Spinner size="lg"/>
                            <p className="mt-4 text-orange-200 animate-pulse">Applying magic...</p>
                        </div>
                    )}
                    {!isLoading && !editedImage && <p className="text-stone-500">Your edited image will appear here</p>}
                    {editedImage && (
                        <img src={editedImage} alt="Customized fashion item" className="rounded-lg max-w-full max-h-[400px] shadow-2xl" />
                    )}
                </div>
                {editedImage && !isLoading && (
                    <button 
                        onClick={handleDownload}
                        className="w-full mt-4 flex items-center justify-center gap-2 bg-stone-800/80 hover:bg-stone-700 text-stone-200 font-medium py-3 px-4 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-stone-900 border border-stone-700"
                        aria-label="Download customized image"
                    >
                        <DownloadIcon />
                        <span>Download Image</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default ImageCustomizer;