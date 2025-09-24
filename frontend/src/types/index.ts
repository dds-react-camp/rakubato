export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  rating: number;
  isFavorite: boolean;
  favoriteCount: number;
  description: string;
  tags: string[];
  specifications: {
    [key: string]: any; // Allow any type for specifications
  };
  specs: {
    [key: string]: string;
  };
  aiRecommendation: string;
  price: number;
  reviewCount: number;
  rank?: number;
  category?: string;
  recommendation_reason?: string;
  source_urls?: string[];
}

export interface ProductType {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  characteristics: string[];
  sampleProducts: Product[];
}

export interface UserArchetype {
  id: string;
  name: string;
  description: string;
  characteristics: string[];
  sampleProducts: string[];
  imageUrl?: string | null;
}

export interface NeedsAnalysisResponse {
  user_archetypes: UserArchetype[];
}

export interface SummaryResponse {
  recommended_products: Product[];
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isLoading?: boolean;
  conversationId?: string;
  navigateTo?: string; // Add navigateTo property
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  suggestions?: string[];
  products?: Product[];
  timestamp: string;
  navigateTo?: string;
}

export interface APIError {
  message: string;
  code: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: Record<string, any>;
}

export interface BattleProduct {
  id: string;
  product1_id: string;
  product1_name: string;
  product1_description: string[];
  product2_id: string;
  product2_name: string;
  product2_description: string[];
  video_url: string;
}
