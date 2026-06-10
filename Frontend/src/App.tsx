import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import React, { useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import { 
  LoginPage, SignupPage, ForgotPasswordPage, VerifyOtpPage, ResetPasswordPage 
} from './pages/AuthPages';
import DashboardPage from './pages/DashboardPage';
import ClassroomPage from './pages/ClassroomPage';
import ProfilePage from './pages/ProfilePage';
import ToastContainer from './components/Toast';
import { useAppStore } from './store';

export default function App() {
  const initAuth = useAppStore(state => state.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);
  return (
    <BrowserRouter>
      {/* Dynamic Global Notification Toast Messages Layer */}
      <ToastContainer />

      <Routes>
        {/* Public landing presentation page */}
        <Route path="/" element={<LandingPage />} />

        {/* Dynamic Interactive authentication flow routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Private workspaces cockpits */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/classroom/:id" element={<ClassroomPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* Wildcard catch redirecting back to user dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
