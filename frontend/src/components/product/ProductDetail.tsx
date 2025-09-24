import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import RatingStars from '../common/RatingStars';
import StatBar from '../common/StatBar';
import './ProductDetail.scss';
import recomendationIcon from '../../assets/logo-recomendation.png';
import sampleImage from '../../assets/logo-sampleImage.png';

const getYouTubeEmbedUrl = (url: string): string => {
  let videoId = '';
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
      videoId = urlObj.pathname.slice(1);
    } else if (urlObj.hostname.includes('youtube.com')) {
      videoId = urlObj.searchParams.get('v') || '';
    }
  } catch (e) {
    console.error('Invalid URL:', e);
    return url; // Return original url if parsing fails
  }

  if (videoId) {
    // Remove any extra params from videoId
    const ampersandPosition = videoId.indexOf('&');
    if (ampersandPosition !== -1) {
      videoId = videoId.substring(0, ampersandPosition);
    }
    return `https://www.youtube.com/embed/${videoId}`;
  }

  return url; // Return original url if no ID found
};

interface ProductDetailProps {
  product: Product | null;
  onClose: () => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product: initialProduct, onClose }) => {
  const [product, setProduct] = useState(initialProduct);

  useEffect(() => {
    setProduct(initialProduct);
  }, [initialProduct]);

  if (!product) {
    return null;
  }

  const abilityNames: { [key: string]: string } = {
    lightweight: '軽量性',
    camera: '高画質',
    battery: 'バッテリー',
    waterproof: '防水性',
  };

  const [openTab, setOpenTab] = useState<string | null>('');

  const toggleTab = (tab: string) => {
    setOpenTab(openTab === tab ? null : tab);
  };

  return (
    <div className="product-detail-overlay">
      <div className="product-detail-container">
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        <div className="detail-content">
          <div className="card card-base interactive-control detail-card trading-card-hybrid">
            <div className="product-image-placeholder">
              {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="product-image" /> : <img src={sampleImage} alt={product.name} className="product-image" />}
            </div>
            <div className="product-image" style={{ backgroundImage: `url(${product.imageUrl})` }} />

            <div className="info-section">
              <h2 className="product-name">{product.name}</h2>

              <div className="rating-container">
                <RatingStars rating={product.rating} />
              </div>

              <div className="product-tags">
                {product.tags.map((tag, index) => (
                  <span key={index} className="product-tag">
                    {tag}
                  </span>
                ))}
              </div>

              <p className="description">{product.description}</p>

              {product.recommendation_reason && (
                <div className="ai-recommendation">
                  <div className="ai-recommendation-header">
                    <img src={recomendationIcon} alt="recomendation icon" className="recomendation-icon" />
                    <h3 className="ai-recommendation-title">AIのおすすめポイント</h3>
                  </div>
                  <p
                    className="ai-recommendation-text"
                    dangerouslySetInnerHTML={{
                      __html: product.recommendation_reason.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
                    }}
                  ></p>
                </div>
              )}
            </div>

            <div className="accordion-section">
              <div className="accordion-item">
                <button className="accordion-header" onClick={() => toggleTab('specs')}>
                  スペック
                </button>
                {openTab === 'specs' && (
                  <div className="accordion-content">
                    <ul className="specs-list">
                      {product.specs &&
                        Object.entries(product.specs).map(([key, value]) => (
                          <li key={key} className="specs-item">
                            <span className="spec-key">{key}</span>
                            <span className="spec-value">{value}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
              {typeof product.price === 'number' && (
                <div className="accordion-item">
                  <button className="accordion-header" onClick={() => toggleTab('price')}>
                    参考価格
                  </button>
                  {openTab === 'price' && (
                    <div className="accordion-content">
                      <p>¥{product.price.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              )}
              <div className="accordion-item">
                <button className="accordion-header" onClick={() => toggleTab('matching')}>
                  あなたとのマッチング度
                </button>
                {openTab === 'matching' && (
                  <div className="accordion-content">
                    <div className="ability-stats">
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <StatBar key={key} label={abilityNames[key] || key} value={value} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="accordion-item">
                <button className="accordion-header" onClick={() => toggleTab('video')}>
                  おすすめ動画
                </button>
                {openTab === 'video' && (
                  <div className="accordion-content">
                    {product.source_urls &&
                      product.source_urls.map((url, index) => (
                        <iframe
                          key={index}
                          width="320px"
                          height="180px"
                          src={getYouTubeEmbedUrl(url)}
                          title={`YouTube video player ${index + 1}`}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                          style={{ marginBottom: '16px' }}
                        ></iframe>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
