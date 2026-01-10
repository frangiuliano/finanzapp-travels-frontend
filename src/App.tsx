import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import EmailVerificationPage from '@/pages/EmailVerificationPage';
import DashboardPage from '@/pages/DashboardPage';
import InvitationPage from '@/pages/InvitationPage';
import TripsPage from '@/pages/TripsPage';
import StatisticsPage from '@/pages/StatisticsPage';
import { Toaster } from '@/components/ui/sonner';

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
            isAuthenticated ? (
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
          path="/statistics"
          element={
            isAuthenticated ? (
              user?.emailVerified ? (
                <StatisticsPage />
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
