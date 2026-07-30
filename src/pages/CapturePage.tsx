import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function CapturePage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--signal)_18%,transparent)] text-[var(--signal)]">
        <PlusCircle className="size-7" />
      </div>
      <h2 className="font-display text-2xl font-bold">Captura rápida</h2>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Acá va a vivir el registro de gastos mobile-first. Esta pantalla es el
        ancla de navegación; la captura completa llega en un issue siguiente.
      </p>
      <Button asChild variant="outline" className="rounded-xl">
        <Link to="/home">Volver al home</Link>
      </Button>
    </div>
  );
}
