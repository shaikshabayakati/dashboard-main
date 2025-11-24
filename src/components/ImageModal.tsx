'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
  altText?: string;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose, altText = 'Pothole Image' }) => {
  console.log('ImageModal rendered with imageUrl:', imageUrl);

  // Close modal on Escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    // Prevent body scroll and all pointer events when modal is open
    document.body.style.overflow = 'hidden';
    document.body.style.pointerEvents = 'none';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
      document.body.style.pointerEvents = 'unset';
    };
  }, [onClose]);

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-95 backdrop-blur-sm"
      style={{ pointerEvents: 'auto' }}
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
        aria-label="Close fullscreen image"
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Image container */}
      <div
        className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt={altText}
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
        />
      </div>

      {/* Hint text */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm opacity-75">
        Press ESC or click outside to close
      </div>
    </div>
  );

  // Render modal at document body level using portal
  if (typeof window === 'undefined') return null;
  return createPortal(modalContent, document.body);
};

export default ImageModal;
