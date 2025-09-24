import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Product } from '../types';
// import { ProductService } from '../services/ProductService';
import { useAppState } from '../contexts/AppStateContext';

import NavigationHeader from '../components/common/NavigationHeader';
import ToggleButtons from '../components/common/ComparisonToggleButton';
import ProductCarousel from '../components/product/ProductCarousel';
import ProductGrid from '../components/product/ProductGrid';
import ProductDetail from '../components/product/ProductDetail';
import TutorialBubble from '../components/common/TutorialBubble';

import characterImage from '../assets/logo-thinking.png';
import './ComparisonScreen.scss';

// 開発用ダミーデータ
const DUMMY_PRODUCTS: Product[] = [
  {
    id: 'product-A',
    name: '超絶スーパーとんでもウルトラライト・スピードスター',
    imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjpuvNw8otkjDBP2hKw64PXVbAQwyhia6k_nXyPOoEYjEMT6Bd3Vo6xGcu4WOu_b30wvNZQ4YRhWGdCZSj2IizYM0gjb170wumR71AreYJQ6MeESrDA898QrilG3vrft4JAmesuWNDwCnCk/s1600/computer_keyboard_black.png',
    rating: 5,
    isFavorite: false,
    favoriteCount: 0,
    price: 29800,
    reviewCount: 88,
    description: '驚異的な軽さと、プロ級のカメラ性能を両立したモデル。アクティブなライフスタイルを送るあなたに最適。ポケットに入れて、どこへでも最高の思い出を持ち運べます。',
    tags: ['超軽量', 'プロ級カメラ', '長時間バッテリー', 'スタイリッシュ'],
    specifications: {
      '携帯性': 5,
      'カメラ性能': 4,
      'バッテリーがどのくらいもつか': 3,
      'デザイン性': 4
    },
    specs: {
      '本体重量': '150g',
      'メインカメラ': '50MP (F1.8)',
      '超広角カメラ': '12MP (F2.2)',
      '連続使用時間': '最大24時間',
      '防水防塵': 'IP68等級',
      'ディスプレイ': '6.1インチ Super Retina XDR'
    },
    aiRecommendation: 'チャットでのヒアリングから、あなたは**携帯性の高さ**と**カメラの画質**を特に重視していると分析しました。ウルトラライト・スピードスターは、わずか150gという軽さでありながら、50MPの高解像度カメラを搭載しており、あなたの要望に完璧に応える一台です。',
    source_urls: ['https://www.youtube.com/embed/pkjPhJMLuDs?si=Ta_NLC0R35fQBbsj', 'https://www.youtube.com/embed/pkjPhJMLuDs?si=Ta_NLC0R35fQBbsj'],
  },
  {
    id: 'product-B',
    name: 'パワーハウス・エンデュランス',
    imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjpuvNw8otkjDBP2hKw64PXVbAQwyhia6k_nXyPOoEYjEMT6Bd3Vo6xGcu4WOu_b30wvNZQ4YRhWGdCZSj2IizYM0gjb170wumR71AreYJQ6MeESrDA898QrilG3vrft4JAmesuWNDwCnCk/s1600/computer_keyboard_black.png',
    rating: 4,
    isFavorite: false,
    favoriteCount: 0,
    price: 32000,
    reviewCount: 150,
    description: 'バッテリー性能を極限まで高めた、頼れる一台。一度の充電で数日間使い続けられるため、充電を気にすることなく、ビジネスや旅行に集中できます。',
    tags: ['大容量バッテリー', '高耐久', 'ビジネス向け', '急速充電'],
    specifications: {
      '携帯性': 2,
      'カメラ性能': 3,
      'バッテリーがどのくらいもつか': 5,
      'デザイン性': 3
    },
    specs: {
      '本体重量': '220g',
      'メインカメラ': '48MP (F2.0)',
      '超広角カメラ': '8MP (F2.4)',
      '連続使用時間': '最大72時間',
      '防水防塵': 'IP67等級',
      'ディスプレイ': '6.5インチ Full HD+'
    },
    aiRecommendation: 'あなたは**バッテリーの持ち**を最優先事項として挙げていましたね。パワーハウス・エンデュランスは、業界トップクラスのバッテリー容量を誇り、最大72時間の連続使用が可能です。充電のストレスから解放されたいあなたに、自信を持っておすすめします。',
    source_urls: ['https://www.youtube.com/embed/pZYzw6NV3dU?si=brHYy0w5snivfWc1', 'https://www.youtube.com/embed/6YO9yvnJ6l0?si=9NAeKAoOdcQXIKM6'],
  },
  {
    id: 'product-C',
    name: 'クリエイターズ・キャンバス',
    imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjpuvNw8otkjDBP2hKw64PXVbAQwyhia6k_nXyPOoEYjEMT6Bd3Vo6xGcu4WOu_b30wvNZQ4YRhWGdCZSj2IizYM0gjb170wumR71AreYJQ6MeESrDA898QrilG3vrft4JAmesuWNDwCnCk/s1600/computer_keyboard_black.png',
    rating: 4,
    isFavorite: false,
    favoriteCount: 0,
    price: 45000,
    reviewCount: 60,
    description: '圧倒的なディスプレイ品質と、忠実な色彩表現が魅力。写真編集やイラスト制作など、クリエイティブな作業で真価を発揮します。あなたの感性を、そのまま形に。',
    tags: ['高精細ディスプレイ', 'クリエイター向け', '色彩表現', '高性能CPU'],
    specifications: {
      '携帯性': 3,
      'カメラ性能': 4,
      'バッテリーがどのくらいもつか': 2,
      'デザイン性': 5
    },
    specs: {
      '本体重量': '190g',
      'メインカメラ': '64MP (F1.9)',
      '超広角カメラ': '16MP (F2.2)',
      '連続使用時間': '最大18時間',
      '防水防塵': 'IPX4等級',
      'ディスプレイ': '6.4インチ 4K有機EL'
    },
    aiRecommendation: '**ディスプレイの美しさ**と**正確な色の再現性**を求めるあなたのためのモデルです。クリエイターズ・キャンバスは、4K有機ELディスプレイを搭載し、DCI-P3カバー率100%を実現。あなたの創造性を最大限に引き出すパートナーとなるでしょう。',
    source_urls: ['https://www.youtube.com/embed/pZYzw6NV3dU?si=brHYy0w5snivfWc1', 'https://www.youtube.com/embed/6YO9yvnJ6l0?si=9NAeKAoOdcQXIKM6'],
  },
  {
    id: 'product-D',
    name: 'アウトドア・エクスプローラー',
    imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjpuvNw8otkjDBP2hKw64PXVbAQwyhia6k_nXyPOoEYjEMT6Bd3Vo6xGcu4WOu_b30wvNZQ4YRhWGdCZSj2IizYM0gjb170wumR71AreYJQ6MeESrDA898QrilG3vrft4JAmesuWNDwCnCk/s1600/computer_keyboard_black.png',
    rating: 5,
    isFavorite: false,
    favoriteCount: 0,
    price: 38000,
    reviewCount: 210,
    description: '防水・防塵・耐衝撃性能に優れた、究極のタフネスモデル。登山やキャンプなど、過酷な環境でも安心して使用できます。冒険の記録を、鮮明に、確実に残します。',
    tags: ['高耐久', '防水・防塵', 'アウトドア', '耐衝撃'],
    specifications: {
      '携帯性': 3,
      'カメラ性能': 3,
      'バッテリーがどのくらいもつか': 4,
      'デザイン性': 2
    },
    specs: {
      '本体重量': '210g',
      'メインカメラ': '48MP (F1.8)',
      '超広角カメラ': '12MP (F2.2)',
      '連続使用時間': '最大48時間',
      '防水防塵': 'IP68等級',
      '耐衝撃': 'MIL-STD-810H準拠'
    },
    aiRecommendation: '**アウトドアでの利用**を想定し、**頑丈さ**を重視するあなたに最適な選択です。アウトドア・エクスプローラーは、米軍MIL規格に準拠した耐衝撃性能を備え、いかなる状況でもあなたの活動をサポートします。',
    source_urls: ['https://www.youtube.com/embed/pZYzw6NV3dU?si=brHYy0w5snivfWc1', 'https://www.youtube.com/embed/6YO9yvnJ6l0?si=9NAeKAoOdcQXIKM6'],
  },
];

const FirstVisitOverlay = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className='overlay-container' onClick={onClose}>
      <div className='overlay-content' onClick={(e) => e.stopPropagation()}>
        <div className='overlay-image-container'>
          <img src={characterImage} alt="考えている鳥" className="overlay-image" />
        </div>
        <div className='overlay-text'>
          <h3>あなたにぴったりな商品が見つかりました！</h3>
          <p>2つを比較したり、一覧からお気に入りを見つけてください！</p>
        </div>
        <button className='close-button' onClick={onClose}>
          閉じる
        </button>
      </div>
    </div>
  );
};

const ComparisonScreen: React.FC = () => {
  const { recommendedProducts } = useAppState();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'matchup' | 'collection'>('matchup');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [topProductId, setTopProductId] = useState<string | null>(null);
  const [bottomProductId, setBottomProductId] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [showOverlay, setShowOverlay] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [hasVisited, setHasVisited] = useState(true);

  useEffect(() => {
    const visited = localStorage.getItem('hasVisitedComparisonScreen');
    if (!visited) {
      setHasVisited(false);
      setShowOverlay(true);
      localStorage.setItem('hasVisitedComparisonScreen', 'true');
    }

    // Todo：本番ではAPIからデータを取得（if (useDummyData)の分岐も削除）
    const params = new URLSearchParams(location.search);
    const useDummyData = params.get('dummy') === 'true';

    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        if (useDummyData) {
          setProducts(DUMMY_PRODUCTS);
        } else {
          if (recommendedProducts.length === 0) {
            navigate('/type-selection');
            return;
          }
          setProducts(recommendedProducts);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [recommendedProducts, navigate]);

  // お気に入りする
  const handleFavoriteToggle = (productId: string) => {
    setProducts(currentProducts =>
      currentProducts.map(product => {
        if (product.id === productId) {
          const newFavoriteCount = (product.favoriteCount || 0) + 1;
          return {
            ...product,
            isFavorite: newFavoriteCount > 0,
            favoriteCount: newFavoriteCount,
          };
        }
        return product;
      })
    );
  };

  // 詳細画面を表示する
  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
    }
  };

  const handleToggleView = (mode: 'matchup' | 'collection') => {
    setViewMode(mode);
  };

  const handleVsClick = () => {
    if (topProductId && bottomProductId && topProductId === bottomProductId) {
      alert('同じ商品同士でバトルモードは使用できません。');
      return;
    }

    const topProduct = products.find(p => p.id === topProductId);
    const bottomProduct = products.find(p => p.id === bottomProductId);

    if (topProduct && bottomProduct && topProduct.name && bottomProduct.name) { // Added check for non-empty names
      // Encode names to handle spaces and special characters in URL
      const encodedName1 = encodeURIComponent(topProduct.name);
      const encodedName2 = encodeURIComponent(bottomProduct.name);
      window.open(`/battle/${encodedName1}/${encodedName2}`, '_blank', 'noopener,noreferrer');
    } else {
      // Optionally, provide user feedback if product names are missing
      console.error("Cannot start battle: One or both product names are missing.");
      alert("対決を開始できません。商品名が正しく取得できませんでした。"); // Simple alert for user feedback
    }
  };

  const handleCloseOverlay = () => {
    setShowOverlay(false);
    if (!hasVisited) {
      setTutorialStep(1);
    }
  };

  const handleNextTutorial = () => {
    if (tutorialStep === 4) {
      setTutorialStep(0);
    } else {
      setTutorialStep(prev => prev + 1);
    }
  };

  const renderTutorialBubble = () => {
    if (tutorialStep === 0) {
      return null;
    }

    return (
      <TutorialBubble
        currentStep={tutorialStep}
        onNext={handleNextTutorial}
      />
    );
  };

  if (isLoading) {
    return <div>商品を読み込み中です...</div>;
  }

  const rightContent = (
    <div className="right-content-wrapper">
      <ToggleButtons currentView={viewMode} onToggle={handleToggleView} />
    </div>
  );

  return (
    <div className='app-container'>
      {tutorialStep > 0 && <div className='tutorial-overlay'></div>}
      <div className='comparison-screen main-content'>
        <NavigationHeader
          onBack={() => navigate('/type-selection')}
          rightContent={rightContent}
        />
        {renderTutorialBubble()}
        <div className='center-container'>
          {viewMode === 'matchup' ? (
            <div className='matchup-view'>
              <ProductCarousel
                products={products}
                onProductSelect={handleProductSelect}
                onFavoriteToggle={handleFavoriteToggle}
                onCurrentProductChange={setTopProductId}
              />
              <div className="vs-divider" onClick={handleVsClick} >バトルを開始</div>
              <ProductCarousel
                products={products}
                onProductSelect={handleProductSelect}
                onFavoriteToggle={handleFavoriteToggle}
                onCurrentProductChange={setBottomProductId}
              />
            </div>
          ) : (
            <div className='grid-view'>
              <ProductGrid
                products={products}
                onProductSelect={handleProductSelect}
                onFavoriteToggle={handleFavoriteToggle}
              />
            </div>
          )}
        </div>
      </div>
      {showOverlay && <FirstVisitOverlay onClose={handleCloseOverlay} />}
      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};

export default ComparisonScreen;
