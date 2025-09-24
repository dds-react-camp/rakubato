import React from 'react';

interface RarityIndicatorProps {
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

const RarityIndicator: React.FC<RarityIndicatorProps> = ({ rarity }) => {
  const rarityLevels = {
    common: 1,
    uncommon: 2,
    rare: 3,
    epic: 4,
    legendary: 5,
  };
  const level = rarityLevels[rarity] || 1;

  return (
    <div className="rarity-indicator">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className={`rarity-star ${i < level ? 'filled' : 'empty'}`}
        ></div>
      ))}
    </div>
  );
};

export default RarityIndicator;
