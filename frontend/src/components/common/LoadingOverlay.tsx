import React from 'react';
import './LoadingOverlay.scss';

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  subtext?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  text = '処理中...',
  subtext = 'しばらくお待ちください',
}) => {
  return (
    <div
      className={`loading-overlay ${isLoading ? 'show' : ''}`}
      role="status"
      aria-live="assertive"
    >
      <div className="loading-content">
        <div className="loading-spinner-large"></div>
        <div className="loading-text">{text}</div>
        <div className="loading-subtext">{subtext}</div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
