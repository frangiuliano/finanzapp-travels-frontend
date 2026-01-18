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
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updatedUser = await authService.updateProfile({
        firstName,
        lastName,
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
                Actualiza tu nombre y apellido. El email no se puede modificar.
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
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">
                    El email no se puede modificar
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
