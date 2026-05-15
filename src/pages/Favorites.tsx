import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StoreCard from '../components/StoreCard'
import StoreDetailsModal from '../components/StoreDetailsModal'
import { useAuthStore } from '../store/authStore'
import { getFavoriteStores, removeFromFavorites } from '../services/storeService'
import type { Store } from '../types'

export default function Favorites() {
  const { user, isAuthenticated } = useAuthStore()
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)

  useEffect(() => {
    if (user) {
      loadFavorites()
    } else {
      setLoading(false)
    }
  }, [user])

  const loadFavorites = async () => {
    if (!user) return
    setLoading(true)
    const { data } = await getFavoriteStores(user.id)
    setStores(data.filter((f) => f.stores).map((f) => f.stores!))
    setLoading(false)
  }

  const handleRemoveFavorite = async (storeId: string) => {
    if (!user) return
    await removeFromFavorites(user.id, storeId)
    setStores((prev) => prev.filter((s) => s.id !== storeId))
    if (selectedStore?.id === storeId) setSelectedStore(null)
  }

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <p className="text-6xl mb-4">🤍</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Save Your Favorites</h1>
        <p className="text-gray-600 mb-6 max-w-sm">
          Sign in to save your favorite Diet Coke stores and access them from any device.
        </p>
        <Link
          to="/login"
          className="bg-red-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-800 transition-colors"
        >
          Sign In
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Loading favorites...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">❤️ Favorite Stores</h1>
          <span className="text-sm text-gray-500">{stores.length} saved</span>
        </div>

        {stores.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🥤</p>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">No favorites yet</h2>
            <p className="text-gray-500 text-sm mb-6">
              Search for stores and tap ❤️ to save your favorites
            </p>
            <Link
              to="/"
              className="bg-red-700 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-red-800 transition-colors"
            >
              Find Stores
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {stores.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                isFavorited={true}
                onSelect={(id) => {
                  const s = stores.find((s) => s.id === id)
                  setSelectedStore(s || null)
                }}
                onFavorite={handleRemoveFavorite}
              />
            ))}
          </div>
        )}
      </div>

      {selectedStore && (
        <StoreDetailsModal
          store={selectedStore}
          onClose={() => setSelectedStore(null)}
        />
      )}
    </div>
  )
}
