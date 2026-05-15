import { create } from 'zustand'

interface MapState {
  center: [number, number] // [latitude, longitude]
  zoom: number
  selectedStoreId: string | null
  isMapLoading: boolean

  // Actions
  setCenter: (center: [number, number]) => void
  setZoom: (zoom: number) => void
  setSelectedStoreId: (storeId: string | null) => void
  setIsMapLoading: (loading: boolean) => void
}

export const useMapStore = create<MapState>((set) => ({
  center: [39.8283, -98.5795], // Center of USA
  zoom: 4,
  selectedStoreId: null,
  isMapLoading: false,

  setCenter: (center) => set({ center }),

  setZoom: (zoom) => set({ zoom }),

  setSelectedStoreId: (storeId) => set({ selectedStoreId: storeId }),

  setIsMapLoading: (loading) => set({ isMapLoading: loading }),
}))
