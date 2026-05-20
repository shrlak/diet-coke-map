import { Heart, Clock, ChevronRight } from 'lucide-react'
import type { Store, StoreHours } from '../types'
import StarRating from './StarRating'

function getOpenStatus(hours: StoreHours[] | undefined): { isOpen: boolean; label: string } {
  if (!hours || hours.length === 0) return { isOpen: false, label: 'Hours unavailable' }

  const now = new Date()
  const dayOfWeek = now.getDay()
  const currentTime = now.toTimeString().slice(0, 5)
  const todayHours = hours.find((h) => h.day_of_week === dayOfWeek)

  if (!todayHours || todayHours.is_closed) return { isOpen: false, label: 'Closed today' }

  const isOpen = currentTime >= todayHours.opens_at && currentTime <= todayHours.closes_at

  if (isOpen) return { isOpen: true, label: `Open until ${formatTime(todayHours.closes_at)}` }
  if (currentTime < todayHours.opens_at) return { isOpen: false, label: `Opens at ${formatTime(todayHours.opens_at)}` }
  return { isOpen: false, label: 'Closed for today' }
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHour = hours % 12 || 12
  return `${displayHour}${minutes === 0 ? '' : `:${String(minutes).padStart(2, '0')}`} ${period}`
}

function formatDistance(km: number): string {
  const miles = km * 0.621371
  return miles < 10 ? `${miles.toFixed(1)} mi` : `${Math.round(miles)} mi`
}

const STORE_TYPE_LABELS: Record<string, string> = {
  convenience: 'Convenience',
  grocery: 'Grocery',
  gas: 'Gas Station',
  drugstore: 'Drugstore',
  fast_food: 'Fast Food',
  restaurant: 'Restaurant',
  other: 'Other',
}

interface StoreCardProps {
  store: Store
  distance?: number
  isSelected?: boolean
  isFavorited?: boolean
  compact?: boolean
  avgRating?: number
  reviewCount?: number
  onSelect: (storeId: string) => void
  onFavorite?: (storeId: string) => void
}

export default function StoreCard({
  store,
  distance,
  isSelected,
  isFavorited,
  compact,
  avgRating,
  reviewCount,
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

  return (
    <div
      className={`rounded-xl p-4 cursor-pointer transition-all border ${
        isSelected
          ? 'border-[#E8192C] bg-red-50/50 shadow-sm'
          : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
      }`}
      onClick={() => onSelect(store.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[#1A1A1A] text-sm leading-tight truncate">{store.name}</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{store.address}, {store.city}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {distance !== undefined && (
            <span className="text-xs text-gray-400 font-medium">{formatDistance(distance)}</span>
          )}
          {onFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onFavorite(store.id)
              }}
              className={`p-1 rounded-full transition-colors ${isFavorited ? 'text-[#E8192C]' : 'text-gray-300 hover:text-[#E8192C]'}`}
              title={isFavorited ? 'Remove from favorites' : 'Save to favorites'}
            >
              <Heart size={15} fill={isFavorited ? '#E8192C' : 'none'} />
            </button>
          )}
          <ChevronRight size={14} className="text-gray-300" />
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className={`text-xs font-medium ${isOpen ? 'text-green-600' : 'text-gray-400'}`}>
            {isOpen ? 'Open' : 'Closed'}
          </span>
        </div>
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Clock size={11} />
          {label}
        </span>
        {store.store_type && (
          <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
            {STORE_TYPE_LABELS[store.store_type] || store.store_type}
          </span>
        )}
      </div>

      {avgRating !== undefined && avgRating > 0 && (
        <div className="mt-2 flex items-center gap-1.5">
          <StarRating value={Math.round(avgRating)} size={12} />
          <span className="text-xs text-gray-400">
            {avgRating.toFixed(1)}{reviewCount !== undefined && reviewCount > 0 && ` (${reviewCount})`}
          </span>
        </div>
      )}

      {store.store_products && store.store_products.filter((sp) => sp.in_stock).length > 0 && (
        <div className="mt-2.5 flex gap-1.5 flex-wrap">
          {store.store_products
            .filter((sp) => sp.in_stock)
            .slice(0, 3)
            .map((sp) => (
              <span
                key={sp.id}
                className="text-xs bg-red-50 text-[#E8192C] border border-red-100 px-2 py-0.5 rounded-full font-medium"
              >
                {sp.products?.name?.replace('Diet Coke - ', '').replace('Diet Coke ', '')}
              </span>
            ))}
          {store.store_products.filter((sp) => sp.in_stock).length > 3 && (
            <span className="text-xs text-gray-400 py-0.5">
              +{store.store_products.filter((sp) => sp.in_stock).length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  )
}
