import { create } from 'zustand'
import type { SearchFilters } from '../types'

interface FilterState {
  filters: SearchFilters
  searchQuery: string
  sortBy: 'distance' | 'name'

  // Actions
  setFilters: (filters: Partial<SearchFilters>) => void
  setSearchQuery: (query: string) => void
  setSortBy: (sortBy: 'distance' | 'name') => void
  setRadius: (radiusKm: number) => void
  setProductFilter: (productIds: string[]) => void
  setLocation: (latitude: number, longitude: number) => void
  resetFilters: () => void
}

const DEFAULT_FILTERS: SearchFilters = {
  radiusKm: 25,
  productIds: [],
}

export const useFilterStore = create<FilterState>((set) => ({
  filters: DEFAULT_FILTERS,
  searchQuery: '',
  sortBy: 'distance',

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSortBy: (sortBy) => set({ sortBy }),

  setRadius: (radiusKm) =>
    set((state) => ({
      filters: { ...state.filters, radiusKm },
    })),

  setProductFilter: (productIds) =>
    set((state) => ({
      filters: { ...state.filters, productIds },
    })),

  setLocation: (latitude, longitude) =>
    set((state) => ({
      filters: { ...state.filters, latitude, longitude },
    })),

  resetFilters: () => set({ filters: DEFAULT_FILTERS, searchQuery: '' }),
}))
