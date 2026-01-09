import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { participantsService } from '@/services/participantsService';
import { authService } from '@/services/authService';
import type { InvitationInfo } from '@/types/participant';
import axios from 'axios';

type PageState =
  | 'loading'
  | 'info'
  | 'accepting'
  | 'success'
  | 'error'
  | 'register';

export default function InvitationPage() {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [pageState, setPageState] = useState<PageState>('loading');
  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadInvitationInfo = useCallback(async () => {
    if (!token) {
      setErrorMessage('Token de invitación no válido');
      setPageState('error');
      return;
    }

    try {
      const info = await participantsService.getInvitationInfo(token);
      setInvitationInfo(info);
      setPageState('info');
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : 'No se pudo cargar la invitación. Puede que haya expirado o no exista.';
      setErrorMessage(message);
      setPageState('error');
    }
  }, [token]);

  useEffect(() => {
    loadInvitationInfo();
  }, [loadInvitationInfo]);

  const handleAcceptInvitation = async () => {
    if (!token) return;

    setPageState('accepting');
    try {
      const result = await participantsService.acceptInvitation(token);

      if (result.requiresRegistration) {
        setPageState('register');
        return;
      }

      if (result.success) {
        setPageState('success');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : 'Error al aceptar la invitación';
      setErrorMessage(message);
      setPageState('error');
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!invitationInfo) return;

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!trimmedFirstName || trimmedFirstName.length < 2) {
      setFormError('El nombre debe tener al menos 2 caracteres');
      return;
    }

    if (!trimmedLastName || trimmedLastName.length < 2) {
      setFormError('El apellido debe tener al menos 2 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 8) {
      setFormError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(password)) {
      setFormError(
        'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.register({
        email: invitationInfo.userEmail,
        password,
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
      });

      if (token) {
        await participantsService.acceptInvitation(token);
      }

      setPageState('success');
      setTimeout(() => {
        navigate('/verify-email');
      }, 2000);
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : 'Error al crear la cuenta';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pageState === 'loading') {
    return (
      <div
        className={cn(
          'flex min-h-svh flex-col items-center justify-center bg-muted/50 p-4',
        )}
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Cargando invitación...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pageState === 'error') {
    return (
      <div
        className={cn(
          'flex min-h-svh flex-col items-center justify-center bg-muted/50 p-4',
        )}
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Invitación no válida</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <div className="text-4xl mb-4">❌</div>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
            </div>
            <Button onClick={() => navigate('/login')} className="w-full">
              Ir al inicio de sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pageState === 'success') {
    return (
      <div
        className={cn(
          'flex min-h-svh flex-col items-center justify-center bg-muted/50 p-4',
        )}
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">¡Te has unido al viaje!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="text-4xl mb-4">🎉</div>
              <p className="text-lg font-semibold text-green-600">
                ¡Bienvenido al viaje!
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Redirigiendo...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pageState === 'accepting') {
    return (
      <div
        className={cn(
          'flex min-h-svh flex-col items-center justify-center bg-muted/50 p-4',
        )}
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Uniéndote al viaje...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-sm text-muted-foreground">
                Por favor espera...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pageState === 'register' && invitationInfo) {
    return (
      <div
        className={cn(
          'flex min-h-svh flex-col items-center justify-center bg-muted/50 p-4',
        )}
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Crea tu cuenta</CardTitle>
            <CardDescription>
              Para unirte al viaje "{invitationInfo.trip.name}", necesitas crear
              una cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister}>
              <div className="flex flex-col gap-4">
                {formError && (
                  <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                    {formError}
                  </div>
                )}

                <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-3 text-sm">
                  <p className="font-semibold mb-1">
                    📧 Email de la invitación
                  </p>
                  <p className="text-muted-foreground">
                    {invitationInfo.userEmail}
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="firstName">Nombre(s)</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Tu nombre"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="lastName">Apellido(s)</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Tu apellido"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Mínimo 8 caracteres, una mayúscula, una minúscula y un
                    número.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta y unirme'}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  ¿Ya tienes cuenta?{' '}
                  <Link
                    to={`/login?redirect=/trips/invitation/${token}`}
                    className="text-primary hover:underline"
                  >
                    Inicia sesión
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pageState === 'info' && invitationInfo) {
    const isCorrectUser =
      isAuthenticated &&
      user?.email.toLowerCase() === invitationInfo.userEmail.toLowerCase();
    const isWrongUser =
      isAuthenticated &&
      user?.email.toLowerCase() !== invitationInfo.userEmail.toLowerCase();

    return (
      <div
        className={cn(
          'flex min-h-svh flex-col items-center justify-center bg-muted/50 p-4',
        )}
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="text-center mb-2">
              <span className="text-4xl">✈️</span>
            </div>
            <CardTitle className="text-2xl text-center">
              Te han invitado a un viaje
            </CardTitle>
            <CardDescription className="text-center">
              <strong>
                {invitationInfo.inviter.firstName}{' '}
                {invitationInfo.inviter.lastName}
              </strong>{' '}
              te ha invitado a unirte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-linear-to-r from-purple-500 to-indigo-600 text-white p-6 rounded-lg text-center">
              <h3 className="text-xl font-bold">{invitationInfo.trip.name}</h3>
              {invitationInfo.trip.description && (
                <p className="text-sm opacity-90 mt-1">
                  {invitationInfo.trip.description}
                </p>
              )}
            </div>

            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="text-muted-foreground">
                Invitación enviada a:{' '}
                <strong>{invitationInfo.userEmail}</strong>
              </p>
            </div>

            {isWrongUser && (
              <div className="rounded-md bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-3 text-sm">
                <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                  ⚠️ Estás conectado con otro email
                </p>
                <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                  Estás conectado como <strong>{user?.email}</strong>. Para
                  aceptar esta invitación, cierra sesión y usa el email
                  correcto.
                </p>
              </div>
            )}

            {isCorrectUser ? (
              <Button onClick={handleAcceptInvitation} className="w-full">
                Aceptar invitación
              </Button>
            ) : isWrongUser ? (
              <div className="space-y-2">
                <Button
                  onClick={() => {
                    authService.logout();
                    window.location.reload();
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Cerrar sesión y usar otro email
                </Button>
              </div>
            ) : invitationInfo.userExists ? (
              <div className="space-y-2">
                <p className="text-sm text-center text-muted-foreground">
                  Ya tienes una cuenta. Inicia sesión para aceptar la
                  invitación.
                </p>
                <Button
                  onClick={() =>
                    navigate(`/login?redirect=/trips/invitation/${token}`)
                  }
                  className="w-full"
                >
                  Iniciar sesión
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-center text-muted-foreground">
                  Necesitas crear una cuenta para unirte al viaje.
                </p>
                <Button
                  onClick={() => setPageState('register')}
                  className="w-full"
                >
                  Crear cuenta y unirme
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  ¿Ya tienes cuenta?{' '}
                  <Link
                    to={`/login?redirect=/trips/invitation/${token}`}
                    className="text-primary hover:underline"
                  >
                    Inicia sesión
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
