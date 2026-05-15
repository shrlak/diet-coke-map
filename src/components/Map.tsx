import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Store } from '../types'

// Fix Leaflet default icon issue with bundlers
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Diet Coke red marker icon
const storeIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 28px;
    height: 28px;
    background: #b91c1c;
    border: 3px solid white;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 2px 2px 6px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -30],
})

const selectedStoreIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 34px;
    height: 34px;
    background: #dc2626;
    border: 3px solid white;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 0 0 4px rgba(220,38,38,0.3), 2px 2px 8px rgba(0,0,0,0.5);
  "></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -36],
})

const userIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 20px;
    height: 20px;
    background: #2563eb;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 0 0 4px rgba(37,99,235,0.3);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

// Component to re-center map when location changes
function MapController({
  center,
  zoom,
}: {
  center: [number, number]
  zoom: number
}) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [map, center, zoom])
  return null
}

interface MapProps {
  stores: Store[]
  selectedStoreId?: string | null
  userLocation?: { latitude: number; longitude: number } | null
  center: [number, number]
  zoom: number
  onStoreSelect: (storeId: string) => void
}

export default function Map({
  stores,
  selectedStoreId,
  userLocation,
  center,
  zoom,
  onStoreSelect,
}: MapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      {/* Map tiles from OpenStreetMap (free, no API key needed) */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Update map center when props change */}
      <MapController center={center} zoom={zoom} />

      {/* User location marker */}
      {userLocation && (
        <Marker
          position={[userLocation.latitude, userLocation.longitude]}
          icon={userIcon}
        >
          <Popup>
            <div className="text-sm font-medium">📍 Your Location</div>
          </Popup>
        </Marker>
      )}

      {/* Store markers */}
      {stores.map((store) => (
        <Marker
          key={store.id}
          position={[store.latitude, store.longitude]}
          icon={store.id === selectedStoreId ? selectedStoreIcon : storeIcon}
          eventHandlers={{
            click: () => onStoreSelect(store.id),
          }}
        >
          <Popup>
            <div className="min-w-[160px]">
              <p className="font-semibold text-sm">{store.name}</p>
              <p className="text-xs text-gray-500 mt-1">{store.address}</p>
              <p className="text-xs text-gray-500">{store.city}, {store.state} {store.zip}</p>
              <button
                onClick={() => onStoreSelect(store.id)}
                className="mt-2 text-xs text-red-700 font-semibold hover:underline block"
              >
                View Details →
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
