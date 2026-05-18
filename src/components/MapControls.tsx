import type { MapLayer } from '../store/uiStore'

interface MapControlsProps {
  mapLayer: MapLayer
  onMapLayerChange: (layer: MapLayer) => void
  showTraffic: boolean
  onTrafficToggle: () => void
}

const LAYERS: { id: MapLayer; emoji: string; label: string }[] = [
  { id: 'street', emoji: '🌍', label: 'Street' },
  { id: 'dark', emoji: '🌑', label: 'Dark' },
  { id: 'satellite', emoji: '🛰', label: 'Sat' },
]

const trafficEnabled = Boolean(import.meta.env.VITE_TOMTOM_API_KEY)

export default function MapControls({
  mapLayer,
  onMapLayerChange,
  showTraffic,
  onTrafficToggle,
}: MapControlsProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-1.5 flex flex-col gap-1 w-[52px]">
      {/* Layer switcher */}
      <p className="text-[8px] uppercase tracking-wider text-gray-400 text-center pt-0.5">Style</p>
      {LAYERS.map(({ id, emoji, label }) => (
        <button
          key={id}
          onClick={() => onMapLayerChange(id)}
          title={label}
          className={`flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-xs transition-all ${
            mapLayer === id
              ? 'bg-blue-700 text-white'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <span className="text-base leading-none">{emoji}</span>
          <span className="text-[8px]">{label}</span>
        </button>
      ))}

      {/* Divider */}
      <div className="h-px bg-gray-100 mx-1" />

      {/* Traffic toggle */}
      <p className="text-[8px] uppercase tracking-wider text-gray-400 text-center">Traffic</p>
      <button
        onClick={onTrafficToggle}
        disabled={!trafficEnabled}
        title={
          trafficEnabled
            ? showTraffic ? 'Turn off traffic' : 'Turn on traffic'
            : 'Add VITE_TOMTOM_API_KEY to .env to enable live traffic'
        }
        className={`flex flex-col items-center gap-0.5 py-1.5 rounded-lg border-2 text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
          showTraffic && trafficEnabled
            ? 'border-[#E8192C] bg-red-50 text-[#E8192C]'
            : 'border-gray-200 text-gray-400 hover:border-gray-300'
        }`}
      >
        <span className="text-base leading-none">🚦</span>
        <span className="text-[8px] font-semibold">
          {showTraffic && trafficEnabled ? 'ON' : 'OFF'}
        </span>
      </button>
    </div>
  )
}
