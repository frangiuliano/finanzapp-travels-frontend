import { NavLink } from 'react-router-dom';
import { BarChart3, Home, Plane, PlusCircle, UserRound } from 'lucide-react';
import { glassPill } from '@/lib/glass';
import { cn } from '@/lib/utils';

const items = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/reports', label: 'Reportes', icon: BarChart3 },
  { to: '/capture', label: 'Captura', icon: PlusCircle, emphasis: true },
  { to: '/travel', label: 'Viajes', icon: Plane },
  { to: '/account', label: 'Cuenta', icon: UserRound },
] as const;

interface BottomNavProps {
  minimized?: boolean;
}

export function BottomNav({ minimized = false }: BottomNavProps) {
  return (
    <nav
      aria-label="Navegación principal"
      className="pointer-events-none fixed inset-x-3 z-40 transition-[bottom] duration-300 ease-out md:hidden"
      style={{ bottom: 'var(--mobile-nav-bottom)' }}
    >
      <div
        className={cn(
          glassPill,
          'pointer-events-auto mx-auto flex max-w-lg items-center transition-all duration-300 ease-out',
          minimized ? 'h-11 px-1' : 'h-14 px-1.5',
        )}
      >
        <ul className="flex w-full items-center justify-between">
          {items.map((item) => {
            const Icon = item.icon;
            const emphasis = 'emphasis' in item && item.emphasis;

            return (
              <li key={item.to} className="flex flex-1">
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full py-1 text-[10px] font-medium transition-all duration-300',
                      isActive
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && !emphasis && (
                        <span
                          aria-hidden
                          className="glass-nav-active absolute inset-x-0.5 inset-y-0 rounded-full"
                        />
                      )}
                      <span
                        className={cn(
                          'relative z-10 flex items-center justify-center rounded-full transition-all duration-300',
                          emphasis &&
                            'bg-[var(--signal)] text-white shadow-[0_6px_18px_color-mix(in_oklab,var(--signal)_32%,transparent)]',
                          emphasis && (minimized ? 'size-8' : 'size-10'),
                          emphasis && isActive && 'ring-2 ring-white/35',
                          !emphasis && (minimized ? 'size-7' : 'size-8'),
                        )}
                      >
                        <Icon
                          className={cn(
                            emphasis
                              ? minimized
                                ? 'size-4'
                                : 'size-5'
                              : 'size-[1.15rem]',
                          )}
                          strokeWidth={isActive ? 2.4 : 2}
                        />
                      </span>
                      <span
                        className={cn(
                          'relative z-10 leading-none transition-all duration-300',
                          minimized
                            ? 'max-h-0 overflow-hidden opacity-0'
                            : 'max-h-4 opacity-100',
                        )}
                      >
                        {item.label}
                      </span>
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
