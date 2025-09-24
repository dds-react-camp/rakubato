import React, { useState, useEffect } from 'react';
import './FloatingAssistantButton.scss';
import assistantIcon from '../../assets/logo-black.png'; // Placeholder, will be replaced with actual icon

interface FloatingAssistantButtonProps {
  onClick: () => void;
  isVisible: boolean;
}

const FloatingAssistantButton: React.FC<FloatingAssistantButtonProps> = ({ onClick, isVisible }) => {
  const [isImageError, setIsImageError] = useState(false);

  // This effect can be used if the image path comes from a prop or is dynamic
  useEffect(() => {
    const img = new Image();
    img.src = assistantIcon;
    img.onerror = () => {
      setIsImageError(true);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <button 
      className={`floating-assistant-btn ${isImageError ? 'image-error' : ''}`}
      onClick={onClick}
      aria-label='Open AI Assistant'
    >
      {!isImageError ? (
        <img src={assistantIcon} alt='AI Assistant' className='assistant-icon' />
      ) : (
        <span className='fallback-text'>AI</span>
      )}
    </button>
  );
};

export default FloatingAssistantButton;
