import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider, CartProvider, NotificationsProvider } from './context/contexts'
import ToastContainer from './components/ui/ToastContainer'
import ProtectedRoute from './components/layout/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'

import LandingPage from './pages/LandingPage'
import NotFound from './pages/NotFound'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import CustomerDashboard from './pages/dashboards/CustomerDashboard'
import ProviderDashboard from './pages/dashboards/ProviderDashboard'
import DeliveryDriverDashboard from './pages/dashboards/DeliveryDriverDashboard'
import RestaurantOwnerDashboard from './pages/dashboards/RestaurantOwnerDashboard'
import AdminDashboard from './pages/dashboards/AdminDashboard'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminVerificationsPage from './pages/admin/AdminVerificationsPage'
import AdminReportsPage from './pages/admin/AdminReportsPage'
import BrowseServices from './pages/services/BrowseServices'
import PostServiceRequest from './pages/services/PostServiceRequest'
import ServiceRequestDetail from './pages/services/ServiceRequestDetail'
import MyRequests from './pages/services/MyRequests'
import BrowseMarketplace from './pages/marketplace/BrowseMarketplace'
import ProductDetail from './pages/marketplace/ProductDetail'
import AddProductForSale from './pages/marketplace/AddProductForSale'
import MyOrders from './pages/marketplace/MyOrders'
import RestaurantList from './pages/food/RestaurantList'
import RestaurantDetail from './pages/food/RestaurantDetail'
import FoodPlace from './pages/food/FoodPlace'
import Cart from './pages/food/Cart'
import Checkout from './pages/food/Checkout'
import ProviderVerification from './pages/provider/ProviderVerification'
import BookingCalendar from './pages/provider/BookingCalendar'
import RestaurantManagePage from './pages/restaurant/RestaurantManagePage'
import DeliveryDriverRegistration from './pages/delivery/DeliveryDriverRegistration'
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
                    <Route path="/dashboard/driver" element={
                      <ProtectedRoute allowedRoles={['delivery_driver']}>
                        <DeliveryDriverDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/restaurant" element={
                      <ProtectedRoute allowedRoles={['restaurant_owner']}>
                        <RestaurantOwnerDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/restaurant/manage" element={
                      <ProtectedRoute allowedRoles={['restaurant_owner']}>
                        <RestaurantManagePage />
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

                    <Route path="/marketplace" element={<BrowseMarketplace />} />
                    <Route path="/marketplace/:id" element={<ProductDetail />} />
                    <Route path="/marketplace/sell" element={<AddProductForSale />} />
                    <Route path="/my-orders" element={<MyOrders />} />

                    <Route path="/food" element={<RestaurantList />} />
                    <Route path="/food/place/:id" element={<FoodPlace />} />
                    <Route path="/food/restaurant/:id" element={<RestaurantDetail />} />
                    <Route path="/food/cart" element={<Cart />} />
                    <Route path="/food/checkout" element={<Checkout />} />

                    <Route path="/dashboard/provider/verification" element={<ProviderVerification />} />
                    <Route path="/dashboard/provider/bookings" element={<BookingCalendar />} />
                    <Route path="/providers/:id" element={<ProviderProfile />} />

                    <Route path="/delivery/register" element={<DeliveryDriverRegistration />} />

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
