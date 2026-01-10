import { create } from 'zustand';
import { Trip } from '@/services/tripsService';

interface TripsState {
  trips: Trip[];
  currentTrip: Trip | null;
  isLoading: boolean;
  setTrips: (trips: Trip[]) => void;
  addTrip: (trip: Trip) => void;
  updateTrip: (trip: Trip) => void;
  removeTrip: (tripId: string) => void;
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
  updateTrip: (updatedTrip) =>
    set((state) => {
      const newTrips = state.trips.map((trip) =>
        trip._id === updatedTrip._id ? updatedTrip : trip,
      );
      const newCurrentTrip =
        state.currentTrip?._id === updatedTrip._id
          ? updatedTrip
          : state.currentTrip;
      return { trips: newTrips, currentTrip: newCurrentTrip };
    }),
  removeTrip: (tripId) =>
    set((state) => {
      const newTrips = state.trips.filter((trip) => trip._id !== tripId);
      const newCurrentTrip =
        state.currentTrip?._id === tripId ? null : state.currentTrip;
      return { trips: newTrips, currentTrip: newCurrentTrip };
    }),
  setCurrentTrip: (trip) => set({ currentTrip: trip }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));
