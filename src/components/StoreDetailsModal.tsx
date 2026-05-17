import { useEffect, useState } from 'react'
import { X, Navigation, Heart, Phone, Clock, Package } from 'lucide-react'
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
    if (!store || !user) { setFavorited(false); return }
    checkFavorited(user.id, store.id).then(({ isFavorited }) => setFavorited(isFavorited))
  }, [store, user])

  if (!store) return null

  const today = new Date().getDay()
  const distanceMiles = distanceKm !== undefined ? (distanceKm * 0.621371).toFixed(1) : null

  const getDirectionsUrl = () => {
    const addr = encodeURIComponent(`${store.address}, ${store.city}, ${store.state} ${store.zip}`)
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

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} aria-hidden="true" />

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[80vh] overflow-y-auto">
        {/* Drag handle (mobile) */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-start justify-between">
          <div className="min-w-0">
            <h2 className="font-bold text-[#1A1A1A] text-lg leading-tight">{store.name}</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {store.address}, {store.city}, {store.state} {store.zip}
              {distanceMiles && <> · <span className="text-[#E8192C] font-medium">{distanceMiles} mi</span></>}
            </p>
          </div>
          <button onClick={onClose} className="ml-3 text-gray-400 hover:text-gray-600 p-1 shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Actions */}
          <div className="flex gap-2">
            <a
              href={getDirectionsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-[#E8192C] text-white py-2.5 rounded-lg text-sm font-semibold text-center hover:bg-[#c8102e] transition-colors flex items-center justify-center gap-2"
            >
              <Navigation size={15} />
              Get Directions
            </a>

            {isAuthenticated ? (
              <button
                onClick={handleFavorite}
                disabled={favLoading}
                className={`px-4 py-2.5 border rounded-lg transition-all disabled:opacity-60 ${
                  favorited ? 'border-[#E8192C] bg-red-50 text-[#E8192C]' : 'border-gray-200 text-gray-400 hover:border-[#E8192C]/40 hover:text-[#E8192C]'
                }`}
                title={favorited ? 'Remove from favorites' : 'Save to favorites'}
              >
                <Heart size={17} fill={favorited ? '#E8192C' : 'none'} />
              </button>
            ) : (
              <a
                href="/login"
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors"
                title="Login to save favorites"
              >
                <Heart size={17} />
              </a>
            )}

            {store.phone && (
              <a
                href={`tel:${store.phone}`}
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-[#E8192C] hover:border-[#E8192C]/40 transition-all"
                title={`Call ${store.name}`}
              >
                <Phone size={16} />
              </a>
            )}
          </div>

          {store.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Phone size={14} className="text-gray-400 shrink-0" />
              <a href={`tel:${store.phone}`} className="hover:text-[#E8192C] transition-colors">
                {formatPhone(store.phone)}
              </a>
            </div>
          )}

          {store.store_products && store.store_products.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package size={14} className="text-[#E8192C]" />
                <h3 className="font-semibold text-sm text-[#1A1A1A]">Diet Coke Available</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {store.store_products.map((sp) => (
                  <div
                    key={sp.id}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium ${
                      sp.in_stock
                        ? 'border-green-100 bg-green-50 text-green-700'
                        : 'border-gray-100 bg-gray-50 text-gray-300 line-through'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sp.in_stock ? 'bg-green-500' : 'bg-gray-300'}`} />
                    {sp.products?.name?.replace('Diet Coke - ', '').replace('Diet Coke ', '')}
                  </div>
                ))}
              </div>
              {store.store_products[0]?.last_verified_at && (
                <p className="text-xs text-gray-400 mt-2">
                  Last verified: {new Date(store.store_products[0].last_verified_at).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {store.store_hours && store.store_hours.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} className="text-[#E8192C]" />
                <h3 className="font-semibold text-sm text-[#1A1A1A]">Store Hours</h3>
              </div>
              <div className="space-y-1.5">
                {Array.from({ length: 7 }, (_, i) => i).map((day) => {
                  const hours = store.store_hours?.find((h) => h.day_of_week === day)
                  const isToday = day === today
                  return (
                    <div
                      key={day}
                      className={`flex justify-between text-sm py-0.5 ${isToday ? 'font-semibold' : ''}`}
                    >
                      <span className={isToday ? 'text-[#E8192C]' : 'text-gray-500'}>{DAY_NAMES[day]}</span>
                      <span className={isToday ? 'text-[#1A1A1A]' : 'text-gray-400'}>
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
