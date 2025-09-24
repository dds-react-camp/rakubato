import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserArchetype } from '../types';

import { Product } from '../types';

interface AppStateContextType {
  favoriteProducts: string[];
  toggleFavorite: (productId: string) => void;
  userArchetypes: UserArchetype[];
  setUserArchetypes: (archetypes: UserArchetype[]) => void;
  searchKeyword: string;
  setSearchKeyword: (keyword: string) => void;
  recommendedProducts: Product[];
  setRecommendedProducts: (products: Product[]) => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const AppStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [favoriteProducts, setFavoriteProducts] = useState<string[]>([]);
  const [userArchetypes, setUserArchetypes] = useState<UserArchetype[]>([]);
  const [searchKeyword, setSearchKeyword] = useState<string>(''); // Initialize new state
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);

  const toggleFavorite = (productId: string) => {
    setFavoriteProducts(prevFavorites => {
      if (prevFavorites.includes(productId)) {
        return prevFavorites.filter(id => id !== productId);
      } else {
        return [...prevFavorites, productId];
      }
    });
  };

  return (
    <AppStateContext.Provider value={{ 
      favoriteProducts, 
      toggleFavorite, 
      userArchetypes, 
      setUserArchetypes, 
      searchKeyword, 
      setSearchKeyword, 
      recommendedProducts, 
      setRecommendedProducts
    }}>
      {children}
    </AppStateContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
