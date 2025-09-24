import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../contexts/AppStateContext';
import { ProductType, UserArchetype, SummaryResponse } from './../types'; // Import SummaryResponse
import NavigationHeader from '../components/common/NavigationHeader';
import TypeCarousel from '../components/product/TypeCarousel';
import characterImage from '../assets/logo-happy.png';
import placeholderImage from '../assets/logo-sampleImage.png'; // Import placeholder
import loadingVideo from '../assets/loading_search_8412180019949623590.mp4'; // Import loading video
import apiClient from '../services/APIClient'; // Import apiClient
import './TypeSelectionScreen.scss';

const TypeSelectionScreen: React.FC = () => {
  const { userArchetypes, searchKeyword, setRecommendedProducts } = useAppState();
  const [isDiagnosisCompleted, setIsDiagnosisCompleted] = useState(false);
  const [diagnosisResults, setDiagnosisResults] = useState<{ [key: string]: boolean }>({});
  const [isSummarizing, setIsSummarizing] = useState(false); // New loading state
  const [summaryError, setSummaryError] = useState<string | null>(null); // New error state
  const navigate = useNavigate();
  const keyword = searchKeyword; // Get keyword from global state

  useEffect(() => {
    // If archetypes are not loaded (e.g., direct navigation), redirect to home
    if (userArchetypes.length === 0) {
      navigate('/');
    }
  }, [userArchetypes, navigate]);

  // Adapt UserArchetype[] to ProductType[] for the TypeCarousel component
  const productTypesForCarousel: ProductType[] = userArchetypes.map((archetype: UserArchetype) => ({
    ...archetype,
    // Provide a fallback for the image URL
    imageUrl: archetype.imageUrl || placeholderImage,
    sampleProducts: [], // sampleProducts data structure is different, so we pass an empty array
  }));

  // Handler when the carousel diagnosis is complete
  const handleDiagnosisComplete = (data: { selections: { [key: string]: boolean }, isCompleted: boolean }) => {
    if (data.isCompleted) {
      setIsDiagnosisCompleted(true);
      setDiagnosisResults(data.selections);
    }
  };

  // Navigate to the next screen with the diagnosis results
  const handleFindProducts = async () => {
    const preferredTypeIds = Object.keys(diagnosisResults).filter(id => diagnosisResults[id]);
    const selectedArchetypes = userArchetypes.filter(archetype => preferredTypeIds.includes(archetype.id));
    const selectedCharacteristics = [...new Set(selectedArchetypes.flatMap(archetype => archetype.characteristics))];

    setIsSummarizing(true);
    setSummaryError(null);

    try {
      const response = await apiClient.post<SummaryResponse>('/api/v1/products/summary', {
        keyword: keyword,
        tags: selectedCharacteristics,
      });

      if (response.data && response.data.recommended_products) {
        // Set recommended products in the global state
        setRecommendedProducts(response.data.recommended_products);
        // Navigate to the comparison screen
        navigate('/comparison');
      } else {
        throw new Error("Invalid response structure from /summary");
      }
    } catch (error) {
      console.error("Failed to get recommended products:", error);
      setSummaryError('おすすめ商品の取得中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsSummarizing(false);
    }
  };

  // Restart diagnosis or go back to the welcome screen
  const handleRestart = () => {
    navigate('/');
  };

  const reSearchButton = (
    <button onClick={handleRestart} className="re-search-button">
      <span className="material-symbols-outlined">
        home
      </span>
      最初からやり直す
    </button>
  );

  return (
    <div className='app-container'>
      <div className='typeselection-screen main-content'>
        <NavigationHeader
         onBack={handleRestart}
         rightContent={reSearchButton}
        />
          {isDiagnosisCompleted ? (
            <div className="completion-message-container">
              <h2 className="completion-message">診断が完了しました。</h2>
              <p className="completion-text">あなたの好みに基づいて、AIが最適な商品を探します。</p>
              <div className="character-section">
                <img src={characterImage} alt="キャラクター" className="character-image" />
              </div>
              {summaryError && <p className="error-message">{summaryError}</p>}
              <button 
                className="find-products-button" 
                onClick={handleFindProducts}
                disabled={isSummarizing}
              >
                AIにおすすめ商品を探してもらう！
              </button>
            </div>
          ) : (
            <>
              <div className="typeselection-content">
                <div className="learning-message-box">
                  <h2>
                    {keyword ? (
                      <>
                        「{keyword}」について<br />
                        あなたの好みを学習中
                      </>
                    ) : (
                      'あなたの好みを学習中'
                    )}
                  </h2>
                  <p>どの商品タイプが好みですか？<br />AIがあなたの好みにぴったりな商品を見つけます。</p>
                </div>
                <div className="typecarousel-content">
                  <TypeCarousel types={productTypesForCarousel} onComplete={handleDiagnosisComplete} />
                </div>
              </div>
            </>
          )}
      </div>
      {isSummarizing && (
        <div className="loading-modal-overlay">
          <div className="loading-modal-content">
            <video src={loadingVideo} autoPlay loop muted playsInline className="loading-video" />
            <p className="loading-message">AIがあなたの好みにぴったりな商品を探しています...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TypeSelectionScreen;
