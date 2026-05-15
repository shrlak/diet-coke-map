import { useRef } from 'react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onSearch: (query: string) => void
  onGeolocate: () => void
  geoLoading?: boolean
  placeholder?: string
}

export default function SearchBar({
  value,
  onChange,
  onSearch,
  onGeolocate,
  geoLoading,
  placeholder = 'Search by city, zip, or address...',
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(value)
    }
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm bg-white"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      <button
        onClick={() => onSearch(value)}
        className="px-4 py-2.5 bg-red-700 text-white text-sm font-medium rounded-lg hover:bg-red-800 transition-colors shrink-0"
      >
        Search
      </button>

      <button
        onClick={onGeolocate}
        disabled={geoLoading}
        className="px-3 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60 shrink-0"
        title="Use my location"
      >
        {geoLoading ? '...' : '📍'}
      </button>
    </div>
  )
}
