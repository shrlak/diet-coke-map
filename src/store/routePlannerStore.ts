import { create } from 'zustand'
import type { Store } from '../types'

interface RoutePlannerState {
  isActive: boolean
  stops: Store[]
  toggleActive: () => void
  addStop: (store: Store) => void
  removeStop: (storeId: string) => void
  clearRoute: () => void
}

export const useRoutePlannerStore = create<RoutePlannerState>((set) => ({
  isActive: false,
  stops: [],
  toggleActive: () =>
    set((state) => ({ isActive: !state.isActive, stops: state.isActive ? [] : state.stops })),
  addStop: (store) =>
    set((state) => {
      if (state.stops.find((s) => s.id === store.id)) return state
      if (state.stops.length >= 5) return state
      return { stops: [...state.stops, store] }
    }),
  removeStop: (storeId) =>
    set((state) => ({ stops: state.stops.filter((s) => s.id !== storeId) })),
  clearRoute: () => set({ stops: [], isActive: false }),
}))
