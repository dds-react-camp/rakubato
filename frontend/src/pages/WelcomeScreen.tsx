import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import NavigationHeader from '../components/common/NavigationHeader';
import ChatOverlay from '../components/chat/ChatOverlay';
import MatchingOverlay from '../components/matching/MatchingOverlay';
import characterImage from '../assets/logo-transparent.png';
import './WelcomeScreen.scss';
import { useAppState } from '../contexts/AppStateContext';
import apiClient from '../services/APIClient';
import { NeedsAnalysisResponse } from '../types';

const WelcomeScreen: React.FC = () => {
  
  const navigate = useNavigate();
  const { setUserArchetypes, setSearchKeyword } = useAppState();

  // AIチャット
  const [isChatOpen, setChatOpen] = useState(false);
  const { messages, isLoading: isChatLoading, sendMessage } = useChat();
  
  // マッチング検索
  const [isMatchingOpen, setMatchingOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleMatchingSearch = async (query: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      // Cast the response to the expected data type, overriding the default AxiosResponse type
      // This is necessary because the apiClient interceptor modifies the response structure at runtime.
      const response = await apiClient.post<NeedsAnalysisResponse>('/api/v1/products/analyze-needs', {
        product_category: query,
      });

      // With the interceptor removed, we now access response.data
      if (response.data && response.data.user_archetypes) {
        setUserArchetypes(response.data.user_archetypes);
        setSearchKeyword(query); // Store keyword in global state
        navigate('/type-selection', { state: { keyword: query } });
      } else {
        // Throw an error if the response structure is invalid, to be caught by the catch block.
        throw new Error("Invalid response structure from /analyze-needs");
      }
    } catch (error) {
      console.error("Failed to analyze needs:", error);
      setAnalysisError('タイプの分析中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className='app-container'>
    <div className='welcome-screen main-content'>
      <NavigationHeader />
      <div className='welcome-content'>
        <div className='character-section'>
          <img src={characterImage} alt="キャラクター" className="character-image" />
          <h1 className="welcome-message">あなたの「好き」を連れよう！</h1>
          <h4>検索欄に入力してほしいものを探してみましょう</h4>
        </div>
        <div className="main-buttons-section">
          <div className="button-item" onClick={() => setMatchingOpen(true)}>
            <div className="button-icon-circle">
              <span className="material-symbols-outlined">
                search
              </span>
            </div>
            <p>マッチングで見つける</p>
          </div>
          {/* <div className="button-item" onClick={() => setChatOpen(true)}>
            <div className="button-icon-circle">
              <span className="material-symbols-outlined">
                chat
              </span>
            </div>
            <p>AIチャットで見つける</p>
          </div> */}
        </div>
      </div>
      <ChatOverlay 
        isOpen={isChatOpen} 
        onClose={() => setChatOpen(false)} 
        messages={messages} 
        isLoading={isChatLoading} 
        onSendMessage={sendMessage} 
      />
      <MatchingOverlay
        isOpen={isMatchingOpen}
        onClose={() => setMatchingOpen(false)}
        onSearch={handleMatchingSearch}
        isLoading={isAnalyzing}
        error={analysisError}
      />
    </div>
    </div>
  );
};

export default WelcomeScreen;
