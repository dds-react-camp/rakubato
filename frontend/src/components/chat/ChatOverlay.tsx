import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatMessage } from '../../types';
import './ChatOverlay.scss';

interface ChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const ChatOverlay: React.FC<ChatOverlayProps> = ({ isOpen, onClose, messages, onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose(); // Close chat overlay after navigation
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className='chat-overlay-backdrop' onClick={onClose}>
      <div className='chat-overlay-container' onClick={(e) => e.stopPropagation()}>
        <header className='chat-header'>
          <h3>AI アシスタント</h3>
          <button onClick={onClose} className='close-btn' aria-label="Close chat">&times;</button>
        </header>
        <div className='chat-messages'>
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-bubble-wrapper ${msg.sender}`}>
              <div className={`chat-bubble ${msg.sender}`}>
                {msg.content}
                {msg.navigateTo && msg.sender === 'ai' && (
                  <button 
                    className="navigate-btn"
                    onClick={() => handleNavigation(msg.navigateTo!)}
                  >
                    画面を移動する
                  </button>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="chat-bubble-wrapper ai">
              <div className="chat-bubble ai loading">
                <span>.</span><span>.</span><span>.</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className='chat-input-area'>
          <input 
            type='text' 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder='メッセージを入力...' 
            aria-label="Chat input"
          />
          <button onClick={handleSend} disabled={isLoading} aria-label="Send message">
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatOverlay;
