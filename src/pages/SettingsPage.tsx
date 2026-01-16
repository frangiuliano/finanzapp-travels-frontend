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
import { MessageSquare, Copy, Check, ExternalLink } from 'lucide-react';
import { botService } from '@/services/botService';
import { tripsService } from '@/services/tripsService';
import { useTripsStore } from '@/store/tripsStore';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

export default function SettingsPage() {
  const trips = useTripsStore((state) => state.trips);
  const currentTrip = useTripsStore((state) => state.currentTrip);
  const setTrips = useTripsStore((state) => state.setTrips);
  const setCurrentTrip = useTripsStore((state) => state.setCurrentTrip);
  const [token, setToken] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (trips.length === 0) {
      const fetchTrips = async () => {
        try {
          const { trips: fetchedTrips } = await tripsService.getAllTrips();
          setTrips(fetchedTrips);

          if (!currentTrip && fetchedTrips.length > 0) {
            setCurrentTrip(fetchedTrips[0]);
          } else if (currentTrip && fetchedTrips.length > 0) {
            const currentTripExists = fetchedTrips.some(
              (trip) => trip._id === currentTrip._id,
            );
            if (!currentTripExists) {
              setCurrentTrip(fetchedTrips[0]);
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

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
            <p className="text-muted-foreground">
              Gestiona las configuraciones de tu cuenta y las integraciones.
            </p>
          </div>

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

              <div className="flex gap-2">
                <Button onClick={handleGenerateToken} disabled={isGenerating}>
                  {isGenerating ? 'Generando...' : 'Generar nuevo token'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    window.open('https://t.me/finanzapp_travels_bot', '_blank')
                  }
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
