import type { ReactNode } from 'react';
import {
  ArrowDownLeft,
  ChartNoAxesColumnIncreasing,
  Plane,
} from 'lucide-react';

/** Shared entry screen: short on mobile, more context on desktop. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-svh flex-col bg-background lg:grid lg:grid-cols-2">
      <aside className="hidden flex-col justify-center bg-ink px-12 py-8 text-white lg:flex xl:px-20">
        <div className="mx-auto w-full max-w-md">
          <p className="mb-6 text-sm font-medium text-white/75">
            TU DÍA A DÍA, MÁS CLARO
          </p>
          <h2 className="text-3xl leading-tight xl:text-4xl">
            Tus cuentas claras.
            <br />
            Tus planes, más cerca.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-white/80">
            Organizá lo cotidiano y los gastos de tus viajes en un mismo lugar.
          </p>
          <ul className="mt-8 space-y-4 border-t border-white/20 pt-6">
            {[
              {
                icon: ArrowDownLeft,
                title: 'Registrá tus movimientos',
                text: 'Ingresos y gastos, sin perder el hilo.',
              },
              {
                icon: ChartNoAxesColumnIncreasing,
                title: 'Entendé tu mes',
                text: 'Consultá en qué gastás y cuánto te queda.',
              },
              {
                icon: Plane,
                title: 'Compartí tus viajes',
                text: 'Organizá los gastos con quienes viajás.',
              },
            ].map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-4">
                <Icon
                  aria-hidden="true"
                  className="mt-1 size-5 shrink-0 text-white/80"
                />
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="mt-1 text-sm text-white/75">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <section
        aria-label="Acceso a FinanzApp"
        className="flex flex-1 flex-col justify-center px-4 [padding-top:max(1rem,env(safe-area-inset-top))] [padding-bottom:max(1rem,env(safe-area-inset-bottom))] sm:px-8"
      >
        <div className="mx-auto w-full max-w-md">
          <div className="mb-4 text-center">
            <p className="font-display text-2xl font-bold tracking-tight text-primary">
              FinanzApp
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tu día a día y tus viajes, en orden.
            </p>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
