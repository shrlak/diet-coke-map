import { useEffect, useState } from 'react'
import type { Store } from '../types'
import { useAuthStore } from '../store/authStore'
import {
  addToFavorites,
  removeFromFavorites,
  isFavorited as checkFavorited,
} from '../services/storeService'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHour = hours % 12 || 12
  return `${displayHour}${minutes === 0 ? '' : `:${String(minutes).padStart(2, '0')}`} ${period}`
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

interface StoreDetailsModalProps {
  store: Store | null
  onClose: () => void
  distanceKm?: number
}

export default function StoreDetailsModal({ store, onClose, distanceKm }: StoreDetailsModalProps) {
  const { user, isAuthenticated } = useAuthStore()
  const [favorited, setFavorited] = useState(false)
  const [favLoading, setFavLoading] = useState(false)

  useEffect(() => {
    if (!store || !user) {
      setFavorited(false)
      return
    }
    checkFavorited(user.id, store.id).then(({ isFavorited }) => setFavorited(isFavorited))
  }, [store, user])

  if (!store) return null

  const today = new Date().getDay()

  const getDirectionsUrl = () => {
    const addr = encodeURIComponent(`${store.address}, ${store.city}, ${store.state} ${store.zip}`)
    // Mobile: open native maps app; desktop: open Google Maps
    return `https://www.google.com/maps/dir/?api=1&destination=${addr}`
  }

  const handleFavorite = async () => {
    if (!user) return
    setFavLoading(true)
    if (favorited) {
      await removeFromFavorites(user.id, store.id)
      setFavorited(false)
    } else {
      await addToFavorites(user.id, store.id)
      setFavorited(true)
    }
    setFavLoading(false)
  }

  const distanceMiles = distanceKm !== undefined ? (distanceKm * 0.621371).toFixed(1) : null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal – bottom sheet on mobile, centered card on desktop */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:top-1/2 md:left-1/2 md:bottom-auto md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-white rounded-t-2xl md:rounded-xl shadow-xl max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-start justify-between">
          <div className="min-w-0">
            <h2 className="font-bold text-lg text-gray-900 leading-tight">{store.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {store.address}, {store.city}, {store.state} {store.zip}
              {distanceMiles && ` · ${distanceMiles} mi away`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-3 text-gray-400 hover:text-gray-600 text-xl leading-none p-1 shrink-0"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Action Buttons */}
          <div className="flex gap-2">
            <a
              href={getDirectionsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-red-700 text-white py-2.5 rounded-lg text-sm font-semibold text-center hover:bg-red-800 transition-colors"
            >
              🗺️ Get Directions
            </a>

            {isAuthenticated ? (
              <button
                onClick={handleFavorite}
                disabled={favLoading}
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-xl hover:bg-gray-50 transition-colors disabled:opacity-60"
                title={favorited ? 'Remove from favorites' : 'Save to favorites'}
              >
                {favorited ? '❤️' : '🤍'}
              </button>
            ) : (
              <a
                href="/login"
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                title="Login to save favorites"
              >
                🤍 Save
              </a>
            )}

            {store.phone && (
              <a
                href={`tel:${store.phone}`}
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-xl hover:bg-gray-50 transition-colors"
                title={`Call ${store.name}`}
              >
                📞
              </a>
            )}
          </div>

          {/* Contact Info */}
          {store.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>📞</span>
              <a href={`tel:${store.phone}`} className="hover:text-red-700">
                {formatPhone(store.phone)}
              </a>
            </div>
          )}

          {/* Products Available */}
          {store.store_products && store.store_products.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-gray-800 mb-2">🥤 Diet Coke Available</h3>
              <div className="grid grid-cols-2 gap-2">
                {store.store_products.map((sp) => (
                  <div
                    key={sp.id}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${
                      sp.in_stock
                        ? 'border-green-200 bg-green-50 text-green-800'
                        : 'border-gray-100 bg-gray-50 text-gray-400 line-through'
                    }`}
                  >
                    <span>{sp.in_stock ? '✓' : '✕'}</span>
                    <span className="leading-tight">
                      {sp.products?.name?.replace('Diet Coke - ', '').replace('Diet Coke ', '')}
                    </span>
                  </div>
                ))}
              </div>
              {store.store_products[0]?.last_verified_at && (
                <p className="text-xs text-gray-400 mt-2">
                  Last verified:{' '}
                  {new Date(store.store_products[0].last_verified_at).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Hours */}
          {store.store_hours && store.store_hours.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-gray-800 mb-2">🕐 Store Hours</h3>
              <div className="space-y-1">
                {Array.from({ length: 7 }, (_, i) => i).map((day) => {
                  const hours = store.store_hours?.find((h) => h.day_of_week === day)
                  const isToday = day === today

                  return (
                    <div
                      key={day}
                      className={`flex justify-between text-sm py-0.5 ${
                        isToday ? 'font-semibold text-gray-900' : 'text-gray-600'
                      }`}
                    >
                      <span className={isToday ? 'text-red-700' : ''}>{DAY_NAMES[day]}</span>
                      <span>
                        {!hours || hours.is_closed
                          ? 'Closed'
                          : `${formatTime(hours.opens_at)} – ${formatTime(hours.closes_at)}`}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
