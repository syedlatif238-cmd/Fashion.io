
import React, { useRef } from 'react';
import { UploadIcon, XCircleIcon } from './icons';

interface ImageUploadProps {
  imagePreview: string | null;
  onImageChange: (file: File | null) => void;
  onRemoveImage: () => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ imagePreview, onImageChange, onRemoveImage }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageChange(file);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />
      {imagePreview ? (
        <div className="relative group w-full aspect-square max-h-[400px] mx-auto">
          <img src={imagePreview} alt="Fashion item preview" className="w-full h-full object-contain rounded-lg" />
          <button
            onClick={onRemoveImage}
            className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/80 transition-opacity opacity-0 group-hover:opacity-100"
            aria-label="Remove image"
          >
            <XCircleIcon />
          </button>
        </div>
      ) : (
        <div
          onClick={handleClick}
          className="w-full aspect-square max-h-[400px] mx-auto bg-gray-900/70 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-gray-800/80 transition-all duration-300"
        >
          <UploadIcon />
          <p className="mt-2 text-gray-400">Click to upload image</p>
          <p className="text-xs text-gray-500">PNG, JPG, WEBP</p>
        </div>
      )}
    </div>
  );
};
