import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { useAuth, isPublicAuthPath } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import EmailVerificationPage from '@/pages/EmailVerificationPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import DashboardPage from '@/pages/DashboardPage';
import InvitationPage from '@/pages/InvitationPage';
import TravelPage from '@/pages/TravelPage';
import SettingsPage from '@/pages/SettingsPage';
import CapturePage from '@/pages/CapturePage';
import ReportsPage from '@/pages/ReportsPage';
import OnboardingPage from '@/pages/OnboardingPage';
import BoardSettingsPage from '@/pages/BoardSettingsPage';
import BillingPeriodConfirmPage from '@/pages/BillingPeriodConfirmPage';
import SimulateExpensePage from '@/pages/SimulateExpensePage';
import { Toaster } from '@/components/ui/sonner';
import { PWAUpdatePrompt } from '@/components/pwa-update-prompt';
import { AppShellLayout } from '@/components/app-shell-layout';
import { ReactNode } from 'react';

function ProtectedApp({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return children;
}

function AppRoutes() {
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useAuth();
  const bypassLoading = isPublicAuthPath(location.pathname);

  if (isLoading && !bypassLoading) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-background">
        <div className="font-display text-lg text-muted-foreground">
          Cargando…
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/home" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/login"
        element={
          isAuthenticated && user?.emailVerified ? (
            <Navigate to="/home" replace />
          ) : (
            <LoginPage />
          )
        }
      />
      <Route
        path="/signup"
        element={
          isAuthenticated && user?.emailVerified ? (
            <Navigate to="/home" replace />
          ) : isAuthenticated ? (
            <Navigate to="/verify-email" replace />
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
            <Navigate to="/home" replace />
          ) : (
            <ForgotPasswordPage />
          )
        }
      />
      <Route
        path="/auth/reset-password"
        element={
          isAuthenticated ? (
            <Navigate to="/home" replace />
          ) : (
            <ResetPasswordPage />
          )
        }
      />
      <Route path="/trips/invitation/:token" element={<InvitationPage />} />
      <Route
        element={
          <ProtectedApp>
            <AppShellLayout />
          </ProtectedApp>
        }
      >
        <Route path="/home" element={<DashboardPage />} />
        <Route path="/capture" element={<CapturePage />} />
        <Route path="/simulate" element={<SimulateExpensePage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/travel" element={<TravelPage />} />
        <Route path="/boards" element={<Navigate to="/travel" replace />} />
        <Route path="/boards/settings" element={<BoardSettingsPage />} />
        <Route
          path="/billing-periods/confirm"
          element={<BillingPeriodConfirmPage />}
        />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/account" element={<SettingsPage />} />
      </Route>
      <Route path="/dashboard" element={<Navigate to="/home" replace />} />
      <Route path="/trips" element={<Navigate to="/travel" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <PWAUpdatePrompt />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
