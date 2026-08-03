import { useEffect, useState, type ComponentType } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import CapturePage from '@/pages/CapturePage';
import DashboardPage from '@/pages/DashboardPage';
import ReportsPage from '@/pages/ReportsPage';
import SettingsPage from '@/pages/SettingsPage';
import TravelPage from '@/pages/TravelPage';
import { cn } from '@/lib/utils';

const MOBILE_TAB_PATHS = [
  '/home',
  '/reports',
  '/capture',
  '/travel',
  '/account',
] as const;

type MobileTabPath = (typeof MOBILE_TAB_PATHS)[number];

const TAB_PAGES: Record<MobileTabPath, ComponentType> = {
  '/home': DashboardPage,
  '/reports': ReportsPage,
  '/capture': CapturePage,
  '/travel': TravelPage,
  '/account': SettingsPage,
};

function isMobileTabPath(path: string): path is MobileTabPath {
  return (MOBILE_TAB_PATHS as readonly string[]).includes(path);
}

function getInitialVisitedTabs(): Set<MobileTabPath> {
  if (typeof window === 'undefined') {
    return new Set();
  }

  const path = window.location.pathname;
  return isMobileTabPath(path) ? new Set([path]) : new Set();
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 767px)').matches
      : false,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const onChange = () => setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}

export function TabAnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();
  const isMobile = useIsMobile();
  const path = location.pathname;
  const [visitedTabs, setVisitedTabs] = useState<Set<MobileTabPath>>(
    getInitialVisitedTabs,
  );

  useEffect(() => {
    if (!isMobileTabPath(path)) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      setVisitedTabs((current) => {
        if (current.has(path)) {
          return current;
        }
        return new Set(current).add(path);
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [path]);

  const showPreservedTabs =
    isMobile && (isMobileTabPath(path) || visitedTabs.size > 0);

  if (showPreservedTabs) {
    return (
      <div className="tab-content-stack relative z-0 flex min-h-0 w-full flex-1 flex-col">
        {MOBILE_TAB_PATHS.map((tabPath) => {
          if (!visitedTabs.has(tabPath)) {
            return null;
          }

          const Page = TAB_PAGES[tabPath];
          const isActive = path === tabPath;

          return (
            <div
              key={tabPath}
              className={cn(
                'tab-content-panel flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain pb-[var(--mobile-nav-total)]',
                !isActive && 'hidden',
              )}
              aria-hidden={!isActive}
            >
              <Page />
            </div>
          );
        })}

        {!isMobileTabPath(path) && (
          <div className="relative z-[1] flex min-h-0 flex-1 flex-col pb-[var(--mobile-nav-total)] md:pb-0">
            {outlet}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="tab-content-stack relative z-0 flex min-h-0 flex-1 flex-col max-md:overflow-y-auto max-md:pb-[var(--mobile-nav-total)]">
      {outlet}
    </div>
  );
}
