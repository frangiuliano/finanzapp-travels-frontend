import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import { ArrowLeft, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
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
import { StatementImportReviewTable } from '@/components/statement-import-review-table';
import type { StatementImportRowState } from '@/components/statement-import-review-table';
import { useAvailablePaymentMethods } from '@/hooks/useAvailablePaymentMethods';
import { useBoardCategories } from '@/hooks/useBoardCategories';
import { useBoardsStore } from '@/store/boardsStore';
import { formatPaymentMethodLabel } from '@/lib/format-payment-method-label';
import { statementImportService } from '@/services/statementImportService';
import type {
  StatementImportLine,
  StatementImportLineOverride,
} from '@/types/statement-import';

const LOW_CONFIDENCE_THRESHOLD = 0.5;

export default function StatementImportPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentMethodId = searchParams.get('paymentMethodId') ?? '';
  const currentBoard = useBoardsStore((state) => state.currentBoard);

  const { paymentMethods } = useAvailablePaymentMethods(currentBoard?._id);
  const { categories } = useBoardCategories(currentBoard?._id);
  const method = paymentMethods.find((m) => m._id === paymentMethodId);

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [importId, setImportId] = useState<string | null>(null);
  const [lines, setLines] = useState<StatementImportLine[]>([]);
  const [lowConfidenceDocument, setLowConfidenceDocument] = useState(false);
  const [rowState, setRowState] = useState<
    Record<string, StatementImportRowState>
  >({});

  const initializeRowState = useCallback(
    (importedLines: StatementImportLine[]) => {
      const next: Record<string, StatementImportRowState> = {};
      for (const line of importedLines) {
        next[line.tempId] = {
          include:
            !line.isPossibleDuplicate &&
            line.confidence >= LOW_CONFIDENCE_THRESHOLD,
          overrides: {},
        };
      }
      setRowState(next);
    },
    [],
  );

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file || !currentBoard || !method) return;

    setIsUploading(true);
    try {
      const result = await statementImportService.upload(
        currentBoard._id,
        method._id,
        file,
      );
      setImportId(result.importId);
      setLines(result.lines);
      setLowConfidenceDocument(result.stats.lowConfidenceDocument);
      initializeRowState(result.lines);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message ||
          'No se pudo procesar el resumen. Verificá que sea un PDF del banco.',
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggle = useCallback((tempId: string) => {
    setRowState((current) => ({
      ...current,
      [tempId]: {
        ...current[tempId],
        include: !current[tempId]?.include,
      },
    }));
  }, []);

  const handleToggleAll = useCallback((tempIds: string[], include: boolean) => {
    setRowState((current) => {
      const next = { ...current };
      for (const tempId of tempIds) {
        next[tempId] = { ...next[tempId], include };
      }
      return next;
    });
  }, []);

  const handleOverrideChange = useCallback(
    (tempId: string, patch: Partial<StatementImportLineOverride>) => {
      setRowState((current) => ({
        ...current,
        [tempId]: {
          ...current[tempId],
          overrides: { ...current[tempId]?.overrides, ...patch },
        },
      }));
    },
    [],
  );

  const selectedCount = useMemo(
    () => Object.values(rowState).filter((row) => row.include).length,
    [rowState],
  );

  const handleConfirm = async () => {
    if (!importId) return;
    setIsConfirming(true);
    try {
      const selections = Object.entries(rowState).map(([tempId, row]) => ({
        tempId,
        include: row.include,
        overrides: row.overrides,
      }));
      const result = await statementImportService.confirm(importId, selections);
      if (result.failed.length > 0) {
        toast.warning(
          `Se cargaron ${result.created} gastos. ${result.failed.length} no se pudieron cargar.`,
        );
      } else {
        toast.success(`Se cargaron ${result.created} gastos`);
      }
      navigate('/expenses');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message ||
          'No se pudo completar la carga masiva',
      );
    } finally {
      setIsConfirming(false);
    }
  };

  if (!paymentMethodId || !currentBoard) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Falta seleccionar una tarjeta.
        </p>
        <Button asChild variant="outline" className="mt-4 rounded-xl">
          <Link to="/boards/settings?tab=payment-methods">
            Volver a medios de pago
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 md:px-6">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2 gap-1"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="size-4" /> Volver
      </Button>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="font-display text-xl">
            Importar resumen de tarjeta
          </CardTitle>
          <CardDescription>
            {method
              ? `Subí el PDF del resumen de ${formatPaymentMethodLabel(method)}. El archivo se procesa y se descarta: solo se guardan los consumos detectados hasta que confirmes la carga.`
              : 'Cargando tarjeta…'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!importId ? (
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="statement-file">Resumen (PDF)</Label>
                <Input
                  id="statement-file"
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  disabled={isUploading}
                  className="rounded-xl"
                />
              </div>
              <Button
                type="submit"
                className="rounded-xl"
                disabled={!file || !method || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-1.5 size-4 animate-spin" />
                    Analizando…
                  </>
                ) : (
                  <>
                    <Upload className="mr-1.5 size-4" />
                    Subir y analizar
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              {lowConfidenceDocument ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
                  No reconocimos bien el formato de este resumen. Revisá con
                  cuidado los montos y descripciones antes de cargar.
                </div>
              ) : null}
              {lines.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No se detectaron consumos en el PDF.
                </p>
              ) : (
                <StatementImportReviewTable
                  lines={lines}
                  rowState={rowState}
                  categories={categories}
                  onToggle={handleToggle}
                  onToggleAll={handleToggleAll}
                  onOverrideChange={handleOverrideChange}
                />
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  className="flex-1 rounded-xl"
                  disabled={selectedCount === 0 || isConfirming}
                  onClick={handleConfirm}
                >
                  {isConfirming
                    ? 'Cargando…'
                    : `Cargar seleccionados (${selectedCount})`}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  disabled={isConfirming}
                  onClick={async () => {
                    await statementImportService.cancel(importId);
                    setImportId(null);
                    setLines([]);
                    setRowState({});
                    setFile(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
