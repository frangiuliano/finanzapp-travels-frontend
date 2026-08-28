import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/services/authService';
import axios from 'axios';
import { getSafeAuthRedirect } from '@/lib/auth-redirect';

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleResendVerification = async () => {
    const email = emailOrUsername.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError(
        'Ingresa el email de la cuenta, en lugar del nombre de usuario, para reenviar la verificación.',
      );
      return;
    }

    setIsResending(true);
    setError(null);
    try {
      await authService.resendVerification(email);
      setError(null);
      alert(
        'Email de verificación reenviado. Por favor, revisa tu bandeja de entrada.',
      );
    } catch (err: unknown) {
      const errorMessage =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : 'Error al reenviar el email. Por favor, intenta de nuevo.';
      setError(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setEmailNotVerified(false);
    setIsLoading(true);

    try {
      await authService.login({ emailOrUsername, password });

      navigate(getSafeAuthRedirect(searchParams.get('redirect')), {
        replace: true,
      });
    } catch (err: unknown) {
      const errorMessage =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : 'Error al iniciar sesión. Por favor, intenta de nuevo.';
      if (errorMessage.toLowerCase().includes('verificar tu email')) {
        setEmailNotVerified(true);
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
          <CardDescription>
            Ingresa tu email o nombre de usuario para iniciar sesión en tu
            cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              {error && !emailNotVerified && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {emailNotVerified && (
                <div className="rounded-md bg-yellow-50 dark:bg-yellow-950 p-4 space-y-3">
                  <div className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                    ⚠️ Tu email no ha sido verificado
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Por favor, verifica tu email antes de continuar. Revisa tu
                    bandeja de entrada y haz clic en el enlace de verificación.
                  </p>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button
                    type="button"
                    onClick={handleResendVerification}
                    variant="outline"
                    className="w-full"
                    disabled={isResending}
                  >
                    {isResending
                      ? 'Reenviando...'
                      : 'Reenviar email de verificación'}
                  </Button>
                  <div className="text-center text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setEmailNotVerified(false);
                        setError(null);
                      }}
                      className="text-primary hover:underline"
                    >
                      Intentar iniciar sesión nuevamente
                    </button>
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="emailOrUsername">
                  Email o Nombre de Usuario
                </Label>
                <Input
                  id="emailOrUsername"
                  type="text"
                  placeholder="email@example.com o nombre_usuario"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  required
                  disabled={isLoading || emailNotVerified}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link
                    to="/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading || emailNotVerified}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || emailNotVerified}
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              ¿No tienes una cuenta?{' '}
              <Link
                to="/signup"
                className="underline underline-offset-4 hover:text-primary"
              >
                Regístrate
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
