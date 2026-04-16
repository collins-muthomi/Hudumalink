import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider, CartProvider, NotificationsProvider } from './context/contexts'
import ToastContainer from './components/ui/ToastContainer'
import ProtectedRoute from './components/layout/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'

import LandingPage from './pages/LandingPage'
import AboutUs from './pages/AboutUs'
import ContactUs from './pages/ContactUs'
import TermsOfService from './pages/TermsOfService'
import PrivacyPolicy from './pages/PrivacyPolicy'
import NotFound from './pages/NotFound'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import CustomerDashboard from './pages/dashboards/CustomerDashboard'
import ProviderDashboard from './pages/dashboards/ProviderDashboard'
import AdminDashboard from './pages/dashboards/AdminDashboard'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminVerificationsPage from './pages/admin/AdminVerificationsPage'
import AdminReportsPage from './pages/admin/AdminReportsPage'
import BrowseServices from './pages/services/BrowseServices'
import PostServiceRequest from './pages/services/PostServiceRequest'
import ServiceRequestDetail from './pages/services/ServiceRequestDetail'
import ServiceBookingDetail from './pages/services/ServiceBookingDetail'
import MyRequests from './pages/services/MyRequests'
import ProviderVerification from './pages/provider/ProviderVerification'
import BookingCalendar from './pages/provider/BookingCalendar'
import OpenRequests from './pages/provider/OpenRequests'
import ProviderJobs from './pages/provider/ProviderJobs'
import ManageServices from './pages/provider/ManageServices'
import NotificationsPage from './pages/NotificationsPage'
import PricingPlans from './pages/PricingPlans'
import ProviderProfile from './pages/ProviderProfile'
import ReferralPage from './pages/ReferralPage'
import WalletPage from './pages/WalletPage'

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <NotificationsProvider>
              <CartProvider>
                <ToastContainer />
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/about" element={<AboutUs />} />
                  <Route path="/contact" element={<ContactUs />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/pricing" element={<PricingPlans />} />

                  <Route element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }>
                    <Route path="/dashboard/customer" element={
                      <ProtectedRoute allowedRoles={['customer']}>
                        <CustomerDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/provider" element={
                      <ProtectedRoute allowedRoles={['provider']}>
                        <ProviderDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/admin" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/admin/users" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminUsersPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/admin/verifications" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminVerificationsPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/admin/reports" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminReportsPage />
                      </ProtectedRoute>
                    } />

                    <Route path="/services" element={<BrowseServices />} />
                    <Route path="/services/request/new" element={<PostServiceRequest />} />
                    <Route path="/services/request/:id" element={<ServiceRequestDetail />} />
                    <Route path="/my-requests" element={<MyRequests />} />

                    <Route path="/marketplace" element={<Navigate to="/services" replace />} />
                    <Route path="/marketplace/:id" element={<Navigate to="/services" replace />} />
                    <Route path="/marketplace/sell" element={<Navigate to="/services" replace />} />

                    <Route path="/dashboard/provider/verification" element={
                      <ProtectedRoute allowedRoles={['provider']}>
                        <ProviderVerification />
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/provider/bookings" element={
                      <ProtectedRoute allowedRoles={['provider']}>
                        <BookingCalendar />
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/provider/open-requests" element={
                      <ProtectedRoute allowedRoles={['provider']}>
                        <OpenRequests />
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/provider/jobs" element={
                      <ProtectedRoute allowedRoles={['provider']}>
                        <ProviderJobs />
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/provider/services" element={
                      <ProtectedRoute allowedRoles={['provider']}>
                        <ManageServices />
                      </ProtectedRoute>
                    } />
                    <Route path="/providers/:id" element={<ProviderProfile />} />
                    <Route path="/services/bookings/:id" element={<ServiceBookingDetail />} />

                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/wallet" element={<WalletPage />} />
                    <Route path="/referrals" element={<ReferralPage />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </CartProvider>
            </NotificationsProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
