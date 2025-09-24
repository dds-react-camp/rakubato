import { useState } from 'react';
import { ChatMessage } from '../types';
import { ChatService } from '../services/ChatService';
import { v4 as uuidv4 } from 'uuid';

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);

  const sendMessage = async (messageText: string) => {
    const userMessage: ChatMessage = {
      id: uuidv4(),
      content: messageText,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await ChatService.sendMessage({ 
        message: messageText, 
        conversationId 
      });
      
      console.log('API Response:', response); // DEBUGGING

      const aiMessage: ChatMessage = {
        id: uuidv4(),
        content: response.message,
        sender: 'ai',
        timestamp: new Date(response.timestamp),
        conversationId: response.conversationId,
        navigateTo: response.navigateTo, // Pass navigateTo to the message object
      };

      // REMOVED: Automatic navigation
      // if (response.navigateTo) {
      //   navigate(response.navigateTo);
      // }

      if (!conversationId) {
        setConversationId(response.conversationId);
      }

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("--- !!! CHAT HOOK ERROR !!! ---", error);
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        content: "Sorry, something went wrong. Please check the console.",
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, isLoading, sendMessage };
};
