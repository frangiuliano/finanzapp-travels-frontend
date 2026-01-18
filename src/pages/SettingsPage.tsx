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
import {
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  UserCircleIcon,
} from 'lucide-react';
import { botService } from '@/services/botService';
import { tripsService } from '@/services/tripsService';
import {
  useTripsStore,
  getLastInteractedTripIdFromStorage,
} from '@/store/tripsStore';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

export default function SettingsPage() {
  const { user } = useAuth();
  const setAuth = useAuthStore((state) => state.setAuth);
  const accessToken = useAuthStore((state) => state.accessToken);
  const trips = useTripsStore((state) => state.trips);
  const currentTrip = useTripsStore((state) => state.currentTrip);
  const setTrips = useTripsStore((state) => state.setTrips);
  const setCurrentTrip = useTripsStore((state) => state.setCurrentTrip);
  const [token, setToken] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
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

  useEffect(() => {
    if (trips.length === 0) {
      const fetchTrips = async () => {
        try {
          const { trips: fetchedTrips } = await tripsService.getAllTrips();
          setTrips(fetchedTrips);

          if (fetchedTrips.length > 0) {
            if (!currentTrip) {
              const lastInteractedTripId = getLastInteractedTripIdFromStorage();
              const lastTrip = lastInteractedTripId
                ? fetchedTrips.find((t) => t._id === lastInteractedTripId)
                : null;

              const tripToSelect = lastTrip || fetchedTrips[0];
              setCurrentTrip(tripToSelect);
            } else if (currentTrip) {
              const currentTripExists = fetchedTrips.some(
                (trip) => trip._id === currentTrip._id,
              );
              if (!currentTripExists) {
                const lastInteractedTripId =
                  getLastInteractedTripIdFromStorage();
                const lastTrip = lastInteractedTripId
                  ? fetchedTrips.find((t) => t._id === lastInteractedTripId)
                  : null;

                const tripToSelect = lastTrip || fetchedTrips[0];
                setCurrentTrip(tripToSelect);
              }
            }
          }
        } catch (error) {
          console.error('Error al cargar viajes:', error);
        }
      };

      fetchTrips();
    }
  }, [trips.length, currentTrip, setTrips, setCurrentTrip]);

  const handleGenerateToken = async () => {
    setIsGenerating(true);
    try {
      const response = await botService.generateLinkToken();
      setToken(response.token);
      toast.success('Token generado exitosamente');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message || 'Error al generar el token',
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToken = async () => {
    if (!token) return;

    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      toast.success('Token copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Error al copiar el token');
    }
  };

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
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cuenta</h1>
            <p className="text-muted-foreground">
              Gestiona tu información personal, datos de cuenta e integraciones.
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

          <Separator />

          {/* Sección Bot de Telegram */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <CardTitle>Bot de Telegram</CardTitle>
              </div>
              <CardDescription>
                Vincula tu cuenta con el bot de Telegram para cargar gastos
                rápidamente desde tu móvil.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Token de vinculación</Label>
                <div className="flex gap-2">
                  <Input
                    value={token || ''}
                    placeholder="Genera un token para vincular tu cuenta"
                    readOnly
                    className="font-mono text-sm"
                  />
                  {token && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyToken}
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleGenerateToken}
                  disabled={isGenerating}
                  className="w-full sm:w-auto"
                >
                  {isGenerating ? 'Generando...' : 'Generar nuevo token'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    window.open('https://t.me/finanzapp_travels_bot', '_blank')
                  }
                  className="w-full sm:w-auto"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir bot en Telegram
                </Button>
              </div>

              {token && (
                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <p className="text-sm font-medium">Instrucciones:</p>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Abre Telegram y busca el bot de FinanzApp Travels</li>
                    <li>
                      Envía el comando:{' '}
                      <code className="bg-background px-1 py-0.5 rounded font-mono">
                        /start {token}
                      </code>
                    </li>
                    <li>El bot confirmará la vinculación</li>
                    <li>¡Listo! Ya puedes cargar gastos enviando mensajes</li>
                  </ol>
                  <p className="text-xs text-muted-foreground mt-2">
                    ⚠️ El token expira en 1 hora. Si expira, genera uno nuevo.
                  </p>
                </div>
              )}

              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm font-medium">Modo de uso:</p>
                <p className="text-sm font-medium">
                  Se debe enviar qué, cuánto y dónde se realizó el gasto.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• "Cena 120 usd Mc Donalds"</li>
                  <li>• "Ropa 30 usd Nike"</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
