import { useState, useEffect } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
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
import { Separator } from '@/components/ui/separator';
import { UserCircleIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

export default function AccountPage() {
  const { user } = useAuth();
  const setAuth = useAuthStore((state) => state.setAuth);
  const accessToken = useAuthStore((state) => state.accessToken);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setUsername(user.username || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (trimmedUsername && trimmedUsername.length < 3) {
      toast.error('El nombre de usuario debe tener al menos 3 caracteres');
      setIsSaving(false);
      return;
    }

    if (trimmedUsername && trimmedUsername.length > 30) {
      toast.error('El nombre de usuario no puede tener más de 30 caracteres');
      setIsSaving(false);
      return;
    }

    if (trimmedUsername && !/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      toast.error(
        'El nombre de usuario solo puede contener letras, números y guiones bajos',
      );
      setIsSaving(false);
      return;
    }

    try {
      const updatedUser = await authService.updateProfile({
        firstName,
        lastName,
        email: trimmedEmail !== user?.email ? trimmedEmail : undefined,
        username:
          trimmedUsername !== user?.username ? trimmedUsername : undefined,
      });

      if (accessToken) {
        setAuth(updatedUser, accessToken);
      }

      toast.success('Perfil actualizado exitosamente');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message || 'Error al actualizar el perfil',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mi Cuenta</h1>
            <p className="text-muted-foreground">
              Gestiona tu información personal y datos de cuenta.
            </p>
          </div>

          <Separator />

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserCircleIcon className="h-5 w-5" />
                <CardTitle>Información Personal</CardTitle>
              </div>
              <CardDescription>
                Actualiza tu información personal. Puedes modificar tu nombre,
                apellido, email y nombre de usuario.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ingresa tu nombre"
                    required
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ingresa tu apellido"
                    required
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Nombre de Usuario</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="nombre_usuario"
                    required
                    disabled={isSaving}
                  />
                  <p className="text-xs text-muted-foreground">
                    De 3 a 30 caracteres. Solo letras, números y guiones bajos.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    required
                    disabled={isSaving}
                  />
                  <p className="text-xs text-muted-foreground">
                    Puedes modificar tu email cuando lo necesites.
                  </p>
                </div>

                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
