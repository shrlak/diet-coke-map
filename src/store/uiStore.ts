import { create } from 'zustand'
import type { SearchFilters } from '../types'

// Map state
export type MapLayer = 'street' | 'dark' | 'satellite'

interface MapState {
  center: [number, number]
  zoom: number
  selectedStoreId: string | null
  isMapLoading: boolean
  mapLayer: MapLayer
  showTraffic: boolean

  setCenter: (center: [number, number]) => void
  setZoom: (zoom: number) => void
  setSelectedStoreId: (storeId: string | null) => void
  setIsMapLoading: (loading: boolean) => void
  setMapLayer: (layer: MapLayer) => void
  setShowTraffic: (show: boolean) => void
}

export const useMapStore = create<MapState>((set) => ({
  center: [40.4406, -79.9959],
  zoom: 12,
  selectedStoreId: null,
  isMapLoading: false,
  mapLayer: 'street',
  showTraffic: false,

  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setSelectedStoreId: (storeId) => set({ selectedStoreId: storeId }),
  setIsMapLoading: (loading) => set({ isMapLoading: loading }),
  setMapLayer: (mapLayer) => set({ mapLayer }),
  setShowTraffic: (showTraffic) => set({ showTraffic }),
}))

// Filter state
interface FilterState {
  filters: SearchFilters
  searchQuery: string
  sortBy: 'distance' | 'name' | 'rating'

  setFilters: (filters: Partial<SearchFilters>) => void
  setSearchQuery: (query: string) => void
  setSortBy: (sortBy: 'distance' | 'name' | 'rating') => void
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

  resetFilters: () => set({ filters: DEFAULT_FILTERS, searchQuery: '', sortBy: 'distance' }),
}))
