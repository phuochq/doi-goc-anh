import React, { useCallback } from 'react';
import { Upload, ImageIcon } from './Icons';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    }
  }, [onImageUpload]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div 
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="w-full h-32 rounded-xl border border-dashed border-white/20 bg-[#0f0f0f] hover:bg-[#1a1a1a] hover:border-[#ccff00]/50 transition-all flex flex-col items-center justify-center text-center gap-2 relative group cursor-pointer"
    >
        <input
        type="file"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div className="p-2 rounded-full bg-white/5 text-gray-400 group-hover:text-[#ccff00] transition-colors">
            <Upload size={20} />
        </div>
        <div className="flex flex-col">
            <span className="text-xs font-medium text-white">Upload Image</span>
            <span className="text-[10px] text-gray-500">Drag & drop or click</span>
        </div>
    </div>
  );
};
