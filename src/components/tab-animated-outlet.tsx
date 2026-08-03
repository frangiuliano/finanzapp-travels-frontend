import { useOutlet } from 'react-router-dom';

/**
 * Mobile uses the standard router outlet so only one page mounts at a time.
 * Preserving multiple tab panels caused invisible layers that blocked taps on iOS PWA.
 */
export function TabAnimatedOutlet() {
  const outlet = useOutlet();

  return (
    <div className="tab-content-stack relative z-0 flex min-h-0 flex-1 flex-col max-md:overflow-y-auto max-md:pb-[var(--mobile-nav-total)]">
      {outlet}
    </div>
  );
}
