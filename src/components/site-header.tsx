import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useTripsStore } from '@/store/tripsStore';

export function SiteHeader() {
  const currentTrip = useTripsStore((state) => state.currentTrip);
  const trips = useTripsStore((state) => state.trips);

  const activeTrip = currentTrip || trips[0];

  const displayTitle = activeTrip ? activeTrip.name : 'FinanzApp Travels';

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6 min-w-0">
        <SidebarTrigger className="-ml-1 shrink-0" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4 shrink-0"
        />
        <h1 className="text-base font-medium truncate flex-1 min-w-0">
          {displayTitle}
        </h1>
      </div>
    </header>
  );
}
