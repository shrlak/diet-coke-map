import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { SlidersHorizontal, MapIcon, List, X } from 'lucide-react'
import SearchBar from '../components/SearchBar'
import StoreCard from '../components/StoreCard'
import FilterPanel from '../components/FilterPanel'
import StoreDetailsModal from '../components/StoreDetailsModal'
import { useAuthStore } from '../store/authStore'
import { useFilterStore, useMapStore } from '../store/uiStore'
import { useGeoLocation } from '../hooks/useGeoLocation'
import {
  getStores,
  getStoresNearby,
  searchStoresByLocation,
  calculateDistance,
  addToFavorites,
  removeFromFavorites,
  getFavoriteStores,
} from '../services/api'
import type { Store, UserLocation } from '../types'

const Map = lazy(() => import('../components/Map'))

type ViewMode = 'map' | 'list'

const PRODUCT_LABELS: Record<string, string> = {
  DC_20OZ_BOTTLE: '20oz Bottle',
  DC_2L_BOTTLE: '2L Bottle',
  DC_6PACK_12OZ: '6-Pack',
  DC_12PACK_12OZ: '12-Pack',
  DC_24PACK_12OZ: '24-Pack',
  DC_30PACK_12OZ: '30-Pack',
  DC_8PACK_MINI: 'Mini 8-Pack',
  DC_FOUNTAIN: 'Fountain',
  DC_FEISTY_CHERRY_20OZ: 'Feisty Cherry',
  DC_GINGER_LIME_20OZ: 'Ginger Lime',
  DC_TWISTED_MANGO_20OZ: 'Twisted Mango',
  DCZS_20OZ_BOTTLE: 'Zero Sugar 20oz',
  DCZS_2L_BOTTLE: 'Zero Sugar 2L',
  DCZS_12PACK_12OZ: 'Zero Sugar 12-Pack',
  DC_CAFFEINE_FREE_20OZ: 'Caffeine Free 20oz',
  DC_CAFFEINE_FREE_2L: 'Caffeine Free 2L',
  DC_CAFFEINE_FREE_12PACK: 'Caffeine Free 12-Pack',
  DC_CHERRY_20OZ: 'Cherry 20oz',
  DC_VANILLA_20OZ: 'Vanilla 20oz',
  DC_LIME_20OZ: 'Lime 20oz',
  DC_16OZ_BOTTLE: '16oz Bottle',
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
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
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

      {/* Filter bottom sheet */}
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
