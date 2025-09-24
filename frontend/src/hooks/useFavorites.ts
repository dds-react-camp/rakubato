import { useLocalStorage } from './useLocalStorage';

export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorage<string[]>('favorites', []);

  const addFavorite = (productId: string) => {
    setFavorites(prevFavorites => {
      if (!prevFavorites.includes(productId)) {
        return [...prevFavorites, productId];
      }
      return prevFavorites;
    });
  };

  const removeFavorite = (productId: string) => {
    setFavorites(prevFavorites => prevFavorites.filter(id => id !== productId));
  };

  const isFavorite = (productId: string) => {
    return favorites.includes(productId);
  };

  return { favorites, addFavorite, removeFavorite, isFavorite };
}
