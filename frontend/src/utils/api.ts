import axios from 'axios';
import { useUIStore } from '../store/useUIStore';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api',
  timeout: 30000, // 30s timeout
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error('[API Error] Connection to backend failed:', error);
      useUIStore.getState().addToast('Backend server is unreachable. Please verify if it is running.', 'error');
    }
    return Promise.reject(error);
  }
);

export default api;
