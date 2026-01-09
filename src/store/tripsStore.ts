import { create } from 'zustand';
import { Trip } from '@/services/tripsService';

interface TripsState {
  trips: Trip[];
  currentTrip: Trip | null;
  isLoading: boolean;
  setTrips: (trips: Trip[]) => void;
  addTrip: (trip: Trip) => void;
  setCurrentTrip: (trip: Trip | null) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useTripsStore = create<TripsState>((set) => ({
  trips: [],
  currentTrip: null,
  isLoading: false,
  setTrips: (trips) => set({ trips }),
  addTrip: (trip) =>
    set((state) => {
      const newTrips = [trip, ...state.trips];
      return { trips: newTrips };
    }),
  setCurrentTrip: (trip) => set({ currentTrip: trip }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));
