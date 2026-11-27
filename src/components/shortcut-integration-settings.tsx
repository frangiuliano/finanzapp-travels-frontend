import { useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import {
  Check,
  Copy,
  ExternalLink,
  ListChecks,
  Loader2,
  Plus,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  getShortcutCaptureBaseUrl,
  shortcutIntegrationsService,
  type CreatedShortcutIntegration,
  type ShortcutCaptureMode,
  type ShortcutIntegration,
} from '@/services/shortcutIntegrationsService';

const MODE_COPY: Record<
  ShortcutCaptureMode,
  { label: string; description: string }
> = {
  guided: {
    label: 'Guiado',
    description:
      'Pregunta monto, comercio, categoría y medio de pago en cada carga.',
  },
  adaptive: {
    label: 'Rápido adaptativo',
    description:
      'Interpreta una frase y pregunta únicamente los datos que no reconoce.',
  },
};

function formatDate(value?: string): string {
  if (!value) return 'Todavía sin uso';
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function errorMessage(error: unknown, fallback: string): string {
  return (
    (error as AxiosError<{ message?: string }>).response?.data?.message ||
    fallback
  );
}

export function ShortcutIntegrationSettings() {
  const [integrations, setIntegrations] = useState<ShortcutIntegration[]>([]);
  const [created, setCreated] = useState<CreatedShortcutIntegration | null>(
    null,
  );
  const [name, setName] = useState('Mi iPhone');
  const [mode, setMode] = useState<ShortcutCaptureMode>('guided');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [copied, setCopied] = useState<'token' | 'config' | null>(null);

  const captureBaseUrl = useMemo(() => getShortcutCaptureBaseUrl(), []);
  const shortcutInstallUrl = import.meta.env.VITE_IOS_SHORTCUT_URL;
  const hasOfficialShortcut =
    shortcutInstallUrl?.startsWith('https://www.icloud.com/shortcuts/') ??
    false;

  useEffect(() => {
    let active = true;
    shortcutIntegrationsService
      .list()
      .then((result) => {
        if (active) setIntegrations(result);
      })
      .catch((error) =>
        toast.error(
          errorMessage(error, 'No se pudieron cargar los Atajos conectados'),
        ),
      )
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Ingresá un nombre para identificar el dispositivo');
      return;
    }
    setIsCreating(true);
    try {
      const result = await shortcutIntegrationsService.create({
        name: name.trim(),
        mode,
      });
      setCreated(result);
      setIntegrations((current) => [result, ...current]);
      toast.success('Conexión para Atajos creada');
    } catch (error) {
      toast.error(errorMessage(error, 'No se pudo crear la conexión'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleModeChange = async (
    integration: ShortcutIntegration,
    nextMode: ShortcutCaptureMode,
  ) => {
    setBusyId(integration.id);
    try {
      const updated = await shortcutIntegrationsService.update(integration.id, {
        mode: nextMode,
      });
      setIntegrations((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success(`Modo cambiado a ${MODE_COPY[nextMode].label}`);
    } catch (error) {
      toast.error(errorMessage(error, 'No se pudo cambiar el modo'));
    } finally {
      setBusyId(null);
    }
  };

  const handleRevoke = async (id: string) => {
    setBusyId(id);
    try {
      await shortcutIntegrationsService.revoke(id);
      setIntegrations((current) => current.filter((item) => item.id !== id));
      if (created?.id === id) setCreated(null);
      setConfirmRevokeId(null);
      toast.success('Acceso del Atajo revocado');
    } catch (error) {
      toast.error(errorMessage(error, 'No se pudo revocar el acceso'));
    } finally {
      setBusyId(null);
    }
  };

  const copy = async (kind: 'token' | 'config') => {
    if (!created) return;
    const value =
      kind === 'token'
        ? created.token
        : JSON.stringify(
            {
              token: created.token,
              contextUrl: `${captureBaseUrl}/context`,
              resolveUrl: `${captureBaseUrl}/resolve`,
              expenseUrl: `${captureBaseUrl}/expenses`,
              tokenHeader: 'X-FinanzApp-Shortcut-Token',
            },
            null,
            2,
          );
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
      toast.success(
        kind === 'token' ? 'Token copiado' : 'Configuración copiada',
      );
    } catch {
      toast.error('No se pudo copiar al portapapeles');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Smartphone className="size-5" />
          <CardTitle>Atajos para iPhone</CardTitle>
        </div>
        <CardDescription>
          Registrá gastos con Siri, el botón de acción o tocando la parte
          trasera del iPhone, sin abrir FinanzApp.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            Object.entries(MODE_COPY) as Array<
              [ShortcutCaptureMode, (typeof MODE_COPY)[ShortcutCaptureMode]]
            >
          ).map(([value, copy]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              aria-pressed={mode === value}
              className={`rounded-2xl border p-4 text-left transition-colors ${
                mode === value
                  ? 'border-[var(--signal)] bg-[color-mix(in_oklab,var(--signal)_10%,transparent)]'
                  : 'hover:border-foreground/20'
              }`}
            >
              <span className="mb-2 flex items-center gap-2 font-medium">
                {value === 'guided' ? (
                  <ListChecks className="size-4" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                {copy.label}
              </span>
              <span className="block text-xs leading-relaxed text-muted-foreground">
                {copy.description}
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="shortcut-device-name">Nombre del dispositivo</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="shortcut-device-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
              disabled={isCreating}
            />
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              ) : (
                <Plus className="mr-1.5 size-4" />
              )}
              Conectar iPhone
            </Button>
          </div>
        </div>

        {created ? (
          <div className="space-y-3 rounded-2xl border border-[var(--signal)]/30 bg-[color-mix(in_oklab,var(--signal)_8%,transparent)] p-4">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[var(--signal)]" />
              <div>
                <p className="font-medium">Guardá este token ahora</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Se muestra una sola vez. Solo permite consultar opciones y
                  registrar gastos; podés revocarlo cuando quieras.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                value={created.token}
                readOnly
                aria-label="Token para el Atajo"
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="icon"
                aria-label="Copiar token"
                onClick={() => void copy('token')}
              >
                {copied === 'token' ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
            <Button variant="outline" onClick={() => void copy('config')}>
              {copied === 'config' ? (
                <Check className="mr-1.5 size-4" />
              ) : (
                <Copy className="mr-1.5 size-4" />
              )}
              Copiar configuración completa
            </Button>
          </div>
        ) : null}

        <Separator />

        <div className="space-y-3">
          <div>
            <h3 className="font-medium">iPhones conectados</h3>
            <p className="text-xs text-muted-foreground">
              El modo se consulta al ejecutar el Atajo; cambiarlo acá no
              requiere reinstalarlo.
            </p>
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Cargando…
            </div>
          ) : integrations.length === 0 ? (
            <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              Todavía no conectaste ningún iPhone.
            </p>
          ) : (
            integrations.map((integration) => (
              <div
                key={integration.id}
                className="space-y-3 rounded-2xl border p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{integration.name}</p>
                      <Badge
                        variant="secondary"
                        className="font-mono text-[10px]"
                      >
                        {integration.tokenPrefix}…
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Último uso: {formatDate(integration.lastUsedAt)}
                    </p>
                  </div>
                  <Select
                    value={integration.mode}
                    onValueChange={(value) =>
                      void handleModeChange(
                        integration,
                        value as ShortcutCaptureMode,
                      )
                    }
                    disabled={busyId === integration.id}
                  >
                    <SelectTrigger className="w-full sm:w-[190px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="guided">Guiado</SelectItem>
                      <SelectItem value="adaptive">
                        Rápido adaptativo
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {confirmRevokeId === integration.id ? (
                  <div className="flex flex-wrap items-center gap-2 rounded-xl bg-destructive/10 p-3">
                    <p className="mr-auto text-xs">
                      El Atajo dejará de registrar gastos inmediatamente.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmRevokeId(null)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={busyId === integration.id}
                      onClick={() => void handleRevoke(integration.id)}
                    >
                      Confirmar revocación
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setConfirmRevokeId(integration.id)}
                  >
                    <Trash2 className="mr-1.5 size-4" /> Revocar acceso
                  </Button>
                )}
              </div>
            ))
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Cómo configurarlo</h3>
            <p className="text-sm text-muted-foreground">
              El mismo Atajo sirve para ambos modos y carga siempre las
              categorías y medios de pago actuales de FinanzApp.
            </p>
          </div>
          {hasOfficialShortcut ? (
            <Button asChild className="w-full sm:w-auto">
              <a href={shortcutInstallUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-1.5 size-4" /> Instalar Atajo
                oficial
              </a>
            </Button>
          ) : (
            <p className="rounded-xl border border-dashed p-3 text-xs leading-relaxed text-muted-foreground">
              En desarrollo local, armá el Atajo con la configuración copiada.
              En producción aparecerá acá el botón de instalación cuando se
              configure su enlace de iCloud.
            </p>
          )}
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <Badge className="mt-0.5 size-6 shrink-0 justify-center rounded-full p-0">
                1
              </Badge>
              <span>
                Creá la conexión arriba y copiá la configuración completa.
              </span>
            </li>
            <li className="flex gap-3">
              <Badge className="mt-0.5 size-6 shrink-0 justify-center rounded-full p-0">
                2
              </Badge>
              <span>
                En Atajos, configurá las llamadas a <code>/context</code>,{' '}
                <code>/resolve</code> y <code>/expenses</code> con el encabezado{' '}
                <code>X-FinanzApp-Shortcut-Token</code>.
              </span>
            </li>
            <li className="flex gap-3">
              <Badge className="mt-0.5 size-6 shrink-0 justify-center rounded-full p-0">
                3
              </Badge>
              <span>
                Ejecutalo una vez y aceptá el permiso para conectarse con
                FinanzApp.
              </span>
            </li>
            <li className="flex gap-3">
              <Badge className="mt-0.5 size-6 shrink-0 justify-center rounded-full p-0">
                4
              </Badge>
              <span>
                Asignalo desde Configuración → Accesibilidad → Tocar → Tocar
                atrás, o desde Configuración → Botón de acción.
              </span>
            </li>
          </ol>
          <a
            href="https://support.apple.com/guide/shortcuts/run-shortcuts-by-tapping-the-back-of-your-iphone-apd897693606/ios"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center text-sm font-medium text-[var(--signal)] hover:underline"
          >
            Ver la guía de Apple <ExternalLink className="ml-1 size-3.5" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
