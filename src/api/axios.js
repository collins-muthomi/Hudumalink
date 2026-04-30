import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json"
  },
  withCredentials: true
});

api.interceptors.request.use(
  (config) => {
    // Tokens are now handled via HTTP-only cookies, no need for manual header setting
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect for /auth/me/ endpoint - it's expected to return 401 when not authenticated
      if (error.config?.url?.includes('/auth/me/')) {
        return Promise.reject(error)
      }

      // Clear any remaining localStorage data (for backward compatibility)
      localStorage.removeItem('hl_token')
      localStorage.removeItem('hl_user')
      localStorage.removeItem('hl_refresh')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api;
