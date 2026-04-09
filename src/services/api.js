import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hl_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hl_token')
      localStorage.removeItem('hl_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ─── Auth ───────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  logout: () => api.post('/auth/logout/'),
  me: () => api.get('/auth/me/'),
  refreshToken: (refresh) => api.post('/auth/token/refresh/', { refresh }),
  googleAuth: (token) => api.post('/auth/google/', { token }),
  changePassword: (data) => api.post('/auth/change-password/', data),
}

// ─── Services ───────────────────────────────────────────
export const servicesAPI = {
  list: (params) => api.get('/services/', { params }),
  detail: (id) => api.get(`/services/${id}/`),
  categories: () => api.get('/services/categories/'),
  createRequest: (data) => api.post('/service-requests/', data),
  myRequests: (params) => api.get('/service-requests/my/', { params }),
  requestDetail: (id) => api.get(`/service-requests/${id}/`),
  updateRequest: (id, data) => api.patch(`/service-requests/${id}/`, data),
  cancelRequest: (id) => api.post(`/service-requests/${id}/cancel/`),
  respond: (id, data) => api.post(`/service-requests/${id}/respond/`, data),
}

// ─── Marketplace ────────────────────────────────────────
export const marketplaceAPI = {
  list: (params) => api.get('/marketplace/products/', { params }),
  detail: (id) => api.get(`/marketplace/products/${id}/`),
  create: (data) => api.post('/marketplace/products/', data),
  update: (id, data) => api.patch(`/marketplace/products/${id}/`, data),
  delete: (id) => api.delete(`/marketplace/products/${id}/`),
  categories: () => api.get('/marketplace/categories/'),
  myProducts: () => api.get('/marketplace/products/mine/'),
  myOrders: (params) => api.get('/marketplace/orders/my/', { params }),
  createOrder: (data) => api.post('/marketplace/orders/', data),
  orderDetail: (id) => api.get(`/marketplace/orders/${id}/`),
}

// ─── Food & Restaurants ─────────────────────────────────
export const foodAPI = {
  restaurants: (params) => api.get('/food/restaurants/', { params }),
  restaurantDetail: (id) => api.get(`/food/restaurants/${id}/`),
  menu: (restaurantId) => api.get(`/food/restaurants/${restaurantId}/menu/`),
  createOrder: (data) => api.post('/food/orders/', data),
  myOrders: () => api.get('/food/orders/my/'),
  orderDetail: (id) => api.get(`/food/orders/${id}/`),
  trackOrder: (id) => api.get(`/food/orders/${id}/track/`),
}

export const restaurantOwnerAPI = {
  dashboard: () => api.get('/food/me/dashboard/'),
  myRestaurant: () => api.get('/food/me/restaurant/'),
  createRestaurant: (data) => api.post('/food/me/restaurant/', data),
  updateRestaurant: (data) => api.patch('/food/me/restaurant/', data),
  createMenuItem: (data) => api.post('/food/me/menu/', data),
  updateMenuItem: (id, data) => api.patch(`/food/me/menu/${id}/`, data),
  deleteMenuItem: (id) => api.delete(`/food/me/menu/${id}/`),
}

// ─── Delivery ───────────────────────────────────────────
export const deliveryAPI = {
  register: (data) => api.post('/delivery/register/', data),
  profile: () => api.get('/delivery/profile/'),
  updateProfile: (data) => api.patch('/delivery/profile/', data),
  activeDeliveries: () => api.get('/delivery/active/'),
  history: (params) => api.get('/delivery/history/', { params }),
  updateLocation: (data) => api.post('/delivery/location/', data),
  acceptDelivery: (id) => api.post(`/delivery/${id}/accept/`),
  completeDelivery: (id) => api.post(`/delivery/${id}/complete/`),
}

// ─── Notifications ──────────────────────────────────────
export const notificationsAPI = {
  list: (params) => api.get('/notifications/', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read/`),
  markAllRead: () => api.post('/notifications/mark-all-read/'),
  unreadCount: () => api.get('/notifications/unread-count/'),
  delete: (id) => api.delete(`/notifications/${id}/`),
}

// ─── Wallet ─────────────────────────────────────────────
export const walletAPI = {
  balance: () => api.get('/wallet/balance/'),
  transactions: (params) => api.get('/wallet/transactions/', { params }),
  topup: (data) => api.post('/wallet/topup/', data),
  withdraw: (data) => api.post('/wallet/withdraw/', data),
  transfer: (data) => api.post('/wallet/transfer/', data),
}

// ─── Referrals ──────────────────────────────────────────
export const referralAPI = {
  myCode: () => api.get('/referrals/my-code/'),
  stats: () => api.get('/referrals/stats/'),
  history: () => api.get('/referrals/history/'),
}

// ─── Provider ───────────────────────────────────────────
export const providerAPI = {
  profile: (id) => api.get(`/providers/${id}/`),
  myProfile: () => api.get('/providers/me/'),
  updateProfile: (data) => api.patch('/providers/me/', data),
  uploadVerification: (data) => api.post('/providers/verification/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  verificationStatus: () => api.get('/providers/verification/status/'),
  availability: () => api.get('/providers/me/availability/'),
  updateAvailability: (data) => api.patch('/providers/me/availability/', data),
  bookings: (params) => api.get('/providers/me/bookings/', { params }),
  dashboard: () => api.get('/providers/me/dashboard/'),
  earnings: (params) => api.get('/providers/me/earnings/', { params }),
}

// ─── Admin ──────────────────────────────────────────────
export const adminAPI = {
  stats: () => api.get('/admin/stats/'),
  users: (params) => api.get('/admin/users/', { params }),
  updateUser: (id, data) => api.patch(`/admin/users/${id}/`, data),
  pendingVerifications: () => api.get('/admin/verifications/pending/'),
  approveVerification: (id) => api.post(`/admin/verifications/${id}/approve/`),
  rejectVerification: (id, data) => api.post(`/admin/verifications/${id}/reject/`, data),
  reports: (params) => api.get('/admin/reports/', { params }),
  activityLog: () => api.get('/admin/activity/'),
}

// ─── Reviews ────────────────────────────────────────────
export const reviewsAPI = {
  list: (type, id) => api.get(`/reviews/${type}/${id}/`),
  create: (data) => api.post('/reviews/', data),
  myReviews: () => api.get('/reviews/mine/'),
}

// ─── Pricing Plans ──────────────────────────────────────
export const plansAPI = {
  list: () => api.get('/plans/'),
  subscribe: (data) => api.post('/plans/subscribe/', data),
  currentPlan: () => api.get('/plans/current/'),
}

export default api
