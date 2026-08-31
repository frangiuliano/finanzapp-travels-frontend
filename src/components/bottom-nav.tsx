import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Home,
  Menu,
  Plus,
  Receipt,
  Plane,
  Settings2,
  UserRound,
  PiggyBank,
} from 'lucide-react';
import { glassTabBar } from '@/lib/glass';
import { cn } from '@/lib/utils';
import { openMovementCreator } from '@/lib/movement-events';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

const items = [
  { to: '/home', label: 'Inicio', icon: Home },
  { to: '/expenses', label: 'Movimientos', icon: Receipt },
  { to: '#create', label: 'Registrar', icon: Plus, action: true },
  { to: '/reports', label: 'Reportes', icon: BarChart3 },
  { to: '#more', label: 'Más', icon: Menu, action: true },
] as const;

const INDICATOR_TRANSITION =
  'left 380ms cubic-bezier(0.32, 0.72, 0, 1), width 380ms cubic-bezier(0.32, 0.72, 0, 1)';

interface BottomNavProps {
  minimized?: boolean;
}

function triggerTabHaptic() {
  navigator.vibrate?.(8);
}

export function BottomNav({ minimized = false }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [indicator, setIndicator] = useState({
    left: 0,
    width: 0,
    ready: false,
  });

  const activeIndex = items.findIndex(
    (item) => !('action' in item) && item.to === location.pathname,
  );

  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (activeIndex < 0) {
        setIndicator((current) => ({ ...current, ready: false }));
        return;
      }

      const item = itemRefs.current[activeIndex];
      const list = listRef.current;
      if (!item || !list) {
        return;
      }

      setIndicator({
        left: item.offsetLeft,
        width: item.offsetWidth,
        ready: true,
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [activeIndex, minimized]);

  useEffect(() => {
    const onResize = () => {
      requestAnimationFrame(() => {
        if (activeIndex < 0) {
          setIndicator((current) => ({ ...current, ready: false }));
          return;
        }

        const item = itemRefs.current[activeIndex];
        const list = listRef.current;
        if (!item || !list) {
          return;
        }

        setIndicator({
          left: item.offsetLeft,
          width: item.offsetWidth,
          ready: true,
        });
      });
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [activeIndex, minimized]);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <nav
      aria-label="Navegación principal"
      className="pointer-events-none fixed inset-x-4 z-[var(--z-bottom-nav)] md:hidden"
      style={{
        bottom: 'var(--mobile-nav-bottom)',
        WebkitTransform: 'translateZ(0)',
      }}
    >
      <div
        className={cn(
          glassTabBar,
          'pointer-events-auto mx-auto flex max-w-md items-center transition-[height,padding] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
          minimized ? 'h-11 px-1' : 'h-14 px-1.5',
        )}
      >
        <ul
          ref={listRef}
          className="relative flex w-full items-center justify-between"
        >
          {indicator.ready && (
            <span
              aria-hidden
              className="glass-nav-indicator pointer-events-none absolute inset-y-1 rounded-full"
              style={{
                left: indicator.left,
                width: indicator.width,
                transition: INDICATOR_TRANSITION,
              }}
            />
          )}

          {items.map((item, index) => {
            const Icon = item.icon;

            return (
              <li
                key={item.to}
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                className="flex flex-1"
              >
                {'action' in item ? (
                  <button
                    type="button"
                    onClick={() =>
                      item.to === '#create'
                        ? openMovementCreator()
                        : setMoreOpen(true)
                    }
                    aria-label={
                      item.to === '#create'
                        ? 'Registrar movimiento'
                        : 'Abrir menú Más'
                    }
                    className={cn(
                      'relative z-10 flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-full py-1 text-[11px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                      item.to === '#create'
                        ? 'text-primary'
                        : 'text-muted-foreground',
                    )}
                  >
                    <span
                      className={cn(
                        'flex items-center justify-center rounded-full',
                        item.to === '#create'
                          ? 'size-11 -translate-y-2 bg-primary text-primary-foreground shadow-lg ring-4 ring-background'
                          : minimized
                            ? 'size-7'
                            : 'size-8',
                      )}
                    >
                      <Icon
                        className={
                          item.to === '#create' ? 'size-6' : 'size-[1.15rem]'
                        }
                      />
                    </span>
                    <span
                      className={cn(
                        'leading-none',
                        minimized && 'hidden',
                        item.to === '#create' && '-mt-1',
                      )}
                    >
                      {item.label}
                    </span>
                  </button>
                ) : (
                  <NavLink
                    to={item.to}
                    onClick={triggerTabHaptic}
                    className={({ isActive }) =>
                      cn(
                        'relative z-10 flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-full py-1 text-[11px] font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                        isActive
                          ? 'text-primary'
                          : 'text-muted-foreground hover:text-foreground',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={cn(
                            'flex items-center justify-center rounded-full transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
                            minimized ? 'size-7' : 'size-8',
                            isActive && 'scale-105',
                          )}
                        >
                          <Icon
                            className="size-[1.15rem]"
                            strokeWidth={isActive ? 2.4 : 2}
                          />
                        </span>
                        <span
                          className={cn(
                            'leading-none transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
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
                )}
              </li>
            );
          })}
        </ul>
      </div>
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl px-4">
          <SheetHeader>
            <SheetTitle>Más</SheetTitle>
            <SheetDescription>
              Funciones secundarias de FinanzApp.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-2 pt-4">
            {[
              {
                to: '/wealth',
                icon: PiggyBank,
                title: 'Patrimonio',
                text: 'Ahorros, tenencias y objetivos.',
              },
              {
                to: '/travel',
                icon: Plane,
                title: 'Viajes',
                text: 'Gastos compartidos y presupuestos.',
              },
              {
                to: '/boards/settings',
                icon: Settings2,
                title: 'Configuración',
                text: 'Configuración del espacio actual.',
              },
              {
                to: '/account',
                icon: UserRound,
                title: 'Cuenta',
                text: 'Perfil y preferencias.',
              },
            ].map((entry) => (
              <Button
                key={entry.to}
                variant="ghost"
                className="h-auto justify-start rounded-2xl p-4 text-left"
                onClick={() => {
                  setMoreOpen(false);
                  navigate(entry.to);
                }}
              >
                <entry.icon className="size-5" />
                <span>
                  <strong className="block">{entry.title}</strong>
                  <span className="text-xs font-normal text-muted-foreground">
                    {entry.text}
                  </span>
                </span>
              </Button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </nav>,
    document.body,
  );
}
