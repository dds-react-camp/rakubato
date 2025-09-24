import React from 'react';

interface AbilityStatsProps {
  abilities: { [key: string]: number };
}

const AbilityStats: React.FC<AbilityStatsProps> = ({ abilities }) => {
  const abilityNames: { [key: string]: string } = {
    lightweight: '軽量性',
    camera: '高画質',
    battery: 'バッテリー',
    waterproof: '防水性',
  };

  return (
    <div className="ability-stats">
      {Object.entries(abilities).map(([key, value]) => {
        const percentage = (value / 5) * 100;
        return (
          <div key={key} className="ability-item">
            <span className="ability-name">{abilityNames[key] || key}</span>
            <div className="ability-progress">
              <div
                className="ability-fill"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            <span className="ability-value">{value}/5</span>
          </div>
        );
      })}
    </div>
  );
};

export default AbilityStats;
