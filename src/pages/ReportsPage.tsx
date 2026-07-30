import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <BarChart3 className="size-7" />
      </div>
      <h2 className="font-display text-2xl font-bold">Reportes</h2>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Vista base para mes calendario, categorías y ciclos de tarjeta. Los
        datos reales se cablean cuando el backend de reportes esté listo.
      </p>
      <Button asChild variant="outline" className="rounded-xl">
        <Link to="/home">Volver al home</Link>
      </Button>
    </div>
  );
}
