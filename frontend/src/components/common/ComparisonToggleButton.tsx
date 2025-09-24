import React from 'react';
import './ComparisonToggleButton.scss';

interface ToggleButtonsProps {
  currentView: 'matchup' | 'collection';
  onToggle: (view: 'matchup' | 'collection') => void;
}

const ToggleButtons: React.FC<ToggleButtonsProps> = ({ currentView, onToggle }) => {
  return (
    <div className="toggle-container">
      <button
        className={`toggle-btn ${currentView === 'matchup' ? 'active' : ''}`}
        onClick={() => onToggle('matchup')}
      >
        <span className="material-symbols-outlined">grid_view</span>
        <span className="btn-text">マッチアップ</span>
      </button>
      <button
        className={`toggle-btn ${currentView === 'collection' ? 'active' : ''}`}
        onClick={() => onToggle('collection')}
      >
        <span className="material-symbols-outlined">apps</span>
        <span className="btn-text">コレクション</span>
      </button>
    </div>
  );
};

export default ToggleButtons;