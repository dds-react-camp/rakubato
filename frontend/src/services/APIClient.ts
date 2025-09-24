import axios, { AxiosInstance, AxiosResponse } from 'axios';

// 1. Get credentials from environment variables
const username = import.meta.env.VITE_BASIC_AUTH_USERNAME;
const password = import.meta.env.VITE_BASIC_AUTH_PASSWORD;

// 2. Create the Basic Auth token if credentials are provided
const token = username && password ? btoa(`${username}:${password}`) : '';

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
    // 3. Add the Authorization header
    ...(token && { 'Authorization': `Basic ${token}` }),
  },
});

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response, // Pass the full response object through
  (error) => {
    // You can handle errors globally here
    console.error('API call error:', error);
    return Promise.reject(error);
  }
);

export default apiClient;
