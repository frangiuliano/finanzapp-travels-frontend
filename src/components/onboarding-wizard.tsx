import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Home,
  Mail,
  Plane,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { glassBar } from '@/lib/glass';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CURRENCY_OPTIONS,
  DEFAULT_CURRENCY,
  SUPPORTED_CURRENCIES,
  SupportedCurrency,
} from '@/constants/currencies';
import { addBoardToStores, selectActiveBoard } from '@/lib/board-trip-sync';
import { boardsService } from '@/services/boardsService';
import { participantsService } from '@/services/participantsService';
import { BoardType } from '@/types/board';
import { CategoryPicker } from '@/components/category-picker';
import { MIN_BOARD_CATEGORIES } from '@/constants/default-categories';

type WizardStep = 'type' | 'name' | 'currency' | 'categories' | 'invite';

const STEPS: WizardStep[] = [
  'type',
  'name',
  'currency',
  'categories',
  'invite',
];

const STEP_LABELS: Record<WizardStep, string> = {
  type: 'Tipo',
  name: 'Nombre',
  currency: 'Moneda',
  categories: 'Categorías',
  invite: 'Invitar',
};

function defaultNameForType(type: BoardType): string {
  return type === 'everyday' ? 'Casa' : 'Mi viaje';
}

function validateInviteEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return 'Ingresá un email válido o usá Omitir';
  }
  return null;
}

interface TypeOptionProps {
  type: BoardType;
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
  icon: ReactNode;
}

function TypeOption({
  type,
  selected,
  onSelect,
  title,
  description,
  icon,
}: TypeOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-colors',
        selected
          ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
          : 'border-border/80 bg-card/60 hover:border-primary/40',
      )}
      aria-pressed={selected}
      data-board-type={type}
    >
      <div
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-xl',
          selected ? 'bg-primary text-primary-foreground' : 'bg-muted',
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 space-y-1">
        <p className="font-display text-base font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </button>
  );
}

export function OnboardingWizard() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [boardType, setBoardType] = useState<BoardType>('everyday');
  const [name, setName] = useState('');
  const [baseCurrency, setBaseCurrency] =
    useState<SupportedCurrency>(DEFAULT_CURRENCY);
  const [inviteEmail, setInviteEmail] = useState('');
  const [categoryNames, setCategoryNames] = useState<string[]>([
    'Comida',
    'Transporte',
    'Hogar',
  ]);
  const [nameError, setNameError] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const step = STEPS[stepIndex];
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const displayName = useMemo(() => {
    const trimmed = name.trim();
    return trimmed || defaultNameForType(boardType);
  }, [name, boardType]);

  const goBack = () => {
    if (stepIndex === 0) return;
    setStepIndex((current) => current - 1);
  };

  const goNext = () => {
    if (step === 'name') {
      const trimmed = name.trim();
      if (trimmed.length > 0 && trimmed.length < 2) {
        setNameError('El nombre debe tener al menos 2 caracteres');
        return;
      }
      if (trimmed.length > 100) {
        setNameError('El nombre no puede tener más de 100 caracteres');
        return;
      }
      setNameError(null);
    }

    if (step === 'categories' && categoryNames.length < MIN_BOARD_CATEGORIES) {
      toast.error(`Seleccioná al menos ${MIN_BOARD_CATEGORIES} categorías`);
      return;
    }

    if (stepIndex < STEPS.length - 1) {
      setStepIndex((current) => current + 1);
    }
  };

  const finishWizard = async (sendInvite: boolean) => {
    setInviteError(null);

    if (sendInvite) {
      const emailValidationError = validateInviteEmail(inviteEmail);
      if (emailValidationError) {
        setInviteError(emailValidationError);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const { board } = await boardsService.createBoard({
        name: displayName,
        baseCurrency,
        type: boardType,
        categoryNames,
      });

      addBoardToStores(board);
      selectActiveBoard(board);

      if (sendInvite) {
        const email = inviteEmail.trim().toLowerCase();
        try {
          await participantsService.inviteParticipant(board._id, email);
          toast.success(`Invitación enviada a ${email}`);
        } catch (error) {
          const axiosError = error as AxiosError<{ message?: string }>;
          const message =
            axiosError.response?.data?.message ||
            'No se pudo enviar la invitación';
          toast.error(message);
        }
      }

      toast.success('¡Tablero listo!');
      navigate('/home', { replace: true });
    } catch (error) {
      const axiosError = error as AxiosError<{
        message?: string;
        errors?: { name?: string };
      }>;
      const message =
        axiosError.response?.data?.message || 'Error al crear el tablero';
      toast.error(message);
      if (axiosError.response?.data?.errors?.name) {
        setNameError(axiosError.response.data.errors.name);
        setStepIndex(STEPS.indexOf('name'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Paso {stepIndex + 1} de {STEPS.length}
          </span>
          <span>{STEP_LABELS[step]}</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      <div className="space-y-2 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="size-3.5" />
          Primer tablero
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {step === 'type' && '¿Qué vas a organizar?'}
          {step === 'name' && '¿Cómo lo llamamos?'}
          {step === 'currency' && 'Moneda del tablero'}
          {step === 'categories' && '¿Cómo vas a clasificar tus gastos?'}
          {step === 'invite' && '¿Lo compartís con alguien?'}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {step === 'type' &&
            'Elegí cotidiano para gastos del día a día o viaje para un plan con fechas y presupuesto.'}
          {step === 'name' &&
            'Un nombre corto alcanza. Podés cambiarlo después.'}
          {step === 'currency' &&
            'Todos los totales y reportes de este tablero usan esta moneda.'}
          {step === 'categories' &&
            'Elegí solo las que tengan sentido para este tablero. Después podés crear otras.'}
          {step === 'invite' &&
            'Opcional: invitá a tu pareja o roomie por email. También podés hacerlo más tarde.'}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-4">
        {step === 'type' && (
          <div className="grid gap-3">
            <TypeOption
              type="everyday"
              selected={boardType === 'everyday'}
              onSelect={() => {
                setBoardType('everyday');
                setCategoryNames(['Comida', 'Transporte', 'Hogar']);
                if (!name.trim()) setName(defaultNameForType('everyday'));
              }}
              title="Cotidiano"
              description="Gastos de casa, suscripciones y el día a día. Sin obligarte a armar un viaje."
              icon={<Home className="size-5" />}
            />
            <TypeOption
              type="travel"
              selected={boardType === 'travel'}
              onSelect={() => {
                setBoardType('travel');
                setCategoryNames(['Comida', 'Transporte', 'Ocio']);
                if (!name.trim()) setName(defaultNameForType('travel'));
              }}
              title="Viaje"
              description="Un plan con presupuesto y participantes. Ideal para vacaciones o escapadas."
              icon={<Plane className="size-5" />}
            />
          </div>
        )}

        {step === 'name' && (
          <div className="space-y-2">
            <Label htmlFor="board-name">Nombre del tablero</Label>
            <Input
              id="board-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setNameError(null);
              }}
              placeholder={defaultNameForType(boardType)}
              autoFocus
              className="h-12 rounded-xl text-base"
              disabled={isSubmitting}
            />
            {nameError ? (
              <p className="text-sm text-destructive">{nameError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Si lo dejás vacío usamos “{defaultNameForType(boardType)}”.
              </p>
            )}
          </div>
        )}

        {step === 'currency' && (
          <div className="space-y-2">
            <Label htmlFor="board-currency">Moneda base</Label>
            <Select
              value={baseCurrency}
              onValueChange={(value) => {
                if (SUPPORTED_CURRENCIES.includes(value as SupportedCurrency)) {
                  setBaseCurrency(value as SupportedCurrency);
                }
              }}
              disabled={isSubmitting}
            >
              <SelectTrigger id="board-currency" className="h-12 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((currency) => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {step === 'categories' && (
          <CategoryPicker
            value={categoryNames}
            onChange={setCategoryNames}
            disabled={isSubmitting}
          />
        )}

        {step === 'invite' && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email de tu pareja o roomie</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => {
                    setInviteEmail(event.target.value);
                    setInviteError(null);
                  }}
                  placeholder="ejemplo@email.com"
                  className="h-12 rounded-xl pl-10 text-base"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
              {inviteError ? (
                <p className="text-sm text-destructive">{inviteError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Enviaremos un enlace para unirse a “{displayName}”.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto px-3 pb-[calc(var(--mobile-nav-total)+0.5rem)] md:px-0 md:pb-2">
        <div
          className={cn(
            glassBar,
            'pointer-events-auto px-4 py-4 md:rounded-none md:border-t md:border-border/60 md:bg-background/90 md:shadow-none md:backdrop-blur-md',
          )}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={goBack}
              disabled={stepIndex === 0 || isSubmitting}
            >
              <ArrowLeft className="mr-2 size-4" />
              Atrás
            </Button>

            {step !== 'invite' ? (
              <Button
                type="button"
                className="rounded-xl"
                onClick={goNext}
                disabled={isSubmitting}
              >
                Continuar
                <ArrowRight className="ml-2 size-4" />
              </Button>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row">
                {inviteEmail.trim() ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => void finishWizard(false)}
                    disabled={isSubmitting}
                  >
                    Crear sin invitar
                  </Button>
                ) : null}
                <Button
                  type="button"
                  className="rounded-xl"
                  onClick={() => void finishWizard(Boolean(inviteEmail.trim()))}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    'Creando…'
                  ) : inviteEmail.trim() ? (
                    <>
                      Crear e invitar
                      <Check className="ml-2 size-4" />
                    </>
                  ) : (
                    <>
                      Crear tablero
                      <Check className="ml-2 size-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
