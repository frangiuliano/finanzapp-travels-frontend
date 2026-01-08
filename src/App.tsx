import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import EmailVerificationPage from '@/pages/EmailVerificationPage';
import DashboardPage from '@/pages/DashboardPage';

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
