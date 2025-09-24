import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { ProductService } from '../services/ProductService';
import { BattleProduct } from '../types';
import NavigationHeader from '../components/common/NavigationHeader';
import { useTypingAnimation } from '../hooks/useTypingAnimation';
import DescriptionBubble from '../components/battle/DescriptionBubble';
import loadingVideo from '../assets/loading_battle_1909910201858242239.mp4'; // Import loading video
import './BattleScreen.scss';
import placeholderMovie from '../assets/battle-dummy.mp4'; // Import placeholder

const loadingMessages = [
  "さあ、世紀の対決の準備が整いつつあります！AIが両者のデータを徹底分析中...ゴングまであとわずか！",
  "ただいま、AIが両選手に気合を入れています。最高のパフォーマンスにご期待ください！まもなく開戦！",
  "会場のボルテージは最高潮！AIが今、この戦いを最も面白くするためのシナリオを構築中！刮目して待て！"
];

const BattleScreen: React.FC = () => {
  const { param1, param2 } = useParams<{ param1: string; param2: string }>();
  const [battleProduct, setBattleProduct] = useState<BattleProduct | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [randomMessage, setRandomMessage] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  const { description1, description2 } = useTypingAnimation({
    texts1: battleProduct?.product1_description || [],
    texts2: battleProduct?.product2_description || [],
  });

  useEffect(() => {
    // メッセージをランダムに選択
    const randomIndex = Math.floor(Math.random() * loadingMessages.length);
    setRandomMessage(loadingMessages[randomIndex]);

    const fetchBattleData = async () => {
      if (!param1 || !param2) { // This is the line that throws the error
        return;
      }

      try {
        // Decode names back
        const decodedName1 = decodeURIComponent(param1);
        const decodedName2 = decodeURIComponent(param2);
        const result = await ProductService.fetchProductBattle(decodedName1, decodedName2);
        setBattleProduct(result);
      } catch (err) {
        console.error('Failed to fetch battle data:', err);
      }
    };

    fetchBattleData();
  }, [param1, param2]); // Re-run when product names in URL change

  const handleBack = () => {
    window.close();
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (!battleProduct) {
    return (
      <div className="loading-modal-overlay">
        <div className="loading-modal-content">
          <video src={loadingVideo} autoPlay loop muted playsInline className="loading-video" />
          <p className="loading-message">{randomMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="battle-screen">
      <NavigationHeader onBack={handleBack} />
      <div className="battle-container">
        <DescriptionBubble name={battleProduct.product1_name} description={description1} />
        <div className="video-container">
          <video ref={videoRef} src={battleProduct.video_url || placeholderMovie} autoPlay loop muted playsInline />
          <button className="play-pause-button" onClick={togglePlay}>
            {isPlaying ? '❚❚' : '▶'}
          </button>
        </div>
        <DescriptionBubble name={battleProduct.product2_name} description={description2} />
      </div>
    </div>
  );
};

export default BattleScreen;
