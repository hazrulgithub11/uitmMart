'use client';

import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import Image from 'next/image';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (stars: number, comment: string) => void;
  productName: string;
  productImage?: string;
}

const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  productName,
  productImage
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setHoveredRating(0);
      setComment('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (rating === 0) return;
    
    setIsSubmitting(true);
    onSubmit(rating, comment);
  };

  // Generate the star styles based on rating
  const getStarStyle = (starIndex: number) => {
    const isActive = (hoveredRating || rating) >= starIndex;
    
    return {
      color: isActive ? '#FFD700' : '#E5E7EB',
      cursor: 'pointer',
      strokeWidth: 1.5
    };
  };

  const cartoonStyle = {
    modal: "bg-white border-3 border-black rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 w-full max-w-md mx-auto",
    backdrop: "fixed inset-0 backdrop-blur-md bg-white/30 z-50 flex items-center justify-center p-4",
    button: "bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-4 py-2",
    buttonPrimary: "bg-blue-500 text-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-4 py-2",
    input: "w-full border-2 border-black rounded-lg p-2 mt-2"
  };

  return (
    <div className={cartoonStyle.backdrop} onClick={onClose}>
      <div 
        className={cartoonStyle.modal}
        onClick={(e) => e.stopPropagation()} // Prevent clicks from closing the modal
      >
        <h2 className="text-xl font-bold mb-4 text-center text-black">Rate This Product</h2>
        
        {/* Product info */}
        <div className="flex items-center mb-4">
          {productImage && (
            <div className="w-16 h-16 rounded overflow-hidden bg-gray-100 mr-3 flex-shrink-0">
              <Image 
                src={productImage} 
                alt={productName} 
                width={64}
                height={64}
                className="object-cover w-full h-full"
                style={{ width: 'auto', height: 'auto' }}
              />
            </div>
          )}
          <div className="flex-grow text-black">
            <p className="font-medium">{productName}</p>
          </div>
        </div>
        
        {/* Star Rating */}
        <div className="mb-6">
          <p className="mb-2 text-black">Select your rating:</p>
          <div className="flex items-center justify-center space-x-2">
            {[1, 2, 3, 4, 5].map(starIndex => (
              <Star 
                key={starIndex}
                size={32} 
                fill={getStarStyle(starIndex).color}
                color={getStarStyle(starIndex).color}
                style={getStarStyle(starIndex)}
                onClick={() => setRating(starIndex)}
                onMouseEnter={() => setHoveredRating(starIndex)}
                onMouseLeave={() => setHoveredRating(0)}
              />
            ))}
          </div>
          <p className="text-center mt-2 text-black">
            {rating === 1 && "Poor"}
            {rating === 2 && "Fair"}
            {rating === 3 && "Good"}
            {rating === 4 && "Very Good"}
            {rating === 5 && "Excellent"}
            {rating === 0 && <span>&nbsp;</span>}
          </p>
        </div>
        
        {/* Comment */}
        <div className="mb-6">
          <label className="block mb-1 text-black">Add a comment (optional):</label>
          <textarea 
            className={`${cartoonStyle.input} text-black`}
            rows={3}
            placeholder="Tell others what you think about this product..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-between">
          <button 
            className={`${cartoonStyle.button} text-black`}
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            className={cartoonStyle.buttonPrimary}
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingModal; 