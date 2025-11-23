import React, { useRef } from 'react';
import { UploadIcon, XCircleIcon } from './icons';
import { Spinner } from './Spinner';

interface ImageUploadProps {
  imagePreviews: string[];
  onAddImage: (file: File) => void;
  onRemoveImage: (index: number) => void;
  maxFiles?: number;
  disabled?: boolean;
  isLoading?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  imagePreviews,
  onAddImage,
  onRemoveImage,
  maxFiles = 1,
  disabled = false,
  isLoading = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onAddImage(file);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    if (!disabled && !isLoading && imagePreviews.length < maxFiles) {
      inputRef.current?.click();
    }
  };

  const isSingleMode = maxFiles === 1;

  // Single file mode UI
  if (isSingleMode) {
    const preview = imagePreviews[0] ?? null;
    return (
      <div className="w-full relative">
        <input
          type="file"
          ref={inputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
          disabled={disabled || !!preview || isLoading}
        />
        {preview ? (
          <div className="relative group w-full aspect-square max-h-[400px] mx-auto">
            <img src={preview} alt="Fashion item preview" className={`w-full h-full object-contain rounded-lg border border-stone-700 ${isLoading ? 'opacity-50 blur-sm' : ''}`} />
            
            {isLoading && (
               <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                   <Spinner size="lg" />
                   <p className="mt-2 text-yellow-400 font-semibold drop-shadow-md animate-pulse">Processing...</p>
               </div>
            )}

            {!disabled && !isLoading && (
              <button
                onClick={() => onRemoveImage(0)}
                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500/80 rounded-full text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                aria-label="Remove image"
              >
                <XCircleIcon />
              </button>
            )}
          </div>
        ) : (
          <div
            onClick={handleClick}
            className={`w-full aspect-square max-h-[400px] mx-auto bg-stone-900/40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden ${
              !disabled && !isLoading 
                ? 'cursor-pointer border-stone-600 hover:border-orange-400 hover:bg-stone-800/60 hover:shadow-[0_0_20px_-5px_rgba(251,146,60,0.1)]' 
                : 'cursor-not-allowed opacity-50 border-stone-700'
            }`}
          >
            {isLoading ? (
                <div className="flex flex-col items-center z-10">
                    <Spinner size="lg" />
                    <p className="mt-3 text-yellow-400 text-sm font-medium animate-pulse">Uploading...</p>
                </div>
            ) : (
                <>
                    <div className="p-4 rounded-full bg-stone-800/50 mb-3 group-hover:scale-110 transition-transform duration-300">
                         <UploadIcon />
                    </div>
                    <p className="mt-2 text-stone-300 font-medium">Click to upload image</p>
                    <p className="text-xs text-stone-500 mt-1">PNG, JPG, WEBP</p>
                </>
            )}
          </div>
        )}
      </div>
    );
  }

  // Multiple files mode UI
  return (
    <div className="w-full">
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        disabled={disabled || imagePreviews.length >= maxFiles || isLoading}
      />
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
        {imagePreviews.map((preview, index) => (
          <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-stone-700/50">
            <img src={preview} alt={`Fashion item preview ${index + 1}`} className="w-full h-full object-cover" />
            {!disabled && !isLoading && (
              <button
                onClick={() => onRemoveImage(index)}
                className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-red-500/80 transition-all opacity-0 group-hover:opacity-100"
                aria-label={`Remove image ${index + 1}`}
              >
                <XCircleIcon />
              </button>
            )}
          </div>
        ))}
        {(imagePreviews.length < maxFiles || isLoading) && (
          <div
            onClick={handleClick}
            className={`aspect-square bg-stone-900/40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300 ${
              !disabled && !isLoading 
                ? 'cursor-pointer border-stone-600 hover:border-orange-400 hover:bg-stone-800/60' 
                : 'cursor-not-allowed border-stone-700 opacity-60'
            }`}
          >
            {isLoading ? (
                <div className="flex flex-col items-center">
                    <Spinner size="sm" />
                    <p className="mt-2 text-xs text-yellow-500 animate-pulse">Processing</p>
                </div>
            ) : (
                <>
                    <UploadIcon />
                    <p className="mt-2 text-center text-xs text-stone-400">Add Image</p>
                    <p className="text-[10px] text-stone-500">({imagePreviews.length}/{maxFiles})</p>
                </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};