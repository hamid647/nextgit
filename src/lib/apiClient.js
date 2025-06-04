import axios from 'axios';

// Determine the base URL based on the environment
// In a Next.js app, API routes are typically prefixed with /api
// When running locally with a separate backend, we'll proxy these
// In production, Next.js can serve API routes directly or proxy to a backend
const API_URL = '/api'; // This will be proxied by Next.js dev server

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to requests
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') { // Ensure window is defined (client-side)
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// You can add specific API call functions here as needed, for example:
// export const loginUser = (credentials) => apiClient.post('/auth/login', credentials);
// export const registerUser = (userData) => apiClient.post('/auth/register', userData);
// export const getServices = () => apiClient.get('/services');

export default apiClient;
