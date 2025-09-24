import React from 'react';
import { Product } from '../../types';
import ProductGridCard from './ProductGridCard';
import './ProductGrid.scss';

interface ProductGridProps {
  products: Product[];
  onProductSelect: (productId: string) => void;
  onFavoriteToggle: (productId: string) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, onProductSelect, onFavoriteToggle }) => {
  return (
    <div className="product-grid">
      {products.map(product => (
        <ProductGridCard
          key={product.id}
          product={product}
          onSelect={onProductSelect}
          onFavoriteToggle={onFavoriteToggle}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
