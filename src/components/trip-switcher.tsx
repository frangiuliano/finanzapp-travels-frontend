'use client';

import * as React from 'react';
import {
  ChevronsUpDown,
  Plus,
  PlaneIcon,
  UserPlus,
  Trash2,
} from 'lucide-react';

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
import { tripsService } from '@/services/tripsService';
import { toast } from 'sonner';

export function TripSwitcher() {
  const { isMobile } = useSidebar();
  const trips = useTripsStore((state) => state.trips);
  const currentTrip = useTripsStore((state) => state.currentTrip);
  const setCurrentTrip = useTripsStore((state) => state.setCurrentTrip);
  const removeTrip = useTripsStore((state) => state.removeTrip);
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

  const handleDeleteTrip = async (
    e: React.MouseEvent,
    trip: (typeof trips)[0],
  ) => {
    e.stopPropagation();

    if (
      !confirm(
        `¿Estás seguro de que deseas eliminar el viaje "${trip.name}"? Esta acción eliminará todos los presupuestos, participantes e invitaciones asociadas y no se puede deshacer.`,
      )
    ) {
      return;
    }

    try {
      await tripsService.deleteTrip(trip._id);
      toast.success('Viaje eliminado exitosamente');
      removeTrip(trip._id);

      if (currentTrip?._id === trip._id) {
        const remainingTrips = trips.filter((t) => t._id !== trip._id);
        if (remainingTrips.length > 0) {
          setCurrentTrip(remainingTrips[0]);
        } else {
          setCurrentTrip(null);
        }
      }
    } catch (error) {
      console.error('Error al eliminar viaje:', error);
      toast.error('Error al eliminar el viaje');
    }
  };

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
                className="gap-2 p-2 relative"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <PlaneIcon className="size-3.5 shrink-0" />
                </div>
                <span className="flex-1">{trip.name}</span>
                <button
                  onClick={(e) => handleDeleteTrip(e, trip)}
                  className="ml-auto rounded-sm p-1 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  title="Eliminar viaje"
                  type="button"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
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
