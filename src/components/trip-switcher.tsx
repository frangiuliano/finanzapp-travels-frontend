'use client';

import * as React from 'react';
import { ChevronsUpDown, Plus, PlaneIcon, UserPlus } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useSidebar } from '@/components/ui/sidebar-context';
import { CreateTripDialog } from '@/components/create-trip-dialog';
import { InviteParticipantDialog } from '@/components/invite-participant-dialog';
import { useTripsStore } from '@/store/tripsStore';

export function TripSwitcher() {
  const { isMobile } = useSidebar();
  const trips = useTripsStore((state) => state.trips);
  const currentTrip = useTripsStore((state) => state.currentTrip);
  const setCurrentTrip = useTripsStore((state) => state.setCurrentTrip);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = React.useState(false);

  const activeTrip = currentTrip || trips[0];

  React.useEffect(() => {
    if (trips.length > 0) {
      if (!currentTrip) {
        setCurrentTrip(trips[0]);
      } else {
        const currentTripExists = trips.some(
          (trip) => trip._id === currentTrip._id,
        );
        if (!currentTripExists) {
          setCurrentTrip(trips[0]);
        }
      }
    }
  }, [trips, currentTrip, setCurrentTrip]);

  if (!activeTrip || trips.length === 0) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            onClick={() => setIsCreateDialogOpen(true)}
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <Plus className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Crear primer viaje</span>
              <span className="truncate text-xs text-muted-foreground">
                Haz clic para comenzar
              </span>
            </div>
          </SidebarMenuButton>
          <CreateTripDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          />
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <PlaneIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeTrip.name}</span>
                <span className="truncate text-xs">
                  {activeTrip.baseCurrency}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Viajes
            </DropdownMenuLabel>
            {trips.map((trip, index) => (
              <DropdownMenuItem
                key={trip._id}
                onClick={() => setCurrentTrip(trip)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <PlaneIcon className="size-3.5 shrink-0" />
                </div>
                {trip.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => setIsInviteDialogOpen(true)}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <UserPlus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">
                Invitar participante
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">
                Agregar viaje
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      <CreateTripDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      <InviteParticipantDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
      />
    </SidebarMenu>
  );
}
