import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { authService } from '@/services/authService';
import axios from 'axios';

export function SignupForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedUsername = username.trim();

    if (!trimmedFirstName) {
      setError('Por favor, ingresa tu nombre');
      return;
    }

    if (trimmedFirstName.length < 2) {
      setError('El nombre debe tener al menos 2 caracteres');
      return;
    }

    if (trimmedFirstName.length > 50) {
      setError('El nombre no puede tener más de 50 caracteres');
      return;
    }

    if (!trimmedLastName) {
      setError('Por favor, ingresa tu apellido');
      return;
    }

    if (trimmedLastName.length < 2) {
      setError('El apellido debe tener al menos 2 caracteres');
      return;
    }

    if (trimmedLastName.length > 50) {
      setError('El apellido no puede tener más de 50 caracteres');
      return;
    }

    if (!trimmedUsername) {
      setError('Por favor, ingresa un nombre de usuario');
      return;
    }

    if (trimmedUsername.length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres');
      return;
    }

    if (trimmedUsername.length > 30) {
      setError('El nombre de usuario no puede tener más de 30 caracteres');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(trimmedUsername)) {
      setError(
        'El nombre de usuario solo puede contener letras, números y guiones bajos',
      );
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (password.length > 100) {
      setError('La contraseña no puede tener más de 100 caracteres');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(password)) {
      setError(
        'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
      );
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.register({
        email,
        username: trimmedUsername,
        password,
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
      });
      navigate('/verify-email', {
        state: { registrationEmail: result.email },
      });
    } catch (err: unknown) {
      const errorMessage =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : 'Error al crear la cuenta. Por favor, intenta de nuevo.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="p-4 sm:p-5">
          <CardTitle>
            <h1 className="text-2xl">Crear una cuenta</h1>
          </CardTitle>
          <CardDescription>Completá tus datos para empezar.</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-3">
              {error && (
                <div
                  role="alert"
                  className="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
                >
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
                <div className="grid min-w-0 gap-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    autoComplete="given-name"
                    className="h-11"
                    type="text"
                    placeholder="Nombre"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="grid min-w-0 gap-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    autoComplete="family-name"
                    className="h-11"
                    type="text"
                    placeholder="Apellido"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="username">Nombre de usuario</Label>
                <Input
                  id="username"
                  name="username"
                  autoComplete="username"
                  className="h-11"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-describedby="username-hint"
                  type="text"
                  placeholder="nombre_usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <p id="username-hint" className="text-sm text-muted-foreground">
                  3–30 caracteres: letras, números o guion bajo.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  autoComplete="email"
                  className="h-11"
                  autoCapitalize="none"
                  spellCheck={false}
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  aria-describedby="password-hint"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <p id="password-hint" className="text-sm text-muted-foreground">
                  Mínimo 8 caracteres, con mayúscula, minúscula y número.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                <PasswordInput
                  id="confirm-password"
                  name="confirm-password"
                  autoComplete="new-password"
                  visibilityLabel="confirmación de contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                className="h-11 w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              ¿Ya tenés una cuenta?{' '}
              <Link
                to="/login"
                className="underline underline-offset-4 hover:text-primary"
              >
                Iniciá sesión
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
