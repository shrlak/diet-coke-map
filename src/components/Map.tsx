import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Store, UserLocation } from '../types'
import type { MapLayer } from '../store/mapStore'
import MapControls from './MapControls'

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const storeIcon = L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;background:#E8192C;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:2px 2px 6px rgba(0,0,0,0.4);"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -30],
})

const selectedStoreIcon = L.divIcon({
  className: '',
  html: `<div style="width:34px;height:34px;background:#E8192C;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 0 0 4px rgba(232,25,44,0.3),2px 2px 8px rgba(0,0,0,0.5);"></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -36],
})

const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:16px;height:16px;background:#2563eb;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(37,99,235,0.2);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const TILE_CONFIGS: Record<MapLayer, { url: string; attribution: string; maxZoom?: number }> = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 18,
  },
}

const TRAFFIC_URL = 'https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png'
const trafficKey = import.meta.env.VITE_TOMTOM_API_KEY as string | undefined

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
  userLocation?: UserLocation | null
  center: [number, number]
  zoom: number
  mapLayer: MapLayer
  showTraffic: boolean
  onStoreSelect: (storeId: string) => void
  onMapLayerChange: (layer: MapLayer) => void
  onTrafficToggle: () => void
  onGeolocate: () => void
  geoLoading?: boolean
}

export default function Map({
  stores,
  selectedStoreId,
  userLocation,
  center,
  zoom,
  mapLayer,
  showTraffic,
  onStoreSelect,
  onMapLayerChange,
  onTrafficToggle,
  onGeolocate,
  geoLoading,
}: MapProps) {
  const tileConfig = TILE_CONFIGS[mapLayer]

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={false}
      >
        {/* Base tile layer — key forces remount on layer change */}
        <TileLayer
          key={mapLayer}
          url={tileConfig.url}
          attribution={tileConfig.attribution}
          maxZoom={tileConfig.maxZoom ?? 19}
        />

        {/* Traffic overlay */}
        {showTraffic && trafficKey && (
          <TileLayer
            url={`${TRAFFIC_URL}?key=${trafficKey}`}
            attribution="&copy; TomTom"
            opacity={0.7}
          />
        )}

        <MapController center={center} zoom={zoom} />

        {/* User location marker + accuracy circle */}
        {userLocation && (
          <>
            {userLocation.accuracy && (
              <Circle
                center={[userLocation.latitude, userLocation.longitude]}
                radius={userLocation.accuracy}
                pathOptions={{
                  fillColor: '#2563eb',
                  fillOpacity: 0.1,
                  color: '#2563eb',
                  opacity: 0.3,
                  weight: 1,
                }}
              />
            )}
            <Marker
              position={[userLocation.latitude, userLocation.longitude]}
              icon={userIcon}
            >
              <Popup>
                <div className="text-sm font-medium">📍 Your Location</div>
                {userLocation.accuracy && (
                  <div className="text-xs text-gray-500">±{Math.round(userLocation.accuracy)}m accuracy</div>
                )}
              </Popup>
            </Marker>
          </>
        )}

        {/* Store markers — clicking opens StoreDetailsModal directly */}
        {stores.map((store) => (
          <Marker
            key={store.id}
            position={[store.latitude, store.longitude]}
            icon={store.id === selectedStoreId ? selectedStoreIcon : storeIcon}
            eventHandlers={{ click: () => onStoreSelect(store.id) }}
          />
        ))}
      </MapContainer>

      {/* Floating layer + traffic controls (top-right) */}
      <div className="absolute top-3 right-3 z-[1000]">
        <MapControls
          mapLayer={mapLayer}
          onMapLayerChange={onMapLayerChange}
          showTraffic={showTraffic}
          onTrafficToggle={onTrafficToggle}
        />
      </div>

      {/* Locate me button (bottom-right) */}
      <button
        onClick={onGeolocate}
        disabled={geoLoading}
        title="Use my location"
        className="absolute bottom-3 right-3 z-[1000] bg-white rounded-xl shadow-lg border border-gray-100 w-11 h-11 flex items-center justify-center text-gray-600 hover:text-[#E8192C] hover:border-[#E8192C]/30 transition-all disabled:opacity-50"
      >
        {geoLoading ? (
          <span className="block w-4 h-4 border-2 border-gray-200 border-t-[#E8192C] rounded-full animate-spin" />
        ) : (
          <span className="text-base">📍</span>
        )}
      </button>
    </div>
  )
}
