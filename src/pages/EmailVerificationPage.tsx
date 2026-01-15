import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/services/api';

export default function EmailVerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token: tokenFromRoute } = useParams<{ token?: string }>();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [hasVerified, setHasVerified] = useState(false);
  const token = tokenFromRoute || searchParams.get('token');

  const verifyEmail = useCallback(
    async (verificationToken: string) => {
      if (hasVerified || isVerifying) {
        return;
      }

      setIsVerifying(true);
      setErrorMessage(null);

      try {
        const response = await api.get(
          `/auth/verify-email/${verificationToken}`,
        );

        if (response.data.message) {
          setHasVerified(true);
          setVerificationStatus('success');
          if (user && isAuthenticated) {
            useAuthStore
              .getState()
              .setAuth(
                { ...user, emailVerified: true },
                useAuthStore.getState().accessToken!,
              );
          }
          setTimeout(() => {
            if (isAuthenticated) {
              navigate('/dashboard');
            } else {
              navigate('/login');
            }
          }, 2000);
        }
      } catch (err: unknown) {
        const errorMessage =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response
                ?.data?.message
            : null;

        if (errorMessage?.includes('ya ha sido verificado')) {
          setHasVerified(true);
          setVerificationStatus('success');
          if (user && isAuthenticated) {
            useAuthStore
              .getState()
              .setAuth(
                { ...user, emailVerified: true },
                useAuthStore.getState().accessToken!,
              );
          }
          setTimeout(() => {
            if (isAuthenticated) {
              navigate('/dashboard');
            } else {
              navigate('/login');
            }
          }, 2000);
        } else if (isAuthenticated && user) {
          try {
            const userResponse = await api.get('/auth/me');
            if (userResponse.data?.emailVerified) {
              setHasVerified(true);
              setVerificationStatus('success');
              useAuthStore
                .getState()
                .setAuth(
                  userResponse.data,
                  useAuthStore.getState().accessToken!,
                );
              setTimeout(() => {
                navigate('/dashboard');
              }, 2000);
            } else {
              setVerificationStatus('error');
              setErrorMessage(
                errorMessage ||
                  'Error al verificar el email. El enlace puede haber expirado o ser inválido.',
              );
            }
          } catch {
            setVerificationStatus('error');
            setErrorMessage(
              errorMessage ||
                'Error al verificar el email. El enlace puede haber expirado o ser inválido.',
            );
          }
        } else {
          setVerificationStatus('error');
          setErrorMessage(
            errorMessage ||
              'Error al verificar el email. El enlace puede haber expirado o ser inválido.',
          );
        }
      } finally {
        setIsVerifying(false);
      }
    },
    [hasVerified, isVerifying, user, isAuthenticated, navigate],
  );

  useEffect(() => {
    if (!token && !isAuthenticated) {
      navigate('/login');
    }
  }, [token, isAuthenticated, navigate]);

  useEffect(() => {
    if (token && !hasVerified) {
      verifyEmail(token);
    }
  }, [token, verifyEmail, hasVerified]);

  const handleResendEmail = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setIsResending(true);
    setErrorMessage(null);
    try {
      await api.post('/auth/resend-verification');
      alert(
        'Email de verificación reenviado. Por favor, revisa tu bandeja de entrada.',
      );
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : null;
      setErrorMessage(
        errorMessage ||
          'Error al reenviar el email. Por favor, intenta de nuevo.',
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleGoToLogin = () => {
    if (isAuthenticated) {
      useAuthStore.getState().clearAuth();
    }
    navigate('/login');
  };

  if (token) {
    return (
      <div
        className={cn(
          'flex min-h-svh flex-col items-center justify-center bg-muted/50 p-4',
        )}
      >
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Verificando tu email</CardTitle>
              <CardDescription>
                Por favor espera mientras verificamos tu dirección de email
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isVerifying && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Verificando...
                  </p>
                </div>
              )}

              {verificationStatus === 'success' && (
                <div className="text-center py-4">
                  <div className="text-4xl mb-4">✅</div>
                  <p className="text-lg font-semibold text-green-600">
                    ¡Email verificado exitosamente!
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Redirigiendo...
                  </p>
                </div>
              )}

              {verificationStatus === 'error' && (
                <div className="space-y-4">
                  <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                    {errorMessage}
                  </div>
                  {isAuthenticated && (
                    <Button
                      onClick={handleResendEmail}
                      className="w-full"
                      variant="outline"
                      disabled={isResending}
                    >
                      {isResending
                        ? 'Reenviando...'
                        : 'Reenviar email de verificación'}
                    </Button>
                  )}
                  <div className="text-center text-sm">
                    <button
                      onClick={handleGoToLogin}
                      className="text-primary hover:underline"
                    >
                      Ir al inicio de sesión
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex min-h-svh flex-col items-center justify-center bg-muted/50 p-4',
      )}
    >
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Verifica tu email</CardTitle>
            <CardDescription>
              Hemos enviado un email de verificación a tu dirección
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <div className="text-4xl mb-4">📧</div>
              <p className="text-sm text-muted-foreground">
                Por favor, revisa tu bandeja de entrada y haz clic en el enlace
                de verificación que te enviamos a <strong>{user?.email}</strong>
              </p>
            </div>

            <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-3 text-sm">
              <p className="font-semibold mb-2">¿No recibiste el email?</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Revisa tu carpeta de spam o correo no deseado</li>
                <li>Verifica que el email sea correcto</li>
                <li>Espera unos minutos, puede tardar en llegar</li>
              </ul>
            </div>

            {isAuthenticated && (
              <Button
                onClick={handleResendEmail}
                className="w-full"
                variant="outline"
                disabled={isResending}
              >
                {isResending
                  ? 'Reenviando...'
                  : 'Reenviar email de verificación'}
              </Button>
            )}

            <div className="text-center text-sm">
              <button
                onClick={handleGoToLogin}
                className="text-primary hover:underline"
              >
                Ir al inicio de sesión
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
