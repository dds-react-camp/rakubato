import apiClient from './APIClient';
import { Product, ProductType, BattleProduct } from '../types';

export const ProductService = {
  getProducts: (): Promise<Product[]> => {
    return apiClient.get('/api/v1/products/');
  },

  getProductById: (id: string): Promise<Product> => {
    return apiClient.get(`/api/v1/products/${id}`);
  },

  getProductTypes: (): Promise<ProductType[]> => {
    return apiClient.get('/api/v1/products/types');
  },

  getBattleProductById: (id: string): Promise<BattleProduct> => {
    return apiClient.get(`/api/v1/products/battle/${id}`);
  },

  fetchProductBattle: async (productName1: string, productName2: string): Promise<BattleProduct> => {
    const response = await apiClient.post('/api/v1/products/battle', {
      product_name_1: productName1,
      product_name_2: productName2,
    });
    return response.data;
  },
};
