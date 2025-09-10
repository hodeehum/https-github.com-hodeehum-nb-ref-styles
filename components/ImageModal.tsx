import React, { useEffect } from 'react';
import { GeneratedImage } from '../types';
import { IconClose } from './Icons';

interface ImageModalProps {
  image: GeneratedImage | null;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ image, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (image) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [image, onClose]);

  if (!image) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-modal-title"
    >
      <div
        className="relative max-w-4xl max-h-[90vh] bg-gray-900 rounded-lg shadow-2xl p-4 border border-gray-700"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the modal content
      >
        <h2 id="image-modal-title" className="sr-only">Image Preview</h2>
        <img
          src={`data:${image.mimeType};base64,${image.base64}`}
          alt="Enlarged source view"
          className="max-w-full max-h-[80vh] object-contain rounded"
        />
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500"
          aria-label="Close image preview"
        >
          <IconClose className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ImageModal;
