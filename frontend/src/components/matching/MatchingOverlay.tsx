import React, { useState } from 'react';
import './MatchingOverlay.scss';

interface MatchingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

const MatchingOverlay: React.FC<MatchingOverlayProps> = ({ isOpen, onClose, onSearch, isLoading, error }) => {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className='matching-overlay-backdrop' onClick={onClose}>
      <div className='matching-overlay-container' onClick={(e) => e.stopPropagation()}>
        <header className='matching-header'>
          <h3>マッチング検索</h3>
          <button onClick={onClose} className='close-btn' aria-label="Close search">&times;</button>
        </header>
        <div className='matching-content'>
          {isLoading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>AIが分析中です... <br />しばらくお待ちください。</p>
            </div>
          ) : (
            <>
              <h4 style={{ marginBottom: '1rem', textAlign: 'center' }}>あなたの「好き」を教えてください</h4>
              <p style={{ marginBottom: '2rem', textAlign: 'center', color: '#666' }}>例: レトロなデザインのカメラ, 落ち着いた色の財布</p>
              <div className='matching-input-area'>
                <input
                  type='text'
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder='キーワードを入力...'
                  aria-label="Search input"
                  disabled={isLoading}
                />
                <button onClick={handleSearch} aria-label="Search" disabled={isLoading}>
                  <span className="material-symbols-outlined">search</span>
                </button>
              </div>
              {error && <p className="error-message">{error}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchingOverlay;
