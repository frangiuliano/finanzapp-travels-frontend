import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import EmailVerificationPage from '@/pages/EmailVerificationPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import DashboardPage from '@/pages/DashboardPage';
import InvitationPage from '@/pages/InvitationPage';
import TripsPage from '@/pages/TripsPage';
import SettingsPage from '@/pages/SettingsPage';
import { Toaster } from '@/components/ui/sonner';
import { PWAUpdatePrompt } from '@/components/pwa-update-prompt';

function App() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center">
        <div>Cargando...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster />
      <PWAUpdatePrompt />
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/login"
          element={
            isAuthenticated && user?.emailVerified ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage />
            )
          }
        />
        <Route
          path="/signup"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <SignupPage />
            )
          }
        />
        <Route
          path="/auth/verify-email/:token"
          element={<EmailVerificationPage />}
        />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
        <Route
          path="/forgot-password"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <ForgotPasswordPage />
            )
          }
        />
        <Route
          path="/auth/reset-password"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <ResetPasswordPage />
            )
          }
        />
        <Route path="/trips/invitation/:token" element={<InvitationPage />} />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              user?.emailVerified ? (
                <DashboardPage />
              ) : (
                <Navigate to="/verify-email" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/trips"
          element={
            isAuthenticated ? (
              user?.emailVerified ? (
                <TripsPage />
              ) : (
                <Navigate to="/verify-email" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/account"
          element={
            isAuthenticated ? (
              user?.emailVerified ? (
                <SettingsPage />
              ) : (
                <Navigate to="/verify-email" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
