import React, { useEffect } from 'react';
import { Product } from '../../types';
import ProductCard from './ProductCarouselCard';
import useEmblaCarousel from 'embla-carousel-react';
import './ProductCarousel.scss';

interface ProductCarouselProps {
  products: Product[];
  onProductSelect: (productId: string) => void;
  onFavoriteToggle: (productId: string) => void;
  onCurrentProductChange: (productId: string) => void;
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({
  products,
  onProductSelect,
  onFavoriteToggle,
  onCurrentProductChange,
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
  });

  useEffect(() => {
    if (!emblaApi || products.length === 0) return;

    const onSelect = () => {
      const selectedIndex = emblaApi.selectedScrollSnap();
      onCurrentProductChange(products[selectedIndex].id);
    };

    emblaApi.on('select', onSelect);
    // 初期表示時にも呼び出す
    onSelect();

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, products, onCurrentProductChange]);

  return (
    <div className="embla" ref={emblaRef}>
      <div className="embla__container">
        {products.map((product) => (
          <div className="embla__slide" key={product.id}>
            <ProductCard product={product} onSelect={onProductSelect} onFavoriteToggle={onFavoriteToggle} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductCarousel;
