import { create } from 'zustand'

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
  center: [39.8283, -98.5795],
  zoom: 4,
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
