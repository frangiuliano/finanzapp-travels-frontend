import { useEffect, useRef, useState, type ComponentType } from 'react';
import { flushSync } from 'react-dom';
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

function scheduleTabUpdate(
  path: string,
  animate: boolean,
  onUpdate: () => void,
) {
  if (animate && 'startViewTransition' in document) {
    document.startViewTransition(() => {
      flushSync(onUpdate);
    });
    return;
  }

  requestAnimationFrame(onUpdate);
}

export function TabAnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();
  const isMobile = useIsMobile();
  const path = location.pathname;

  const [renderPath, setRenderPath] = useState(path);
  const [visitedTabs, setVisitedTabs] = useState<Set<MobileTabPath>>(
    getInitialVisitedTabs,
  );
  const previousPath = useRef(path);

  useEffect(() => {
    if (path === previousPath.current) {
      return;
    }

    const tabSwitch =
      isMobileTabPath(path) && isMobileTabPath(previousPath.current);

    scheduleTabUpdate(path, tabSwitch, () => {
      previousPath.current = path;
      setRenderPath(path);
      if (isMobileTabPath(path)) {
        setVisitedTabs((current) => new Set(current).add(path));
      }
    });
  }, [path]);

  const showPreservedTabs =
    isMobile && (isMobileTabPath(renderPath) || visitedTabs.size > 0);

  if (showPreservedTabs) {
    return (
      <div className="tab-content-view relative flex flex-1 flex-col">
        {MOBILE_TAB_PATHS.map((tabPath) => {
          if (!visitedTabs.has(tabPath)) {
            return null;
          }

          const Page = TAB_PAGES[tabPath];
          const isVisible = renderPath === tabPath;

          return (
            <div
              key={tabPath}
              className={cn('flex flex-1 flex-col', !isVisible && 'hidden')}
              aria-hidden={!isVisible}
            >
              <Page />
            </div>
          );
        })}

        {!isMobileTabPath(renderPath) && (
          <div className="flex flex-1 flex-col">{outlet}</div>
        )}
      </div>
    );
  }

  return <div className="tab-content-view flex flex-1 flex-col">{outlet}</div>;
}
