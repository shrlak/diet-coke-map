import { X, ExternalLink, Trash2, Route } from 'lucide-react'
import type { Store } from '../types'
import { calculateDistance } from '../services/api'

interface RoutePanelProps {
  stops: Store[]
  userLat?: number
  userLon?: number
  onRemoveStop: (storeId: string) => void
  onClose: () => void
}

function buildGoogleMapsUrl(stops: Store[]): string {
  if (stops.length === 0) return ''
  if (stops.length === 1) {
    const s = stops[0]
    const addr = encodeURIComponent(`${s.address}, ${s.city}, ${s.state}`)
    return `https://www.google.com/maps/dir/?api=1&destination=${addr}`
  }
  const origin = encodeURIComponent(`${stops[0].address}, ${stops[0].city}, ${stops[0].state}`)
  const destination = encodeURIComponent(
    `${stops[stops.length - 1].address}, ${stops[stops.length - 1].city}, ${stops[stops.length - 1].state}`
  )
  const waypoints = stops
    .slice(1, -1)
    .map((s) => encodeURIComponent(`${s.address}, ${s.city}, ${s.state}`))
    .join('|')
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}`
}

function totalDistance(stops: Store[]): number {
  let total = 0
  for (let i = 0; i < stops.length - 1; i++) {
    total += calculateDistance(stops[i].latitude, stops[i].longitude, stops[i + 1].latitude, stops[i + 1].longitude)
  }
  return total
}

export default function RoutePanel({ stops, onRemoveStop, onClose }: RoutePanelProps) {
  const mapsUrl = buildGoogleMapsUrl(stops)
  const distKm = stops.length >= 2 ? totalDistance(stops) : null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1500] bg-white border-t-2 border-purple-600 shadow-2xl rounded-t-xl max-h-[50vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Route size={16} className="text-purple-600" />
          <span className="font-bold text-sm text-[#1A1A1A]">
            Route Plan
            <span className="ml-2 text-xs font-normal text-gray-400">
              {stops.length} stop{stops.length !== 1 ? 's' : ''} · up to 5
            </span>
          </span>
          {distKm !== null && (
            <span className="ml-2 text-xs text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded-full">
              ~{(distKm * 0.621371).toFixed(1)} mi total
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
          <X size={16} />
        </button>
      </div>

      {/* Stops list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {stops.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            Tap stores on the map or list to add them to your route.
          </p>
        ) : (
          stops.map((store, idx) => (
            <div key={store.id} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1A1A1A] truncate">{store.name}</p>
                <p className="text-xs text-gray-400 truncate">{store.address}, {store.city}</p>
              </div>
              <button
                onClick={() => onRemoveStop(store.id)}
                className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 flex gap-2">
        <a
          href={mapsUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            stops.length >= 1
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-gray-100 text-gray-400 pointer-events-none'
          }`}
        >
          <ExternalLink size={14} />
          Open in Google Maps
        </a>
      </div>
    </div>
  )
}
