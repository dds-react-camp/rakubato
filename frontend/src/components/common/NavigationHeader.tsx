import React from 'react';
import './NavigationHeader.scss';

interface NavigationHeaderProps {
  title?: string;
  onBack?: () => void;
  rightContent?: React.ReactNode;
}

const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  title,
  onBack,
  rightContent,
}) => {
  return (
    <header className="nav-header">
      <div className="nav-left">
        {onBack && (
          <button onClick={onBack} className="nav-btn" aria-label="Go back">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        )}
      </div>
      <div className="nav-title">{title}</div>
      <div className="nav-right">{rightContent}</div>
    </header>
  );
};

export default NavigationHeader;
