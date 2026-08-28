import { useState, useEffect } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  UserCircleIcon,
  Home,
  Plane,
} from 'lucide-react';
import { botService } from '@/services/botService';
import { boardToTrip } from '@/lib/board-trip-sync';
import { syncTelegramActiveBoard } from '@/lib/sync-active-board';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { useBoardsStore } from '@/store/boardsStore';
import { useTripsStore } from '@/store/tripsStore';
import { boardTypeLabel, type Board } from '@/types/board';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

function BoardTypeIcon({ type }: { type: Board['type'] }) {
  if (type === 'everyday') {
    return <Home className="h-4 w-4" />;
  }
  return <Plane className="h-4 w-4" />;
}

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [token, setToken] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isCancellingEmailChange, setIsCancellingEmailChange] = useState(false);
  const [isUpdatingTelegramBoard, setIsUpdatingTelegramBoard] = useState(false);

  const boards = useBoardsStore((state) => state.boards);
  const telegramActiveBoardId = user?.activeBoardId ?? null;
  const telegramActiveBoard =
    boards.find((board) => board._id === telegramActiveBoardId) ?? null;

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setUsername(user.username || '');
    }
  }, [user]);

  const handleGenerateToken = async () => {
    setIsGenerating(true);
    try {
      const response = await botService.generateLinkToken();
      setToken(response.token);
      toast.success('Token generado exitosamente', { duration: 3000 });
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
      toast.success('Token copiado al portapapeles', { duration: 3000 });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Error al copiar el token');
    }
  };

  const handleTelegramBoardChange = async (boardId: string) => {
    const board = boards.find((item) => item._id === boardId);
    if (!board) return;

    setIsUpdatingTelegramBoard(true);
    try {
      await syncTelegramActiveBoard(board._id);
      useBoardsStore.getState().setCurrentBoard(board);
      useTripsStore.getState().setCurrentTrip(boardToTrip(board));
      toast.success(`Tablero activo para Telegram: ${board.name}`, {
        duration: 3000,
      });
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message ||
          'Error al actualizar el tablero activo',
      );
    } finally {
      setIsUpdatingTelegramBoard(false);
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
        setAuth(
          {
            ...updatedUser,
            activeBoardId: user?.activeBoardId ?? null,
          },
          accessToken,
        );
      }
      setEmail(updatedUser.email);
      toast.success(
        updatedUser.pendingEmail
          ? `Perfil actualizado. Confirma el enlace enviado a ${updatedUser.pendingEmail}.`
          : 'Perfil actualizado exitosamente',
      );
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message || 'Error al actualizar el perfil',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEmailChange = async () => {
    if (!user?.pendingEmail || !accessToken) return;
    setIsCancellingEmailChange(true);
    try {
      const result = await authService.cancelEmailChange();
      setAuth({ ...user, pendingEmail: undefined }, accessToken);
      setEmail(user.email);
      toast.success(result.message);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message ||
          'No se pudo cancelar el cambio de email',
      );
    } finally {
      setIsCancellingEmailChange(false);
    }
  };

  return (
    <div className="w-full flex-1 space-y-4 px-4 py-6 lg:px-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Cuenta
        </h1>
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
                El email actual no cambiará hasta que confirmes la nueva
                dirección.
              </p>
              {user?.pendingEmail && (
                <div className="flex flex-col items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Cambio pendiente: {user.pendingEmail}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isCancellingEmailChange || isSaving}
                    onClick={handleCancelEmailChange}
                  >
                    {isCancellingEmailChange
                      ? 'Cancelando…'
                      : 'Cancelar cambio de email'}
                  </Button>
                </div>
              )}
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
            Vincula tu cuenta y elige qué tablero usa el bot para registrar
            gastos desde Telegram.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Tablero activo para Telegram</Label>
            {boards.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Creá un tablero desde la web para usarlo con el bot.
              </p>
            ) : (
              <Select
                value={telegramActiveBoardId ?? undefined}
                onValueChange={handleTelegramBoardChange}
                disabled={isUpdatingTelegramBoard}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná un tablero" />
                </SelectTrigger>
                <SelectContent>
                  {boards.map((board) => (
                    <SelectItem key={board._id} value={board._id}>
                      <span className="flex items-center gap-2">
                        <BoardTypeIcon type={board.type} />
                        <span>{board.name}</span>
                        <span className="text-muted-foreground text-xs">
                          ({boardTypeLabel(board.type)})
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {telegramActiveBoard ? (
              <p className="text-xs text-muted-foreground">
                Los gastos enviados por Telegram se registrarán en{' '}
                <span className="font-medium">{telegramActiveBoard.name}</span>.
                También podés cambiarlo con{' '}
                <code className="bg-muted px-1 py-0.5 rounded font-mono">
                  /board
                </code>{' '}
                en Telegram.
              </p>
            ) : boards.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Sin tablero activo: el bot te pedirá elegir uno con{' '}
                <code className="bg-muted px-1 py-0.5 rounded font-mono">
                  /board
                </code>
                .
              </p>
            ) : null}
          </div>

          <Separator />

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
                <Button variant="outline" size="icon" onClick={handleCopyToken}>
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
                window.open(
                  'https://t.me/finanzapp_travels_bot',
                  '_blank',
                  'noopener,noreferrer',
                )
              }
              className="w-full sm:w-auto"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir bot en Telegram
            </Button>
          </div>

          {token && (
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <p className="text-sm font-medium">
                Instrucciones de vinculación
              </p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>
                  Usá el botón «Abrir bot en Telegram» de arriba para abrir el
                  chat
                </li>
                <li>
                  Envía el comando:{' '}
                  <code className="bg-background px-1 py-0.5 rounded font-mono">
                    /start {token}
                  </code>
                </li>
                <li>El bot confirmará la vinculación</li>
                <li>
                  Elegí el tablero activo con{' '}
                  <code className="bg-background px-1 py-0.5 rounded font-mono">
                    /board
                  </code>{' '}
                  o desde esta página
                </li>
              </ol>
              <p className="text-xs text-muted-foreground mt-2">
                El token expira en 1 hora. Si expira, genera uno nuevo.
              </p>
            </div>
          )}

          <div className="rounded-lg border p-4 space-y-3">
            <p className="text-sm font-medium">Ejemplos de mensajes</p>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Cotidiano (everyday)
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• &quot;Super 15000&quot;</li>
                <li>• &quot;Nafta 8000 debito&quot;</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Viaje (travel)
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• &quot;Cena 120 usd compartido&quot;</li>
                <li>• &quot;Hotel 500 usd visa&quot;</li>
              </ul>
            </div>
            <p className="text-xs text-muted-foreground">
              El bot interpreta descripción, importe y medio de pago en texto
              libre. Usa{' '}
              <code className="bg-muted px-1 py-0.5 rounded font-mono">
                /board
              </code>{' '}
              para ver o cambiar el tablero activo.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
