import { create } from 'zustand';
import { Trip } from '@/services/tripsService';

const LAST_INTERACTED_TRIP_KEY = 'lastInteractedTripId';

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

const saveLastInteractedTripId = (tripId: string | null) => {
  if (typeof window === 'undefined') return;
  if (tripId) {
    localStorage.setItem(LAST_INTERACTED_TRIP_KEY, tripId);
  } else {
    localStorage.removeItem(LAST_INTERACTED_TRIP_KEY);
  }
};

export const getLastInteractedTripIdFromStorage = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LAST_INTERACTED_TRIP_KEY);
};

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
      if (newCurrentTrip?._id === tripId) {
        saveLastInteractedTripId(null);
      }
      return { trips: newTrips, currentTrip: newCurrentTrip };
    }),
  setCurrentTrip: (trip) => {
    saveLastInteractedTripId(trip?._id || null);
    set({ currentTrip: trip });
  },
  setIsLoading: (isLoading) => set({ isLoading }),
}));
