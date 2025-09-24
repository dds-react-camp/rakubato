import React from 'react';
import { ProductType } from './../../types';
import './TypeCard.scss';

interface TypeCardProps {
  type: ProductType;
  onLike: () => void;
  onDislike: () => void;
}

const TypeCard: React.FC<TypeCardProps> = ({ type, onLike, onDislike }) => {

  return (
    <div className="type-card">
      <div className="type-card-content">
        <div className="card-image-container">
          <img src={type.imageUrl} alt={type.name} className="card-image" />
        </div>
        <div className="card-bottom">
          <div className="product-info">
            <h3 className="product-name">{type.name}</h3>
            <p className="description">{type.description}</p>
          </div>

          <div className="characteristics">
            <ul className="characteristics-list">
              {type.characteristics.map((char, index) => (
                <li key={index} className="characteristic-item">
                  <span className="check-mark">✅</span>
                  <p className="characteristics-text">{char}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="card-footer">
            <button className="next-button" onClick={onDislike}>
              <span className="material-symbols-outlined">
                clear
              </span>
            </button>
            <button className="like-button" onClick={onLike}>
              <span className="material-symbols-outlined">
                thumb_up
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypeCard;