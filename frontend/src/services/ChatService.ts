import apiClient from './APIClient';
import { ChatResponse } from '../types';

interface ChatRequestPayload {
  message: string;
  conversationId?: string;
}

export const ChatService = {
  sendMessage: (payload: ChatRequestPayload): Promise<ChatResponse> => {
    return apiClient.post('/api/v1/chat/message', payload);
  },
};
