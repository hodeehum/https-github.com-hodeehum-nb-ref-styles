

import React from 'react';
import { GeneratedImage } from '../types';
import { IconDownload, IconEdit, IconClipboard } from './Icons';

interface ImageGalleryProps {
  images: GeneratedImage[];
  onEdit: (image: GeneratedImage) => void;
  onImageClick: (image: GeneratedImage) => void;
  emptyStateText: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, onEdit, onImageClick, emptyStateText }) => {
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-800/50 p-8 rounded-2xl border-2 border-dashed border-gray-700 text-center">
        <h3 className="text-2xl font-bold text-gray-400">Your gallery is empty</h3>
        <p className="text-gray-500 mt-2">{emptyStateText}</p>
      </div>
    );
  }

  const handleDownload = (image: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = `data:${image.mimeType};base64,${image.base64}`;
    const extension = image.mimeType === 'image/png' ? 'png' : 'jpg';
    link.download = `ai-image-${Date.now()}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    // You could add a toast notification here for better UX
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {images.map((image) => (
        <div 
          key={image.id} 
          className="group relative overflow-hidden rounded-2xl shadow-lg border border-gray-700 cursor-pointer aspect-square"
          onClick={() => onImageClick(image)}
        >
          <img
            src={`data:${image.mimeType};base64,${image.base64}`}
            alt={image.prompt}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 p-4 w-full">
              <div className="flex justify-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); onEdit(image); }} className="p-2 bg-black/50 rounded-full text-white hover:bg-indigo-600 transition-colors" title="Edit this image"><IconEdit className="w-5 h-5"/></button>
                <button onClick={(e) => { e.stopPropagation(); handleDownload(image); }} className="p-2 bg-black/50 rounded-full text-white hover:bg-indigo-600 transition-colors" title="Download as PNG"><IconDownload className="w-5 h-5"/></button>
                <button onClick={(e) => { e.stopPropagation(); handleCopyPrompt(image.prompt); }} className="p-2 bg-black/50 rounded-full text-white hover:bg-indigo-600 transition-colors" title="Copy prompt"><IconClipboard className="w-5 h-5"/></button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ImageGallery;