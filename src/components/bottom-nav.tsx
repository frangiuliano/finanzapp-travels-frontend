import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [indicator, setIndicator] = useState({
    left: 0,
    width: 0,
    ready: false,
  });

  const activeIndex = items.findIndex((item) => item.to === location.pathname);

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

  return (
    <nav
      aria-label="Navegación principal"
      className="pointer-events-none fixed inset-x-3 z-40 md:hidden"
      style={{ bottom: 'var(--mobile-nav-bottom)' }}
    >
      <div
        className={cn(
          glassPill,
          'pointer-events-auto mx-auto flex max-w-lg items-center transition-[height,padding] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
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
            const emphasis = 'emphasis' in item && item.emphasis;

            return (
              <li
                key={item.to}
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                className="flex flex-1"
              >
                <NavLink
                  to={item.to}
                  onClick={triggerTabHaptic}
                  className={({ isActive }) =>
                    cn(
                      'relative z-10 flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full py-1 text-[10px] font-medium transition-colors duration-200',
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
                          emphasis &&
                            'bg-[var(--signal)] text-white shadow-[0_6px_18px_color-mix(in_oklab,var(--signal)_32%,transparent)]',
                          emphasis && (minimized ? 'size-8' : 'size-10'),
                          emphasis &&
                            isActive &&
                            'scale-105 ring-2 ring-white/35',
                          !emphasis && (minimized ? 'size-7' : 'size-8'),
                          !emphasis && isActive && 'scale-105',
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
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
