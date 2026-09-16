import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { WishlistProvider } from "./context/WishlistContext";
import { NotificationProvider } from "./context/NotificationContext";
import { SocketProvider } from "./context/SocketContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";

import Navbar from "./components/Navbar";
import MobileBottomNav from "./components/MobileBottomNav";
import Footer from "./components/Footer";
import { ProtectedRoute, AdminRoute } from "./components/RouteGuards";

import Home from "./pages/Home";
import Marketplace from "./pages/Marketplace";
import ProductDetails from "./pages/ProductDetails";
import SellProduct from "./pages/SellProduct";
import { Login, Register, ForgotPassword } from "./pages/AuthPages";
import UserDashboard from "./pages/UserDashboard";
import UserProfile from "./pages/UserProfile";
import WishlistPage from "./pages/WishlistPage";
import MessagesPage from "./pages/MessagesPage";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <WishlistProvider>
              <NotificationProvider>
                <ToastProvider>
                  <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-800 dark:text-slate-100 w-full max-w-full transition-colors duration-200">
                <Navbar />
                <main className="flex-1 pb-16 md:pb-0 w-full max-w-full overflow-x-hidden">
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Marketplace />} />
                    <Route path="/browse" element={<Marketplace />} />
                    <Route path="/marketplace" element={<Marketplace />} />
                    <Route path="/categories" element={<Marketplace />} />
                    <Route path="/impact" element={<Home />} />
                    <Route path="/about" element={<Home />} />
                    <Route path="/products/:id" element={<ProductDetails />} />
                    <Route path="/profile/:id" element={<UserProfile />} />
                    
                    {/* Auth Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/admin/login" element={<Login defaultAdmin={true} />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<Login />} />

                    {/* Protected Student Routes */}
                    <Route element={<ProtectedRoute />}>
                      <Route path="/sell" element={<SellProduct />} />
                      <Route path="/dashboard" element={<UserDashboard />} />
                      <Route path="/dashboard/listings" element={<UserDashboard />} />
                      <Route path="/dashboard/offers" element={<UserDashboard />} />
                      <Route path="/dashboard/settings" element={<UserDashboard />} />
                      <Route path="/dashboard/messages" element={<MessagesPage />} />
                      <Route path="/wishlist" element={<WishlistPage />} />
                      <Route path="/messages" element={<MessagesPage />} />
                      <Route path="/notifications" element={<UserDashboard />} />
                      <Route path="/settings" element={<Navigate to="/dashboard?tab=settings" replace />} />
                    </Route>

                    {/* Admin Only Routes */}
                    <Route element={<AdminRoute />}>
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/admin/users" element={<AdminDashboard />} />
                      <Route path="/admin/products" element={<AdminDashboard />} />
                      <Route path="/admin/categories" element={<AdminDashboard />} />
                      <Route path="/admin/reports" element={<AdminDashboard />} />
                      <Route path="/admin/analytics" element={<AdminDashboard />} />
                    </Route>

                    {/* 404 Route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
                <MobileBottomNav />
              </div>
              </ToastProvider>
            </NotificationProvider>
          </WishlistProvider>
        </SocketProvider>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}