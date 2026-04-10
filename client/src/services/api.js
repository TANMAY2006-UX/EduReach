import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,   // always send HttpOnly cookie
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,          // 10 second timeout on every request
});

// Response interceptor:
// 401 → let AuthContext handle it (it polls and checks visibility)
// Network error → log cleanly
api.interceptors.response.use(
  res => res,
  error => {
    if (error.code === 'ECONNABORTED') {
      console.error('[API] Request timed out:', error.config?.url);
    }
    // Don't redirect here — AuthContext handles 401 centrally
    return Promise.reject(error);
  }
);

export default api;