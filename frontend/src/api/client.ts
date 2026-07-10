import axios from 'axios';

// Assuming Vite proxies /api to the backend
export const apiClient = axios.create({
  baseURL: '/',
  headers: {
    'Content-Type': 'application/json',
  },
});
