import React, { useState } from 'react';
import { ProductType } from './../../types';
import TypeCard from './TypeCard';
import './TypeCarousel.scss';

interface TypeCarouselProps {
  types: ProductType[];
  onComplete: (data: { selections: { [key: string]: boolean }, isCompleted: boolean }) => void;
}

const TypeCarousel: React.FC<TypeCarouselProps> = ({ types, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userSelections, setUserSelections] = useState<{ [key: string]: boolean }>({});

  const handleSelection = (isLiked: boolean) => {
    setUserSelections(prevSelections => ({
      ...prevSelections,
      [types[currentIndex].id]: isLiked,
    }));
    
    // 次のカードへ進むか、完了を通知
    if (currentIndex < types.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // 最後のカードを処理したら、結果と完了状態を親に渡す
      onComplete({
        selections: { ...userSelections, [types[currentIndex].id]: isLiked },
        isCompleted: true
      });
    }
  };

  const currentType = types[currentIndex];

  const totalItems = types.length;

  return (
    <div className="type-carousel">
      {/* インディケーター */}
      {totalItems > 0 && (
        <div className="carousel-indicator-container">
          <div className="carousel-dots">
            {types.map((_, index) => (
              <span
                key={index}
                className={`dot ${index === currentIndex ? 'active' : ''}`}
              ></span>
            ))}
          </div>
        </div>
      )}
      {currentType ? (
        <TypeCard 
          type={currentType} 
          onLike={() => handleSelection(true)}
          onDislike={() => handleSelection(false)}
        />
      ) : (
        // 完了したときに親に結果を渡すため、このメッセージは表示されなくなる
        null
      )}
    </div>
  );
};

export default TypeCarousel;