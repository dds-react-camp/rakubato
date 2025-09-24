import React from 'react';
import './StatBar.scss';

interface StatBarProps {
  label: string;
  value: number;
}

const StatBar: React.FC<StatBarProps> = ({ label, value }) => {
  return (
    <div className="stat-item">
      <div className="stat-label">{label}</div>
      <div className="stat-bar-container">
        <div className="stat-bar" style={{ width: `${(value / 5) * 100}%` }}></div>
      </div>
      <div className="stat-value">{value}/5</div>
    </div>
  );
};

export default StatBar;