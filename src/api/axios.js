import axios from "axios";

const api = axios.create({
  baseURL: "https://hudumalink.onrender.com/api",
  headers: {
    "Content-Type": "application/json"
  },
  withCredentials: true
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hl_token')
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hl_token')
      localStorage.removeItem('hl_user')
      localStorage.removeItem('hl_refresh')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api;
