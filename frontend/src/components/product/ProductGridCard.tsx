import React, { useMemo } from 'react';
import { Product } from '../../types';
import HeartButton from '../common/HeartButton';
import RatingStars from '../common/RatingStars';
import './ProductGridCard.scss';
import sampleImage from '../../assets/logo-sampleImage.png';

const MAX_NAME_LENGTH = 20;

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}...`;
};

interface ProductGridCardProps {
  product: Product;
  onSelect: (productId: string) => void;
  onFavoriteToggle: (productId: string) => void;
}

const ProductGridCard: React.FC<ProductGridCardProps> = ({ product, onSelect, onFavoriteToggle }) => {
  const handleCardClick = () => {
    onSelect(product.id);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 親要素へのクリックイベント伝播を停止
    onFavoriteToggle(product.id);
  };

  const truncatedName = useMemo(() => truncateText(product.name, MAX_NAME_LENGTH), [product.name]);

  return (
    <div className="product-grid-card" onClick={handleCardClick}>
      <div className="image-container">
        <HeartButton
          isFavorite={product.isFavorite}
          favoriteCount={product.favoriteCount}
          onClick={handleFavoriteClick}
        />
        {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="product-image" /> : <img src={sampleImage} alt={product.name} className="product-image" />}
      </div>
      <div className="product-details">
        <h3 className="product-name">{truncatedName}</h3>
        <div className="rating-container">
          <RatingStars rating={product.rating} />
        </div>
      </div>
    </div>
  );
};

export default ProductGridCard;
