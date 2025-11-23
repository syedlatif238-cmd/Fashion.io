import React, { useState, useCallback, useEffect, useRef } from 'react';
import { getFashionAdvice, generateImage, getOutfitRating, OutfitRating, getRatingChatResponse, ChatMessage } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { ImageUpload } from '../components/ImageUpload';
import { ResponseDisplay } from '../components/ResponseDisplay';
import { RatingDisplay } from '../components/RatingDisplay';
import { SparklesIcon, BookmarkIcon, MicrophoneIcon, StarIcon, PaperAirplaneIcon } from '../components/icons';
import { GroundingChunk } from '@google/genai';
import { User } from '../App';
import { Spinner } from '../components/Spinner';

interface SavedOutfit {
    id: string;
    image: string; // original item
    prompt: string; // user question
    advice: string; // text advice
    savedAt: string;
    generatedImage?: string | null;
}

interface StyleAdviserProps {
    user: User;
}

// Extend the window object for SpeechRecognition
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

const StyleAdviser: React.FC<StyleAdviserProps> = ({ user }) => {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [prompt, setPrompt] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [sources, setSources] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // --- Image Processing State ---
  const [isImageProcessing, setIsImageProcessing] = useState<boolean>(false);

  // --- Image Generation State ---
  const [imagePrompt, setImagePrompt] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string>('');

  // --- Outfit Rating State ---
  const [rating, setRating] = useState<OutfitRating | null>(null);
  const [isRating, setIsRating] = useState<boolean>(false);
  const [ratingError, setRatingError] = useState<string>('');
  const [ratingChatMessages, setRatingChatMessages] = useState<ChatMessage[]>([]);
  const [ratingChatInput, setRatingChatInput] = useState<string>('');
  const [isRatingChatLoading, setIsRatingChatLoading] = useState<boolean>(false);
  const [ratingChatError, setRatingChatError] = useState<string>('');


  // --- Speech Recognition State ---
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const speechSupported = useRef(false);

  useEffect(() => {
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
            setPrompt(prev => (prev ? prev + ' ' : '') + transcript.trim());
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
    setIsSaved(false);
  }, [response, generatedImage]);
  
  const resetOutputs = () => {
    setResponse('');
    setSources([]);
    setImagePrompt('');
    setGeneratedImage(null);
    setGenerationError('');
    setRating(null);
    setRatingError('');
    setRatingChatMessages([]);
    setRatingChatInput('');
    setRatingChatError('');
  };


  const handleAddImage = (file: File) => {
    if (file && imageFiles.length < 5) { // max 5 files
      setIsImageProcessing(true);
      setImageFiles(prev => [...prev, file]);
      const reader = new FileReader();
      reader.onloadend = () => {
        // Artificial delay for clearer UI feedback
        setTimeout(() => {
            setImagePreviews(prev => [...prev, reader.result as string]);
            setIsImageProcessing(false);
        }, 500);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
      setImageFiles(prev => prev.filter((_, index) => index !== indexToRemove));
      setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
  };


  const handleSubmit = useCallback(async () => {
    if (imageFiles.length === 0 || !prompt) {
      setError('Please upload at least one image and enter a prompt.');
      return;
    }

    setIsLoading(true);
    setError('');
    resetOutputs();

    try {
      const imagePayloads = await Promise.all(
        imageFiles.map(file => fileToBase64(file).then(result => ({
            imageBase64: result.data,
            mimeType: result.mimeType,
        })))
      );
      const apiResponse = await getFashionAdvice(prompt, imagePayloads);
      
      const resultText = apiResponse.text;
      const visualizeIndex = resultText.indexOf('VISUALIZE:');

      if (visualizeIndex !== -1) {
          const adviceText = resultText.substring(0, visualizeIndex).trim();
          const promptText = resultText.substring(visualizeIndex + 'VISUALIZE:'.length).trim();
          setResponse(adviceText);
          setImagePrompt(promptText);
      } else {
          setResponse(resultText);
          setImagePrompt('');
      }
      setSources(apiResponse.sources || []);

    } catch (err: any) {
      console.error(err);
      setError('Sorry, something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [imageFiles, prompt]);

  const handleGetRating = useCallback(async () => {
    if (imageFiles.length === 0) {
        setRatingError('Please upload an image to be rated.');
        return;
    }
    setIsRating(true);
    setRatingError('');
    resetOutputs();

    try {
      const imagePayloads = await Promise.all(
        imageFiles.map(file => fileToBase64(file).then(result => ({
            imageBase64: result.data,
            mimeType: result.mimeType,
        })))
      );
      const ratingResponse = await getOutfitRating(imagePayloads);
      setRating(ratingResponse);
    } catch (err) {
        console.error(err);
        setRatingError('Sorry, could not get a rating. Please try again.');
    } finally {
        setIsRating(false);
    }
  }, [imageFiles]);

  const handleRatingChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentInput = ratingChatInput.trim();
    if (!currentInput || !rating || isRatingChatLoading) return;

    const newUserMessage: ChatMessage = { role: 'user', text: currentInput };
    const updatedMessages = [...ratingChatMessages, newUserMessage];
    setRatingChatMessages(updatedMessages);
    setRatingChatInput('');
    setIsRatingChatLoading(true);
    setRatingChatError('');

    try {
        const responseText = await getRatingChatResponse(rating, ratingChatMessages, currentInput);
        const modelMessage: ChatMessage = { role: 'model', text: responseText };
        setRatingChatMessages([...updatedMessages, modelMessage]);
    } catch (err) {
        setRatingChatError('Sorry, something went wrong. Please try again.');
        // Revert message list on error
        setRatingChatMessages(ratingChatMessages);
    } finally {
        setIsRatingChatLoading(false);
    }
};

  const handleGenerateImage = useCallback(async () => {
    if (!imagePrompt) {
        setGenerationError('The visualization prompt is empty.');
        return;
    }
    setIsGeneratingImage(true);
    setGenerationError('');
    setGeneratedImage(null);
    try {
        const imageB64 = await generateImage(imagePrompt);
        setGeneratedImage(`data:image/png;base64,${imageB64}`);
    } catch (err) {
        console.error(err);
        setGenerationError('Sorry, could not generate the image. Please try a different prompt.');
    } finally {
        setIsGeneratingImage(false);
    }
  }, [imagePrompt]);

  const handleSaveOutfit = () => {
    if (imagePreviews.length === 0 || !prompt || !response || !user) return;
    const newOutfit: SavedOutfit = {
        id: Date.now().toString(),
        image: imagePreviews[0], // Save the first image as the cover
        prompt: prompt,
        advice: response,
        savedAt: new Date().toISOString(),
        generatedImage: generatedImage,
    };
    const storageKey = `fashio-ai-collection-${user.id}`;
    try {
        const storedCollection = localStorage.getItem(storageKey);
        const collection = storedCollection ? JSON.parse(storedCollection) : [];
        collection.push(newOutfit);
        localStorage.setItem(storageKey, JSON.stringify(collection));
        setIsSaved(true);
    } catch (error) {
        console.error("Failed to save outfit to localStorage", error);
        setError("Could not save the outfit. Please try again.");
    }
  };
  
  const isBusy = isLoading || isGeneratingImage || isRating || isRatingChatLoading;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Input Section */}
      <div className="bg-stone-900/40 rounded-2xl p-6 flex flex-col gap-6 backdrop-blur-md border border-stone-800 shadow-xl self-start">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-orange-300 to-yellow-100">1. Upload Your Items</h2>
        <ImageUpload 
            imagePreviews={imagePreviews} 
            onAddImage={handleAddImage}
            onRemoveImage={handleRemoveImage}
            maxFiles={5}
            disabled={isBusy}
            isLoading={isImageProcessing}
         />
        
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-orange-300 to-yellow-100">2. Ask for Advice</h2>
        <div className="relative w-full group">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., How can I combine these items for a casual night out? What's missing to complete this look?"
              className="w-full h-32 p-4 pr-12 bg-stone-900/60 border border-stone-700 rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 focus:outline-none transition-all resize-none text-stone-200 placeholder-stone-500 shadow-inner"
              disabled={isBusy || isImageProcessing}
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/10 to-yellow-500/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300"></div>

            {speechSupported.current && (
                <button
                    type="button"
                    onClick={toggleListening}
                    className={`absolute bottom-3 right-3 p-2 rounded-full transition-all duration-300 ${
                        isListening 
                            ? 'bg-red-500 text-white animate-pulse shadow-red-500/50 shadow-lg' 
                            : 'bg-stone-800 text-stone-400 hover:bg-orange-500 hover:text-white'
                    }`}
                    aria-label={isListening ? 'Stop listening' : 'Start listening'}
                    disabled={isBusy || isImageProcessing}
                >
                    <MicrophoneIcon />
                </button>
            )}
        </div>
        
        {error && <p className="text-red-400 text-sm bg-red-900/20 p-2 rounded border border-red-900/50">{error}</p>}
        {ratingError && !rating && <p className="text-red-400 text-sm bg-red-900/20 p-2 rounded border border-red-900/50">{ratingError}</p>}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handleSubmit}
              disabled={isBusy || isImageProcessing || imageFiles.length === 0 || !prompt}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-stone-900 font-bold py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] duration-300 shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)] hover:shadow-[0_0_20px_-3px_rgba(245,158,11,0.5)]"
            >
              <SparklesIcon />
              {isLoading ? 'Thinking...' : 'Get Advice'}
            </button>
            <button
              onClick={handleGetRating}
              disabled={isBusy || isImageProcessing || imageFiles.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-stone-800 border border-stone-700 hover:border-orange-500/50 hover:bg-stone-700/80 text-orange-400 hover:text-orange-300 font-bold py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] duration-300"
            >
              <StarIcon />
              {isRating ? 'Rating...' : 'Rate My Look'}
            </button>
        </div>
      </div>

      {/* Output Section */}
      <div className="bg-stone-900/40 rounded-2xl backdrop-blur-md border border-stone-800 shadow-xl flex flex-col h-full overflow-hidden">
        <div className="p-6 flex flex-col h-full">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-orange-300 to-yellow-100 mb-4">Your AI Stylist Says...</h2>
            <div className="flex-grow">
                 <ResponseDisplay response={response} isLoading={isLoading} sources={sources} />
            </div>
            
            {(isRating || rating) && (
                <div className="mt-6 pt-6 border-t border-stone-700/50">
                     <RatingDisplay rating={rating} isLoading={isRating} error={ratingError}/>

                     {rating && !isRating && (
                        <div className="mt-6 animate-fade-in-up">
                            <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-orange-400 mb-4">Chat about your rating</h3>
                            <div className="space-y-4 max-h-60 overflow-y-auto pr-2 mb-4 border-b border-stone-700/50 pb-4 custom-scrollbar">
                                {ratingChatMessages.map((msg, index) => (
                                    <div key={index} className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-md rounded-2xl text-sm px-4 py-3 shadow-md backdrop-blur-sm ${
                                            msg.role === 'user' 
                                            ? 'bg-gradient-to-br from-orange-600 to-yellow-600 text-white rounded-br-none shadow-orange-900/20' 
                                            : 'bg-stone-800/80 text-stone-200 rounded-bl-none border border-stone-700'
                                        }`}>
                                            <p className="whitespace-pre-wrap">{msg.text}</p>
                                        </div>
                                    </div>
                                ))}
                                {isRatingChatLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-stone-800/80 rounded-2xl rounded-bl-none px-4 py-2 border border-stone-700">
                                            <Spinner size="sm" />
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {ratingChatError && <p className="text-red-400 text-sm mb-2">{ratingChatError}</p>}

                            <form onSubmit={handleRatingChatSubmit} className="flex items-center gap-2 mt-2">
                                <input
                                    type="text"
                                    value={ratingChatInput}
                                    onChange={(e) => setRatingChatInput(e.target.value)}
                                    placeholder="Ask a follow-up question..."
                                    className="flex-grow p-3 bg-stone-900/60 border border-stone-700 rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:outline-none placeholder-stone-500"
                                    disabled={isRatingChatLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={isRatingChatLoading || !ratingChatInput.trim()}
                                    className="flex-shrink-0 flex items-center justify-center h-11 w-11 bg-gradient-to-r from-orange-500 to-yellow-500 text-stone-900 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-110 shadow-lg hover:shadow-orange-500/30"
                                    aria-label="Send message"
                                >
                                    <PaperAirplaneIcon />
                                </button>
                            </form>
                        </div>
                     )}
                </div>
            )}
            
            {!isLoading && imagePrompt && (
                <div className="mt-6 pt-6 border-t border-stone-700/50">
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-yellow-200 mb-4">3. Visualize the Look</h2>
                    <p className="text-sm text-stone-400 mb-4">You can edit the description below to customize the generated image.</p>
                    <textarea
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        className="w-full h-28 p-4 bg-stone-900/60 border border-stone-700 rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:outline-none transition-all resize-none text-stone-200 shadow-inner"
                        disabled={isGeneratingImage}
                    />
                    <button
                        onClick={handleGenerateImage}
                        disabled={isGeneratingImage || !imagePrompt}
                        className="w-full mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-stone-900 font-bold py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] duration-300 shadow-lg hover:shadow-orange-500/20"
                    >
                        <SparklesIcon />
                        {isGeneratingImage ? 'Generating...' : 'Generate Image'}
                    </button>
                    {generationError && <p className="text-red-400 text-sm mt-2">{generationError}</p>}
                    
                    <div className="mt-4 bg-stone-900/50 rounded-xl min-h-[256px] flex items-center justify-center p-4 border border-stone-800">
                        {isGeneratingImage && <Spinner />}
                        {!isGeneratingImage && !generatedImage && <p className="text-stone-500">Image will appear here</p>}
                        {generatedImage && <img src={generatedImage} alt="Generated outfit visualization" className="rounded-lg max-w-full max-h-[400px] shadow-2xl" />}
                    </div>
                </div>
            )}

            {!isLoading && response && imagePreviews.length > 0 && (
                <div className="mt-4 pt-4 border-t border-stone-700/50">
                    <button
                        onClick={handleSaveOutfit}
                        disabled={isSaved}
                        className="w-full flex items-center justify-center gap-2 bg-stone-800/80 hover:bg-stone-700 text-stone-200 font-medium py-3 px-4 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-stone-700/80 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-stone-900 border border-stone-700 hover:border-orange-500/30"
                    >
                        <BookmarkIcon />
                        {isSaved ? 'Saved to Collection' : 'Save Outfit'}
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default StyleAdviser;