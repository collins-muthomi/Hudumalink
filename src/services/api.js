import api from '../api/axios'

export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  verifyEmail: (data) => api.post('/auth/verify-email/', data),
  resendVerificationCode: (data) => api.post('/auth/resend-verification-code/', data),
  login: (data) => api.post('/auth/login/', data),
  logout: () => api.post('/auth/logout/'),
  me: () => api.get('/auth/me/'),
  refreshToken: () => api.post('/auth/token/refresh/'),
  googleAuth: (token) => api.post('/auth/google/', { token }),
  changePassword: (data) => api.post('/auth/change-password/', data),
}

export const servicesAPI = {
  list: (params) => api.get('/services/', { params }),
  detail: (id) => api.get(`/services/${id}/`),
  categories: () => api.get('/services/categories/'),
  mine: () => api.get('/services/mine/'),
  create: (data) => api.post('/services/', data),
  update: (id, data) => api.patch(`/services/${id}/`, data),
}

export const requestsAPI = {
  create: (data) => api.post('/requests/', data),
  open: (params) => api.get('/requests/open/', { params }),
  my: (params) => api.get('/requests/mine/', { params }),
  detail: (id) => api.get(`/requests/${id}/`),
  accept: (id) => api.patch(`/requests/${id}/accept/`),
  updateStatus: (id, data) => api.patch(`/requests/${id}/status/`, data),
}

export const serviceBookingsAPI = {
  create: (data) => api.post('/service-requests/', data),
  my: (params) => api.get('/service-requests/my/', { params }),
  detail: (id) => api.get(`/service-requests/${id}/`),
  accept: (id) => api.patch(`/service-requests/${id}/accept/`),
  updateStatus: (id, data) => api.patch(`/service-requests/${id}/status/`, data),
  providerJobs: (params) => api.get('/service-requests/provider/jobs/', { params }),
}

export const marketplaceAPI = {
  list: (params) => api.get('/marketplace/products/', { params }),
  detail: (id) => api.get(`/marketplace/products/${id}/`),
  create: (data) => api.post('/marketplace/products/', data),
  update: (id, data) => api.patch(`/marketplace/products/${id}/`, data),
  delete: (id) => api.delete(`/marketplace/products/${id}/`),
  categories: () => api.get('/marketplace/categories/'),
  myProducts: () => api.get('/marketplace/products/mine/'),
  createOrder: (data) => api.post('/marketplace/orders/', data),
}

export const notificationsAPI = {
  list: (params) => api.get('/notifications/', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read/`),
  markAllRead: () => api.post('/notifications/mark-all-read/'),
  unreadCount: () => api.get('/notifications/unread-count/'),
  delete: (id) => api.delete(`/notifications/${id}/`),
}

export const walletAPI = {
  balance: () => api.get('/wallet/balance/'),
  transactions: (params) => api.get('/wallet/transactions/', { params }),
  topup: (data) => api.post('/wallet/topup/', data),
  withdraw: (data) => api.post('/wallet/withdraw/', data),
  transfer: (data) => api.post('/wallet/transfer/', data),
  payServiceBooking: (id) => api.post(`/wallet/service-bookings/${id}/pay/`),
  payCustomerRequest: (id) => api.post(`/wallet/requests/${id}/pay/`),
}

export const referralAPI = {
  myCode: () => api.get('/referrals/my-code/'),
  stats: () => api.get('/referrals/stats/'),
  history: () => api.get('/referrals/history/'),
}

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

export const reviewsAPI = {
  list: (type, id) => api.get(`/reviews/${type}/${id}/`),
  create: (data) => api.post('/reviews/', data),
  myReviews: () => api.get('/reviews/mine/'),
}

export const plansAPI = {
  list: () => api.get('/plans/'),
  subscribe: (data) => api.post('/plans/subscribe/', data),
  currentPlan: () => api.get('/plans/current/'),
}

export default api
