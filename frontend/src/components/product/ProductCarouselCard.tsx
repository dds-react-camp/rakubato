import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Product } from '../../types';
import HeartButton from '../common/HeartButton';
import RatingStars from '../common/RatingStars';
import StatBar from '../common/StatBar';
import './ProductCarouselCard.scss';
import sampleImage from '../../assets/logo-sampleImage.png';

const MAX_NAME_LENGTH = 16;
const MAX_DESCRIPTION_LENGTH = 45;
const MAX_SPEC_LABEL_LENGTH = 6;

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}...`;
};

interface ProductCardProps {
  product: Product;
  onSelect: (productId: string) => void;
  onFavoriteToggle: (productId: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, onSelect, onFavoriteToggle }) => {
  const { id, name, imageUrl, rating, isFavorite, favoriteCount, description, tags, specifications } = product;

  const truncatedName = useMemo(() => truncateText(name, MAX_NAME_LENGTH), [name]);
  const truncatedDescription = useMemo(() => truncateText(description, MAX_DESCRIPTION_LENGTH), [description]);
  const tagsRef = useRef<HTMLDivElement>(null);
  const [isTagsOverflowing, setIsTagsOverflowing] = useState(false);

  useEffect(() => {
    const checkTagsOverflow = () => {
      if (tagsRef.current) {
        const { scrollHeight, clientHeight } = tagsRef.current;
        setIsTagsOverflowing(scrollHeight > clientHeight);
      }
    };

    checkTagsOverflow();
    window.addEventListener('resize', checkTagsOverflow);
    return () => window.removeEventListener('resize', checkTagsOverflow);
  }, [tags]);

  return (
    <div className="product-carousel-card" onClick={() => onSelect(id)}>
      <div className="product-card-header">
        <h3 className="product-card-name">{truncatedName}</h3>
        <HeartButton
          isFavorite={isFavorite}
          favoriteCount={favoriteCount}
          onClick={(e) => {
            // イベントの伝播を止め、カード全体のクリックイベントが発火しないようにします
            e.stopPropagation();
            onFavoriteToggle(id);
          }}
        />
      </div>

      <div className="product-card-body">
        <div className="product-image-placeholder">
          {imageUrl ? <img src={imageUrl} alt={name} className="product-image" /> : <img src={sampleImage} alt={name} className="product-image" />}
        </div>
        <div className="product-details">
          <RatingStars rating={rating} />
          <div className="product-tags" ref={tagsRef}>
            {tags.map((tag, index) => (
              <span key={index} className="product-tag">
                {tag}
              </span>
            ))}
          </div>
          {isTagsOverflowing && <span className="product-tag over-tag">...</span>}
        </div>
      </div>

      <div className="product-description-container">
        <p className="product-description">{truncatedDescription}</p>
      </div>

      <div className="product-stats-container">
        <h4 className="stats-title">マッチング度</h4>
        {Object.entries(specifications || {}).map(([label, value]) => (
          <StatBar key={label} label={truncateText(label, MAX_SPEC_LABEL_LENGTH)} value={value} />
        ))}
      </div>
    </div>
  );
});

export default ProductCard;
