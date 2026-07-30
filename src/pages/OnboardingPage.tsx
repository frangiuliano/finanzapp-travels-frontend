import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LayoutGrid } from 'lucide-react';

/**
 * Placeholder for the first-board wizard (frontend#2).
 * Keeps empty-state CTAs from forcing the legacy create-trip dialog.
 */
export default function OnboardingPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <LayoutGrid className="size-7" />
      </div>
      <h2 className="font-display text-2xl font-bold">
        Crear tu primer tablero
      </h2>
      <p className="text-sm text-muted-foreground leading-relaxed">
        El wizard de onboarding (tipo cotidiano/viaje, moneda, compartido) llega
        en el próximo issue. Por ahora podés explorar el shell o usar mocks con{' '}
        <code className="rounded bg-muted px-1">VITE_BOARD_MOCKS=true</code>.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button asChild className="rounded-xl">
          <Link to="/boards">Ir a tableros</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/home">Volver al home</Link>
        </Button>
      </div>
    </div>
  );
}
