import { Store, StoreHours } from '../types'

function getOpenStatus(hours: StoreHours[] | undefined): {
  isOpen: boolean
  label: string
} {
  if (!hours || hours.length === 0) return { isOpen: false, label: 'Hours unavailable' }

  const now = new Date()
  const dayOfWeek = now.getDay()
  const currentTime = now.toTimeString().slice(0, 5)

  const todayHours = hours.find((h) => h.day_of_week === dayOfWeek)

  if (!todayHours || todayHours.is_closed) {
    return { isOpen: false, label: 'Closed today' }
  }

  const isOpen = currentTime >= todayHours.opens_at && currentTime <= todayHours.closes_at

  if (isOpen) {
    return { isOpen: true, label: `Open until ${formatTime(todayHours.closes_at)}` }
  } else if (currentTime < todayHours.opens_at) {
    return { isOpen: false, label: `Opens at ${formatTime(todayHours.opens_at)}` }
  } else {
    return { isOpen: false, label: 'Closed for today' }
  }
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
  restaurant: 'Restaurant',
  other: 'Other',
}

interface StoreCardProps {
  store: Store
  distance?: number
  isSelected?: boolean
  isFavorited?: boolean
  onSelect: (storeId: string) => void
  onFavorite?: (storeId: string) => void
}

export default function StoreCard({
  store,
  distance,
  isSelected,
  isFavorited,
  onSelect,
  onFavorite,
}: StoreCardProps) {
  const { isOpen, label } = getOpenStatus(store.store_hours)

  return (
    <div
      className={`border rounded-xl p-4 cursor-pointer transition-all ${
        isSelected
          ? 'border-red-600 bg-red-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
      onClick={() => onSelect(store.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{store.name}</p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {store.address}, {store.city}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {distance !== undefined && (
            <span className="text-xs text-gray-500">{formatDistance(distance)}</span>
          )}
          {onFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onFavorite(store.id)
              }}
              className="text-lg leading-none"
              title={isFavorited ? 'Remove from favorites' : 'Save to favorites'}
            >
              {isFavorited ? '❤️' : '🤍'}
            </button>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {isOpen ? '● Open' : '○ Closed'}
        </span>
        <span className="text-xs text-gray-500">{label}</span>
        {store.store_type && (
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {STORE_TYPE_LABELS[store.store_type] || store.store_type}
          </span>
        )}
      </div>

      {/* Product badges */}
      {store.store_products && store.store_products.length > 0 && (
        <div className="mt-2 flex gap-1 flex-wrap">
          {store.store_products
            .filter((sp) => sp.in_stock)
            .slice(0, 3)
            .map((sp) => (
              <span
                key={sp.id}
                className="text-xs bg-red-50 text-red-700 border border-red-100 px-1.5 py-0.5 rounded"
              >
                {sp.products?.category === 'fountain' ? '🥤' : '🍾'}{' '}
                {sp.products?.name?.replace('Diet Coke - ', '').replace('Diet Coke ', '')}
              </span>
            ))}
          {store.store_products.filter((sp) => sp.in_stock).length > 3 && (
            <span className="text-xs text-gray-400 px-1">
              +{store.store_products.filter((sp) => sp.in_stock).length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  )
}
