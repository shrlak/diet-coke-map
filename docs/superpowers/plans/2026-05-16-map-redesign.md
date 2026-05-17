# Diet Coke Map — Full UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the home page into a full-map-first experience with a chip bar for active filters, a bottom-sheet filter panel, a horizontal store strip, floating map layer/traffic controls, and improved geolocation accuracy.

**Architecture:** `Home.tsx` is fully rewritten as the orchestrating page; child components handle discrete concerns. `Map.tsx` wraps itself in a `relative` div to host floating controls. Two new fields added to `mapStore`. `useGeoLocation` hook extended with `watchPosition` and `accuracy`. No new npm dependencies required.

**Tech Stack:** React 19, TypeScript, Leaflet + react-leaflet v5, Zustand 5, Tailwind CSS, Vite 8. Verification: `npm run type-check` (no test framework installed).

**Spec:** `docs/superpowers/specs/2026-05-16-map-redesign-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/store/mapStore.ts` | Modify | Add `mapLayer` + `showTraffic` state |
| `src/hooks/useGeoLocation.ts` | Modify | Add `watchPosition`, `isWatching`, expose `accuracy` |
| `src/components/MapControls.tsx` | **Create** | Floating panel: layer switcher + traffic toggle |
| `src/components/Map.tsx` | Modify | Dynamic tile layers, accuracy circle, host MapControls |
| `src/components/FilterPanel.tsx` | Modify | Full rewrite as fixed bottom sheet |
| `src/components/StoreCard.tsx` | Modify | Add `compact` prop for horizontal strip |
| `src/pages/Home.tsx` | Modify | Full redesign: chip bar, store strip, hook, mutual exclusion |

---

## Task 1: mapStore — Add Layer and Traffic State

**Files:**
- Modify: `src/store/mapStore.ts`

- [ ] **Step 1: Replace mapStore.ts with the extended version**

```ts
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
```

- [ ] **Step 2: Verify types compile**

```bash
npm run type-check
```

Expected: no errors related to mapStore.

- [ ] **Step 3: Commit**

```bash
git add src/store/mapStore.ts
git commit -m "feat: add mapLayer and showTraffic state to mapStore"
```

---

## Task 2: useGeoLocation — watchPosition and Accuracy

**Files:**
- Modify: `src/hooks/useGeoLocation.ts`

- [ ] **Step 1: Replace useGeoLocation.ts with the extended version**

```ts
import { useCallback, useEffect, useRef, useState } from 'react'
import type { UserLocation } from '../types'

interface UseGeoLocationState {
  location: UserLocation | null
  loading: boolean
  error: string | null
  isWatching: boolean
  requestLocation: () => void
  startWatching: () => void
  stopWatching: () => void
}

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
}

const WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 5000,
}

export const useGeoLocation = (): UseGeoLocationState => {
  const [location, setLocation] = useState<UserLocation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isWatching, setIsWatching] = useState(false)
  const watchIdRef = useRef<number | null>(null)

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = position.coords
    setLocation({ latitude, longitude, accuracy })
    setLoading(false)
    setError(null)
  }, [])

  const handleError = useCallback((err: GeolocationPositionError) => {
    let errorMessage = 'Unable to retrieve your location'
    if (err.code === err.PERMISSION_DENIED) {
      errorMessage = 'Location permission denied. Please enable it in your browser settings.'
    } else if (err.code === err.POSITION_UNAVAILABLE) {
      errorMessage = 'Location information is unavailable.'
    } else if (err.code === err.TIMEOUT) {
      errorMessage = 'The request to get user location timed out.'
    }
    setError(errorMessage)
    setLoading(false)
  }, [])

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }
    setLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, GEO_OPTIONS)
  }, [handleSuccess, handleError])

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }
    if (watchIdRef.current !== null) return
    setLoading(true)
    setError(null)
    setIsWatching(true)
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      WATCH_OPTIONS,
    )
  }, [handleSuccess, handleError])

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsWatching(false)
  }, [])

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return { location, loading, error, isWatching, requestLocation, startWatching, stopWatching }
}
```

- [ ] **Step 2: Verify**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useGeoLocation.ts
git commit -m "feat: extend useGeoLocation with watchPosition, isWatching, and accuracy"
```

---

## Task 3: MapControls — New Floating Component

**Files:**
- Create: `src/components/MapControls.tsx`

- [ ] **Step 1: Create MapControls.tsx**

```tsx
import type { MapLayer } from '../store/mapStore'

interface MapControlsProps {
  mapLayer: MapLayer
  onMapLayerChange: (layer: MapLayer) => void
  showTraffic: boolean
  onTrafficToggle: () => void
}

const LAYERS: { id: MapLayer; emoji: string; label: string }[] = [
  { id: 'street', emoji: '🌍', label: 'Street' },
  { id: 'dark', emoji: '🌑', label: 'Dark' },
  { id: 'satellite', emoji: '🛰', label: 'Sat' },
]

const trafficEnabled = Boolean(import.meta.env.VITE_TOMTOM_API_KEY)

export default function MapControls({
  mapLayer,
  onMapLayerChange,
  showTraffic,
  onTrafficToggle,
}: MapControlsProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-1.5 flex flex-col gap-1 w-[52px]">
      {/* Layer switcher */}
      <p className="text-[8px] uppercase tracking-wider text-gray-400 text-center pt-0.5">Style</p>
      {LAYERS.map(({ id, emoji, label }) => (
        <button
          key={id}
          onClick={() => onMapLayerChange(id)}
          title={label}
          className={`flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-xs transition-all ${
            mapLayer === id
              ? 'bg-blue-700 text-white'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <span className="text-base leading-none">{emoji}</span>
          <span className="text-[8px]">{label}</span>
        </button>
      ))}

      {/* Divider */}
      <div className="h-px bg-gray-100 mx-1" />

      {/* Traffic toggle */}
      <p className="text-[8px] uppercase tracking-wider text-gray-400 text-center">Traffic</p>
      <button
        onClick={onTrafficToggle}
        disabled={!trafficEnabled}
        title={
          trafficEnabled
            ? showTraffic ? 'Turn off traffic' : 'Turn on traffic'
            : 'Add VITE_TOMTOM_API_KEY to .env to enable live traffic'
        }
        className={`flex flex-col items-center gap-0.5 py-1.5 rounded-lg border-2 text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
          showTraffic && trafficEnabled
            ? 'border-[#E8192C] bg-red-50 text-[#E8192C]'
            : 'border-gray-200 text-gray-400 hover:border-gray-300'
        }`}
      >
        <span className="text-base leading-none">🚦</span>
        <span className="text-[8px] font-semibold">
          {showTraffic && trafficEnabled ? 'ON' : 'OFF'}
        </span>
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Verify**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/MapControls.tsx
git commit -m "feat: add MapControls component with layer switcher and traffic toggle"
```

---

## Task 4: Map — Dynamic Tiles, Accuracy Circle, Floating Controls

**Files:**
- Modify: `src/components/Map.tsx`

- [ ] **Step 1: Replace Map.tsx**

```tsx
import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Store, UserLocation } from '../types'
import type { MapLayer } from '../store/mapStore'
import MapControls from './MapControls'

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const storeIcon = L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;background:#E8192C;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:2px 2px 6px rgba(0,0,0,0.4);"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -30],
})

const selectedStoreIcon = L.divIcon({
  className: '',
  html: `<div style="width:34px;height:34px;background:#E8192C;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 0 0 4px rgba(232,25,44,0.3),2px 2px 8px rgba(0,0,0,0.5);"></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -36],
})

const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:16px;height:16px;background:#2563eb;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(37,99,235,0.2);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const TILE_CONFIGS: Record<MapLayer, { url: string; attribution: string; maxZoom?: number }> = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 18,
  },
}

const TRAFFIC_URL = 'https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png'
const trafficKey = import.meta.env.VITE_TOMTOM_API_KEY as string | undefined

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [map, center, zoom])
  return null
}

interface MapProps {
  stores: Store[]
  selectedStoreId?: string | null
  userLocation?: UserLocation | null
  center: [number, number]
  zoom: number
  mapLayer: MapLayer
  showTraffic: boolean
  onStoreSelect: (storeId: string) => void
  onMapLayerChange: (layer: MapLayer) => void
  onTrafficToggle: () => void
  onGeolocate: () => void
  geoLoading?: boolean
}

export default function Map({
  stores,
  selectedStoreId,
  userLocation,
  center,
  zoom,
  mapLayer,
  showTraffic,
  onStoreSelect,
  onMapLayerChange,
  onTrafficToggle,
  onGeolocate,
  geoLoading,
}: MapProps) {
  const tileConfig = TILE_CONFIGS[mapLayer]

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={false}
      >
        {/* Base tile layer — key forces remount on layer change */}
        <TileLayer
          key={mapLayer}
          url={tileConfig.url}
          attribution={tileConfig.attribution}
          maxZoom={tileConfig.maxZoom ?? 19}
        />

        {/* Traffic overlay */}
        {showTraffic && trafficKey && (
          <TileLayer
            url={`${TRAFFIC_URL}?key=${trafficKey}`}
            attribution="&copy; TomTom"
            opacity={0.7}
          />
        )}

        <MapController center={center} zoom={zoom} />

        {/* User location marker + accuracy circle */}
        {userLocation && (
          <>
            {userLocation.accuracy && (
              <Circle
                center={[userLocation.latitude, userLocation.longitude]}
                radius={userLocation.accuracy}
                pathOptions={{
                  fillColor: '#2563eb',
                  fillOpacity: 0.1,
                  color: '#2563eb',
                  opacity: 0.3,
                  weight: 1,
                }}
              />
            )}
            <Marker
              position={[userLocation.latitude, userLocation.longitude]}
              icon={userIcon}
            >
              <Popup>
                <div className="text-sm font-medium">📍 Your Location</div>
                {userLocation.accuracy && (
                  <div className="text-xs text-gray-500">±{Math.round(userLocation.accuracy)}m accuracy</div>
                )}
              </Popup>
            </Marker>
          </>
        )}

        {/* Store markers */}
        {stores.map((store) => (
          <Marker
            key={store.id}
            position={[store.latitude, store.longitude]}
            icon={store.id === selectedStoreId ? selectedStoreIcon : storeIcon}
            eventHandlers={{ click: () => onStoreSelect(store.id) }}
          >
            <Popup>
              <div className="min-w-[160px]">
                <p className="font-semibold text-sm">{store.name}</p>
                <p className="text-xs text-gray-500 mt-1">{store.address}</p>
                <p className="text-xs text-gray-500">{store.city}, {store.state} {store.zip}</p>
                <button
                  onClick={() => onStoreSelect(store.id)}
                  className="mt-2 text-xs text-[#E8192C] font-semibold hover:underline block"
                >
                  View Details →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating layer + traffic controls (top-right) */}
      <div className="absolute top-3 right-3 z-[1000]">
        <MapControls
          mapLayer={mapLayer}
          onMapLayerChange={onMapLayerChange}
          showTraffic={showTraffic}
          onTrafficToggle={onTrafficToggle}
        />
      </div>

      {/* Locate me button (bottom-right) */}
      <button
        onClick={onGeolocate}
        disabled={geoLoading}
        title="Use my location"
        className="absolute bottom-3 right-3 z-[1000] bg-white rounded-xl shadow-lg border border-gray-100 w-11 h-11 flex items-center justify-center text-gray-600 hover:text-[#E8192C] hover:border-[#E8192C]/30 transition-all disabled:opacity-50"
      >
        {geoLoading ? (
          <span className="block w-4 h-4 border-2 border-gray-200 border-t-[#E8192C] rounded-full animate-spin" />
        ) : (
          <span className="text-base">📍</span>
        )}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Verify**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Map.tsx src/components/MapControls.tsx
git commit -m "feat: add dynamic tile layers, accuracy circle, and floating map controls to Map"
```

---

## Task 5: FilterPanel — Bottom Sheet Rewrite

**Files:**
- Modify: `src/components/FilterPanel.tsx`

- [ ] **Step 1: Replace FilterPanel.tsx with the bottom sheet version**

```tsx
import { useFilterStore } from '../store/filterStore'

const RADIUS_OPTIONS = [
  { km: 5, label: '3 mi' },
  { km: 10, label: '6 mi' },
  { km: 25, label: '15 mi' },
  { km: 50, label: '31 mi' },
]

const PRODUCT_OPTIONS = [
  { id: 'DC_20OZ_BOTTLE', label: '20oz Bottle' },
  { id: 'DC_2L_BOTTLE', label: '2L Bottle' },
  { id: 'DC_6PACK_12OZ', label: '6-Pack' },
  { id: 'DC_12PACK_12OZ', label: '12-Pack' },
  { id: 'DC_FOUNTAIN', label: 'Fountain' },
]

const STORE_TYPE_OPTIONS = [
  { id: '', label: 'All' },
  { id: 'convenience', label: 'Convenience' },
  { id: 'grocery', label: 'Grocery' },
  { id: 'gas', label: 'Gas Station' },
  { id: 'drugstore', label: 'Drugstore' },
]

interface FilterPanelProps {
  isOpen: boolean
  onClose: () => void
  resultCount: number
}

export default function FilterPanel({ isOpen, onClose, resultCount }: FilterPanelProps) {
  const { filters, sortBy, setRadius, setProductFilter, setFilters, setSortBy, resetFilters } =
    useFilterStore()

  const radiusKm = filters.radiusKm ?? 25
  const activeProductIds = filters.productIds ?? []

  const toggleProduct = (productId: string) => {
    if (activeProductIds.includes(productId)) {
      setProductFilter(activeProductIds.filter((id) => id !== productId))
    } else {
      setProductFilter([...activeProductIds, productId])
    }
  }

  const hasActiveFilters =
    activeProductIds.length > 0 ||
    Boolean(filters.storeType && filters.storeType !== '') ||
    radiusKm !== 25

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-[#1A1A1A]">Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-[#E8192C] font-medium hover:underline"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Radius + Sort By — 2-column grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Radius
              </p>
              <div className="flex gap-1.5">
                {RADIUS_OPTIONS.map(({ km, label }) => (
                  <button
                    key={km}
                    onClick={() => setRadius(km)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      radiusKm === km
                        ? 'border-[#E8192C] bg-red-50 text-[#E8192C]'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Sort By
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setSortBy('distance')}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    sortBy === 'distance'
                      ? 'border-[#E8192C] bg-red-50 text-[#E8192C]'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  📍 Near me
                </button>
                <button
                  onClick={() => setSortBy('name')}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    sortBy === 'name'
                      ? 'border-[#E8192C] bg-red-50 text-[#E8192C]'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  A–Z Name
                </button>
              </div>
            </div>
          </div>

          {/* Diet Coke Type */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Diet Coke Type
            </p>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_OPTIONS.map((product) => {
                const active = activeProductIds.includes(product.id)
                return (
                  <button
                    key={product.id}
                    onClick={() => toggleProduct(product.id)}
                    className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                      active
                        ? 'border-[#E8192C] bg-red-50 text-[#E8192C]'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {active && '✓ '}{product.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Store Type */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Store Type
            </p>
            <div className="flex flex-wrap gap-2">
              {STORE_TYPE_OPTIONS.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setFilters({ storeType: type.id || undefined })}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                    (filters.storeType ?? '') === type.id
                      ? 'border-[#E8192C] bg-red-50 text-[#E8192C]'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-6 pt-2 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full bg-[#E8192C] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#c8102e] transition-colors"
          >
            Show {resultCount} Results
          </button>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Verify**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/FilterPanel.tsx
git commit -m "feat: rewrite FilterPanel as fixed bottom sheet with 2-column layout and sort-by"
```

---

## Task 6: StoreCard — Compact Variant for Horizontal Strip

**Files:**
- Modify: `src/components/StoreCard.tsx`

- [ ] **Step 1: Add `compact` prop to StoreCardProps and add compact render branch**

In `StoreCard.tsx`, change the `StoreCardProps` interface and add the compact render. Add `compact?: boolean` to the interface:

```tsx
interface StoreCardProps {
  store: Store
  distance?: number
  isSelected?: boolean
  isFavorited?: boolean
  compact?: boolean
  onSelect: (storeId: string) => void
  onFavorite?: (storeId: string) => void
}
```

Then in the component body, before the existing `return`, add:

```tsx
export default function StoreCard({
  store,
  distance,
  isSelected,
  isFavorited,
  compact,
  onSelect,
  onFavorite,
}: StoreCardProps) {
  const { isOpen, label } = getOpenStatus(store.store_hours)

  if (compact) {
    return (
      <div
        className={`flex-shrink-0 w-44 h-full px-3 py-2.5 cursor-pointer border-l-[3px] transition-all flex flex-col justify-center gap-1 ${
          isSelected
            ? 'border-[#E8192C] bg-red-50/60'
            : 'border-transparent hover:bg-gray-50'
        }`}
        onClick={() => onSelect(store.id)}
      >
        <p className="font-semibold text-[#1A1A1A] text-xs leading-tight truncate">{store.name}</p>
        <p className="text-[10px] text-gray-400 truncate">{store.address}</p>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isOpen ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className={`text-[10px] ${isOpen ? 'text-green-600' : 'text-gray-400'}`}>
            {isOpen ? 'Open' : 'Closed'}
          </span>
          {distance !== undefined && (
            <span className="text-[10px] text-gray-400 ml-auto">{formatDistance(distance)}</span>
          )}
        </div>
      </div>
    )
  }

  // ... existing full card return unchanged below
```

Keep everything else in StoreCard.tsx exactly as-is. Only add the `compact` prop and the compact render branch before the existing `return`.

- [ ] **Step 2: Verify**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/StoreCard.tsx
git commit -m "feat: add compact prop to StoreCard for horizontal strip display"
```

---

## Task 7: Home — Full Redesign

**Files:**
- Modify: `src/pages/Home.tsx`

- [ ] **Step 1: Replace Home.tsx entirely**

```tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import { lazy, Suspense } from 'react'
import { SlidersHorizontal, MapIcon, List, X } from 'lucide-react'
import SearchBar from '../components/SearchBar'
import StoreCard from '../components/StoreCard'
import FilterPanel from '../components/FilterPanel'
import StoreDetailsModal from '../components/StoreDetailsModal'
import { useAuthStore } from '../store/authStore'
import { useFilterStore } from '../store/filterStore'
import { useMapStore } from '../store/mapStore'
import { useGeoLocation } from '../hooks/useGeoLocation'
import {
  getStores,
  getStoresNearby,
  searchStoresByLocation,
  calculateDistance,
  addToFavorites,
  removeFromFavorites,
  getFavoriteStores,
} from '../services/storeService'
import type { Store } from '../types'

const Map = lazy(() => import('../components/Map'))

type ViewMode = 'map' | 'list'

const PRODUCT_LABELS: Record<string, string> = {
  DC_20OZ_BOTTLE: '20oz Bottle',
  DC_2L_BOTTLE: '2L Bottle',
  DC_6PACK_12OZ: '6-Pack',
  DC_12PACK_12OZ: '12-Pack',
  DC_FOUNTAIN: 'Fountain',
}

const STORE_TYPE_LABELS: Record<string, string> = {
  convenience: 'Convenience',
  grocery: 'Grocery',
  gas: 'Gas Station',
  drugstore: 'Drugstore',
}

export default function Home() {
  const { user, isAuthenticated } = useAuthStore()
  const { filters, searchQuery, sortBy, setSearchQuery, setLocation, setRadius, setProductFilter, setFilters } =
    useFilterStore()
  const { center, zoom, selectedStoreId, mapLayer, showTraffic, setCenter, setZoom, setSelectedStoreId, setMapLayer, setShowTraffic } =
    useMapStore()

  const { location: geoLocation, loading: geoLoading, requestLocation } = useGeoLocation()

  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('map')
  const [filterOpen, setFilterOpen] = useState(false)
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null)
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set())
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const geoLoadedRef = useRef(false)

  // Load all stores on mount
  useEffect(() => {
    loadStores()
  }, [])

  // Refresh favorites when user changes
  useEffect(() => {
    if (user) loadFavorites()
    else setFavoritedIds(new Set())
  }, [user])

  // When geolocation resolves, update map and load nearby stores
  useEffect(() => {
    if (!geoLocation || geoLoadedRef.current) return
    geoLoadedRef.current = true
    const { latitude, longitude, accuracy } = geoLocation
    setUserLocation({ latitude, longitude, accuracy })
    setLocation(latitude, longitude)
    setCenter([latitude, longitude])
    setZoom(13)
    getStoresNearby(latitude, longitude, filters.radiusKm ?? 25).then(({ data }) => {
      if (data.length > 0) setStores(data)
    })
  }, [geoLocation, filters.radiusKm, setCenter, setZoom, setLocation])

  const loadStores = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await getStores()
      if (error) throw error
      setStores(data)
    } catch {
      setError('Failed to load stores. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadFavorites = async () => {
    if (!user) return
    const { data } = await getFavoriteStores(user.id)
    setFavoritedIds(new Set(data.map((f) => f.store_id)))
  }

  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) { loadStores(); return }
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await searchStoresByLocation(query)
        if (error) throw error
        setStores(data)
        if (data.length > 0) {
          setCenter([data[0].latitude, data[0].longitude])
          setZoom(13)
        }
      } catch {
        setError('Search failed. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    [setCenter, setZoom],
  )

  const handleGeolocate = () => {
    geoLoadedRef.current = false
    requestLocation()
  }

  const handleStoreSelect = (storeId: string) => {
    const store = stores.find((s) => s.id === storeId)
    setFilterOpen(false) // mutual exclusion
    setSelectedStoreId(storeId)
    setSelectedStore(store || null)
    if (store) {
      setCenter([store.latitude, store.longitude])
      setZoom(15)
    }
    setViewMode('map')
  }

  const handleOpenFilter = () => {
    setSelectedStore(null)   // mutual exclusion
    setSelectedStoreId(null)
    setFilterOpen(true)
  }

  const handleFavorite = async (storeId: string) => {
    if (!user) { window.location.href = '/login'; return }
    const isCurrentlyFav = favoritedIds.has(storeId)
    const newSet = new Set(favoritedIds)
    if (isCurrentlyFav) {
      await removeFromFavorites(user.id, storeId)
      newSet.delete(storeId)
    } else {
      await addToFavorites(user.id, storeId)
      newSet.add(storeId)
    }
    setFavoritedIds(newSet)
  }

  // Client-side filtering
  const filteredStores = stores.filter((store) => {
    if (filters.productIds && filters.productIds.length > 0 && store.store_products) {
      const storeSkus = store.store_products.filter((sp) => sp.in_stock).map((sp) => sp.products?.sku)
      if (!filters.productIds.some((id) => storeSkus.includes(id))) return false
    }
    if (filters.storeType && store.store_type !== filters.storeType) return false
    return true
  })

  // Sort
  const sortedStores =
    sortBy === 'name'
      ? [...filteredStores].sort((a, b) => a.name.localeCompare(b.name))
      : userLocation
      ? [...filteredStores].sort((a, b) =>
          calculateDistance(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude) -
          calculateDistance(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude),
        )
      : filteredStores

  const getDistance = (store: Store) =>
    userLocation
      ? calculateDistance(userLocation.latitude, userLocation.longitude, store.latitude, store.longitude)
      : undefined

  // Active filter chips
  const radiusKm = filters.radiusKm ?? 25
  const activeProductIds = filters.productIds ?? []
  const hasActiveFilters =
    activeProductIds.length > 0 ||
    Boolean(filters.storeType) ||
    radiusKm !== 25

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Red search strip */}
      <div className="bg-[#E8192C] px-4 py-2.5 flex-shrink-0">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
          onGeolocate={handleGeolocate}
          geoLoading={geoLoading}
        />
      </div>

      {/* Chip bar */}
      <div className="bg-white border-b border-gray-100 px-3 py-2 flex items-center gap-2 overflow-x-auto flex-shrink-0 min-h-[44px]">
        {/* Filters button */}
        <button
          onClick={handleOpenFilter}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium flex-shrink-0 transition-colors ${
            hasActiveFilters
              ? 'border-[#E8192C] bg-red-50 text-[#E8192C]'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          <SlidersHorizontal size={12} />
          Filters
          {hasActiveFilters && (
            <span className="bg-[#E8192C] text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center">
              {activeProductIds.length + (filters.storeType ? 1 : 0) + (radiusKm !== 25 ? 1 : 0)}
            </span>
          )}
        </button>

        {/* Active filter chips */}
        {radiusKm !== 25 && (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-red-50 border border-red-200 text-[#E8192C] text-xs rounded-full flex-shrink-0">
            {Math.round(radiusKm * 0.621371)} mi
            <button onClick={() => setRadius(25)} className="hover:text-red-800"><X size={10} /></button>
          </span>
        )}
        {activeProductIds.map((id) => (
          <span key={id} className="flex items-center gap-1 px-2 py-0.5 bg-red-50 border border-red-200 text-[#E8192C] text-xs rounded-full flex-shrink-0">
            {PRODUCT_LABELS[id] ?? id}
            <button onClick={() => setProductFilter(activeProductIds.filter((p) => p !== id))} className="hover:text-red-800"><X size={10} /></button>
          </span>
        ))}
        {filters.storeType && (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-red-50 border border-red-200 text-[#E8192C] text-xs rounded-full flex-shrink-0">
            {STORE_TYPE_LABELS[filters.storeType] ?? filters.storeType}
            <button onClick={() => setFilters({ storeType: undefined })} className="hover:text-red-800"><X size={10} /></button>
          </span>
        )}

        {/* Store count + view toggle */}
        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-400">
            {loading ? 'Loading…' : `${sortedStores.length} stores`}
          </span>
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('map')}
              className={`px-2.5 py-1 transition-colors ${viewMode === 'map' ? 'bg-[#E8192C] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              title="Map view"
            >
              <MapIcon size={13} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 transition-colors ${viewMode === 'list' ? 'bg-[#E8192C] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              title="List view"
            >
              <List size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-[#E8192C] text-sm flex-shrink-0 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 hover:underline text-xs">Dismiss</button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* MAP VIEW */}
        {viewMode === 'map' && (
          <>
            {/* Map fills remaining space */}
            <div className="flex-1 relative overflow-hidden">
              <Suspense fallback={<div className="flex-1 flex items-center justify-center bg-gray-100 h-full">Loading map…</div>}>
                <Map
                  stores={sortedStores}
                  selectedStoreId={selectedStoreId}
                  userLocation={userLocation}
                  center={center}
                  zoom={zoom}
                  mapLayer={mapLayer}
                  showTraffic={showTraffic}
                  onStoreSelect={handleStoreSelect}
                  onMapLayerChange={setMapLayer}
                  onTrafficToggle={() => setShowTraffic(!showTraffic)}
                  onGeolocate={handleGeolocate}
                  geoLoading={geoLoading}
                />
              </Suspense>

              {/* Store count badge (top-left over map) */}
              {!loading && (
                <div className="absolute top-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm border border-gray-100 rounded-lg px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm">
                  {sortedStores.length} stores
                </div>
              )}
            </div>

            {/* Horizontal store strip */}
            <div className="h-[76px] flex-shrink-0 bg-white border-t border-gray-100 flex overflow-x-auto divide-x divide-gray-100">
              {loading ? (
                <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
                  Loading stores…
                </div>
              ) : sortedStores.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-sm text-gray-400 gap-2">
                  <span>🥤</span> No stores found — try adjusting filters
                </div>
              ) : (
                sortedStores.map((store) => (
                  <StoreCard
                    key={store.id}
                    store={store}
                    distance={getDistance(store)}
                    isSelected={selectedStoreId === store.id}
                    isFavorited={favoritedIds.has(store.id)}
                    onSelect={handleStoreSelect}
                    onFavorite={isAuthenticated ? handleFavorite : undefined}
                    compact
                  />
                ))
              )}
            </div>
          </>
        )}

        {/* LIST VIEW */}
        {viewMode === 'list' && (
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-48 text-gray-400">
                Loading stores…
              </div>
            ) : sortedStores.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-center p-6 gap-2">
                <span className="text-4xl">🥤</span>
                <p className="font-medium">No stores found</p>
                <p className="text-sm">Try a different search or adjust filters</p>
              </div>
            ) : (
              <div className="p-4 space-y-2 max-w-2xl mx-auto">
                {sortedStores.map((store) => (
                  <StoreCard
                    key={store.id}
                    store={store}
                    distance={getDistance(store)}
                    isSelected={selectedStoreId === store.id}
                    isFavorited={favoritedIds.has(store.id)}
                    onSelect={handleStoreSelect}
                    onFavorite={isAuthenticated ? handleFavorite : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter bottom sheet (rendered outside map to allow fixed positioning) */}
      <FilterPanel
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        resultCount={sortedStores.length}
      />

      {/* Store details modal */}
      {selectedStore && (
        <StoreDetailsModal
          store={selectedStore}
          onClose={() => { setSelectedStore(null); setSelectedStoreId(null) }}
          distanceKm={getDistance(selectedStore)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify types compile and lint passes**

```bash
npm run type-check && npm run lint
```

Expected: no errors or warnings.

- [ ] **Step 3: Run dev server and test manually**

```bash
npm run dev
```

Open `http://localhost:5173` and verify:
1. Red search bar at top, map fills the screen below chip bar
2. Chip bar shows Filters button + Map/List toggle; chips appear when filters are active and can be dismissed with ×
3. Clicking Filters opens the bottom sheet from the bottom; tapping backdrop closes it
4. Bottom sheet shows Radius, Sort By (2-col), Diet Coke Type chips, Store Type chips, "Show N Results" button
5. Map controls panel (top-right of map): 🌍/🌑/🛰 layer buttons switch tile styles; 🚦 OFF by default (disabled if no API key)
6. 📍 locate button (bottom-right of map) requests geolocation; blue accuracy circle appears around user pin
7. Store strip (76px at bottom of map) shows horizontal scrollable compact cards; clicking a card centers map and opens StoreDetailsModal
8. StoreDetailsModal and filter sheet are mutually exclusive (opening one closes the other)
9. List view shows full StoreCard cards in a scrollable list

- [ ] **Step 4: Build to confirm no production errors**

```bash
npm run build
```

Expected: build completes with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Home.tsx
git commit -m "feat: full Home page redesign — chip bar, store strip, map-first layout"
```

- [ ] **Step 6: Final smoke test**

Confirm `npm run build` succeeds and walk through the full verification checklist below before marking this task done.

---

## Verification Checklist

- [ ] `npm run type-check` passes with zero errors
- [ ] `npm run lint` passes with zero warnings
- [ ] `npm run build` completes successfully
- [ ] Map switches between Street / Dark / Satellite tiles
- [ ] Traffic toggle is disabled without `VITE_TOMTOM_API_KEY`; enabled and overlays traffic tiles when key is present
- [ ] Geolocation shows blue accuracy circle around user pin
- [ ] Filter bottom sheet opens/closes with slide animation and backdrop
- [ ] All active filters show as dismissible chips in the chip bar
- [ ] Sort by "Near me" and "A–Z" work correctly
- [ ] Compact store strip scrolls horizontally; selected card highlights red
- [ ] StoreDetailsModal and filter sheet never open simultaneously
- [ ] List view still works end-to-end
