import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api',
  timeout: 30000, // 30s timeout
});

export default api;
