import React from 'react';
import './RatingStars.scss';

interface RatingStarsProps {
  rating: number;
}

const RatingStars: React.FC<RatingStarsProps> = ({ rating }) => {
  // 0から5までの評価を小数点で受け取り、星の数を計算
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  const emptyStars = 5 - Math.ceil(rating);

  return (
    <div className="rating-stars-container">
      {/* 塗りつぶされた星 */}
      {Array(fullStars).fill(null).map((_, i) => (
        <span key={`full-${i}`} className="star filled">★</span>
      ))}
      {/* 半分の星（オプション） */}
      {hasHalfStar && <span className="star half-filled">★</span>}
      {/* 空の星 */}
      {Array(emptyStars).fill(null).map((_, i) => (
        <span key={`empty-${i}`} className="star empty">★</span>
      ))}
    </div>
  );
};

export default RatingStars;