import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Store } from '../types'

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

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
  userLocation?: { latitude: number; longitude: number } | null
  center: [number, number]
  zoom: number
  onStoreSelect: (storeId: string) => void
}

const tomtomKey = import.meta.env.VITE_TOMTOM_KEY as string | undefined

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
      {/* CartoDB Positron – clean, minimal basemap */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={19}
      />

      {/* TomTom live traffic flow overlay (requires VITE_TOMTOM_KEY) */}
      {tomtomKey && (
        <TileLayer
          url={`https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${tomtomKey}&tileSize=256`}
          attribution='Traffic &copy; <a href="https://www.tomtom.com">TomTom</a>'
          opacity={0.7}
          maxZoom={19}
        />
      )}

      <MapController center={center} zoom={zoom} />

      {userLocation && (
        <Marker
          position={[userLocation.latitude, userLocation.longitude]}
          icon={userIcon}
        />
      )}

      {stores.map((store) => (
        <Marker
          key={store.id}
          position={[store.latitude, store.longitude]}
          icon={store.id === selectedStoreId ? selectedStoreIcon : storeIcon}
          eventHandlers={{
            click: () => onStoreSelect(store.id),
          }}
        />
      ))}
    </MapContainer>
  )
}
