import React, { useState, useCallback } from 'react';
import { getFashionAdvice } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { ImageUpload } from '../components/ImageUpload';
import { ResponseDisplay } from '../components/ResponseDisplay';
import { SparklesIcon } from '../components/icons';
import { GroundingChunk } from '@google/genai';

const StyleAdviser: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [sources, setSources] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleImageChange = (file: File | null) => {
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setError('');
    }
  };

  const handleRemoveImage = () => {
      if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
      }
      setImageFile(null);
      setImagePreview(null);
  }

  const handleSubmit = useCallback(async () => {
    if (!imageFile || !prompt) {
      setError('Please upload an image and enter a prompt.');
      return;
    }

    setIsLoading(true);
    setError('');
    setResponse('');
    setSources([]);

    try {
      const { mimeType, data } = await fileToBase64(imageFile);
      const { text, sources } = await getFashionAdvice(prompt, data, mimeType);
      setResponse(text);
      setSources(sources || []);
    } catch (err: any) {
      console.error(err);
      setError('Sorry, something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, prompt]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Input Section */}
      <div className="bg-gray-800/50 rounded-2xl p-6 flex flex-col gap-6 backdrop-blur-sm border border-gray-700">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">1. Upload Your Item</h2>
        <ImageUpload 
            imagePreview={imagePreview} 
            onImageChange={handleImageChange}
            onRemoveImage={handleRemoveImage}
         />
        
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">2. Ask for Advice</h2>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., What can I wear with this for a casual night out? What are current trends for this item?"
          className="w-full h-32 p-4 bg-gray-900/70 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all resize-none"
          disabled={isLoading}
        />
        
        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={isLoading || !imageFile || !prompt}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 duration-300"
        >
          <SparklesIcon />
          {isLoading ? 'Thinking...' : 'Get Fashion Advice'}
        </button>
      </div>

      {/* Output Section */}
      <div className="bg-gray-800/50 rounded-2xl backdrop-blur-sm border border-gray-700">
        <div className="p-6 flex flex-col h-full">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-4">Your AI Stylist Says...</h2>
            <div className="flex-grow">
                 <ResponseDisplay response={response} isLoading={isLoading} sources={sources} />
            </div>
        </div>
      </div>
    </div>
  );
};

export default StyleAdviser;
