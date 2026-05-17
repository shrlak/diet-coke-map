import { useRef } from 'react'
import { Search, MapPin, X } from 'lucide-react'

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
  placeholder = 'Search Pittsburgh by address, zip, or neighborhood...',
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
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8192C]/30 focus:border-[#E8192C] text-sm bg-white transition-all"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <button
        onClick={() => onSearch(value)}
        className="px-4 py-2.5 bg-[#E8192C] text-white text-sm font-semibold rounded-lg hover:bg-[#c8102e] transition-colors shrink-0"
      >
        Search
      </button>

      <button
        onClick={onGeolocate}
        disabled={geoLoading}
        className="px-3 py-2.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-[#E8192C] hover:border-[#E8192C]/40 transition-all disabled:opacity-50 shrink-0"
        title="Use my location"
      >
        {geoLoading ? (
          <span className="block w-4 h-4 border-2 border-gray-200 border-t-[#E8192C] rounded-full animate-spin" />
        ) : (
          <MapPin size={16} />
        )}
      </button>
    </div>
  )
}
