import { Link } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmptyBoardState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
        <LayoutGrid className="size-8" />
      </div>
      <div className="max-w-sm space-y-2">
        <h2 className="font-display text-2xl font-bold tracking-tight">
          Todavía no tenés un tablero
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          El centro de FinanzApp es tu tablero cotidiano o de viaje. Creá el
          primero para empezar a registrar gastos — sin necesidad de armar un
          viaje.
        </p>
      </div>
      <Button asChild size="lg" className="rounded-xl">
        <Link to="/onboarding">Crear primer tablero</Link>
      </Button>
    </div>
  );
}
