import React from 'react';
import './HeartButton.scss';

interface FavoriteButtonProps {
  isFavorite: boolean;
  favoriteCount: number;
  onClick: (event: React.MouseEvent) => void;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ isFavorite, favoriteCount, onClick }) => {
  // const handleClick = (e: React.MouseEvent) => {
  //   e.stopPropagation();
  //   onClick(e);
  // };

  return (
    <div className="favorite-button" onClick={onClick}>
      <span className={`heart-icon ${isFavorite ? 'filled' : ''}`}>
        ❤
      </span>
      <span className="favorite-count">{favoriteCount}</span>
    </div>
  );
};

export default FavoriteButton;