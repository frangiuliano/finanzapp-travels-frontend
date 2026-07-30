import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Home,
  LayoutGrid,
  PlusCircle,
  UserRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/reports', label: 'Reportes', icon: BarChart3 },
  { to: '/capture', label: 'Captura', icon: PlusCircle, emphasis: true },
  { to: '/boards', label: 'Tableros', icon: LayoutGrid },
  { to: '/account', label: 'Cuenta', icon: UserRound },
] as const;

export function BottomNav() {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-card/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex h-16 max-w-lg items-stretch justify-between px-1">
        {items.map((item) => {
          const Icon = item.icon;
          const emphasis = 'emphasis' in item && item.emphasis;

          return (
            <li key={item.to} className="flex flex-1">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                    emphasis && '-mt-3',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'flex items-center justify-center rounded-2xl transition-transform',
                        emphasis &&
                          'size-12 bg-[var(--signal)] text-white shadow-lg shadow-[0_10px_24px_color-mix(in_oklab,var(--signal)_35%,transparent)]',
                        emphasis && isActive && 'scale-105',
                        !emphasis && 'size-8',
                        !emphasis && isActive && 'bg-primary/10',
                      )}
                    >
                      <Icon
                        className={cn(emphasis ? 'size-6' : 'size-5')}
                        strokeWidth={isActive ? 2.4 : 2}
                      />
                    </span>
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
