import { useCallback, useEffect, useRef, useState } from 'react'
import { lazy, Suspense } from 'react'
import SearchBar from '../components/SearchBar'
import StoreCard from '../components/StoreCard'
import FilterPanel from '../components/FilterPanel'
import StoreDetailsModal from '../components/StoreDetailsModal'
import { useAuthStore } from '../store/authStore'
import { useFilterStore } from '../store/filterStore'
import { useMapStore } from '../store/mapStore'
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

// Lazy load map to avoid SSR issues
const Map = lazy(() => import('../components/Map'))

type ViewMode = 'map' | 'list'

export default function Home() {
  const { user, isAuthenticated } = useAuthStore()
  const { filters, searchQuery, setSearchQuery, setLocation } = useFilterStore()
  const { center, zoom, selectedStoreId, setCenter, setZoom, setSelectedStoreId } = useMapStore()

  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('map')
  const [filterOpen, setFilterOpen] = useState(false)
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set())
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)

  const filterRef = useRef<HTMLDivElement>(null)

  // Load stores on mount
  useEffect(() => {
    loadStores()
  }, [])

  // Refresh favorites when user changes
  useEffect(() => {
    if (user) {
      loadFavorites()
    } else {
      setFavoritedIds(new Set())
    }
  }, [user])

  const loadStores = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await getStores()
      if (error) throw error
      setStores(data)
    } catch (err) {
      setError('Failed to load stores. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadFavorites = async () => {
    if (!user) return
    const { data } = await getFavoriteStores(user.id)
    setFavoritedIds(new Set(data.map((f) => f.store_id)))
  }

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      loadStores()
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await searchStoresByLocation(query)
      if (error) throw error
      setStores(data)
      if (data.length > 0) {
        const firstStore = data[0]
        setCenter([firstStore.latitude, firstStore.longitude])
        setZoom(13)
      }
    } catch (err) {
      setError('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [setCenter, setZoom])

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation({ latitude, longitude })
        setLocation(latitude, longitude)
        setCenter([latitude, longitude])
        setZoom(13)
        setGeoLoading(false)
        // Load nearby stores
        const { data } = await getStoresNearby(latitude, longitude, filters.radiusKm ?? 25)
        setStores(data)
      },
      () => {
        setGeoLoading(false)
        setError('Could not get your location. Please search by address instead.')
      }
    )
  }

  const handleStoreSelect = (storeId: string) => {
    const store = stores.find((s) => s.id === storeId)
    setSelectedStoreId(storeId)
    setSelectedStore(store || null)
    if (store) {
      setCenter([store.latitude, store.longitude])
      setZoom(15)
    }
    setViewMode('map')
  }

  const handleFavorite = async (storeId: string) => {
    if (!user) {
      window.location.href = '/login'
      return
    }
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

  // Apply client-side filters
  const filteredStores = stores.filter((store) => {
    // Filter by product type (if products filter is set)
    if (filters.productIds && filters.productIds.length > 0 && store.store_products) {
      const storeProductSkus = store.store_products
        .filter((sp) => sp.in_stock)
        .map((sp) => sp.products?.sku)
      const hasRequiredProduct = filters.productIds.some((id) =>
        storeProductSkus.includes(id)
      )
      if (!hasRequiredProduct) return false
    }
    // Filter by store type
    if (filters.storeType && store.store_type !== filters.storeType) return false
    return true
  })

  // Sort by distance from user location
  const sortedStores = userLocation
    ? [...filteredStores].sort((a, b) => {
        const distA = calculateDistance(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude)
        const distB = calculateDistance(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude)
        return distA - distB
      })
    : filteredStores

  const getDistance = (store: Store) => {
    if (!userLocation) return undefined
    return calculateDistance(userLocation.latitude, userLocation.longitude, store.latitude, store.longitude)
  }

  const hasActiveFilters =
    (filters.productIds?.length ?? 0) > 0 ||
    (filters.storeType && filters.storeType !== '')

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Search & Controls */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 space-y-2">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
          onGeolocate={handleGeolocate}
          geoLoading={geoLoading}
        />
        <div className="relative" ref={filterRef}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                  hasActiveFilters
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                ⚙️ Filters
                {hasActiveFilters && (
                  <span className="bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {(filters.productIds?.length ?? 0) + (filters.storeType ? 1 : 0)}
                  </span>
                )}
              </button>
              <span className="text-sm text-gray-500">
                {loading ? 'Loading...' : `${sortedStores.length} stores`}
              </span>
            </div>

            {/* View Toggle */}
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  viewMode === 'map'
                    ? 'bg-red-700 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                🗺️ Map
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  viewMode === 'list'
                    ? 'bg-red-700 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                📋 List
              </button>
            </div>
          </div>

          {filterOpen && (
            <FilterPanel
              isOpen={filterOpen}
              onClose={() => setFilterOpen(false)}
              resultCount={sortedStores.length}
            />
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-red-700 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 hover:underline text-red-600">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Map View */}
        {viewMode === 'map' && (
          <>
            <Suspense fallback={<div className="flex-1 flex items-center justify-center bg-gray-100">Loading map…</div>}>
              <Map
                stores={sortedStores}
                selectedStoreId={selectedStoreId}
                userLocation={userLocation}
                center={center}
                zoom={zoom}
                onStoreSelect={handleStoreSelect}
              />
            </Suspense>

            {/* Side Panel (desktop) */}
            <div className="hidden md:flex w-80 flex-col bg-white border-l border-gray-200 overflow-y-auto">
              {loading ? (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  Loading stores...
                </div>
              ) : sortedStores.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-500">
                  <p className="text-4xl mb-2">🥤</p>
                  <p className="font-medium">No stores found</p>
                  <p className="text-sm mt-1">Try expanding your search radius or adjusting filters</p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
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

            {/* Store Details Modal (on map view) */}
            {selectedStore && (
              <div className="absolute bottom-0 left-0 right-0 md:hidden z-50">
                <StoreDetailsModal
                  store={selectedStore}
                  onClose={() => {
                    setSelectedStore(null)
                    setSelectedStoreId(null)
                  }}
                  distanceKm={getDistance(selectedStore)}
                />
              </div>
            )}
          </>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-48 text-gray-500">
                Loading stores...
              </div>
            ) : sortedStores.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-500 text-center p-6">
                <p className="text-4xl mb-2">🥤</p>
                <p className="font-medium">No stores found</p>
                <p className="text-sm mt-1">Try a different search or adjust filters</p>
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

        {/* Store Details (desktop list view) */}
        {selectedStore && viewMode === 'list' && (
          <div className="fixed inset-0 flex items-end md:items-center justify-center z-50 p-4">
            <div className="w-full max-w-lg">
              <StoreDetailsModal
                store={selectedStore}
                onClose={() => {
                  setSelectedStore(null)
                  setSelectedStoreId(null)
                }}
                distanceKm={getDistance(selectedStore)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
