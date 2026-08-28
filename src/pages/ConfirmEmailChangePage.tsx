import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/authService';

export default function ConfirmEmailChangePage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const started = useRef(false);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    token ? 'loading' : 'error',
  );
  const [message, setMessage] = useState(
    token
      ? 'Confirmando tu nuevo email…'
      : 'El enlace de confirmación no es válido.',
  );

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!token) return;
    void authService
      .confirmEmailChange(token)
      .then((result) => {
        setStatus('success');
        setMessage(result.message);
      })
      .catch((error: { response?: { data?: { message?: string } } }) => {
        setStatus('error');
        setMessage(
          error.response?.data?.message ??
            'El enlace es inválido, expiró o el email ya está en uso.',
        );
      });
  }, [token]);

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {status === 'loading'
              ? 'Confirmando email'
              : status === 'success'
                ? 'Email actualizado'
                : 'No pudimos actualizar el email'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{message}</p>
          {status !== 'loading' && (
            <Button asChild className="w-full">
              <Link to="/login">Ir al inicio de sesión</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
