import { useFilterStore } from '../store/filterStore'

const RADIUS_OPTIONS = [5, 10, 25, 50]

const PRODUCT_OPTIONS = [
  { id: 'DC_20OZ_BOTTLE', label: '20oz Bottle' },
  { id: 'DC_2L_BOTTLE', label: '2L Bottle' },
  { id: 'DC_6PACK_12OZ', label: '6-Pack' },
  { id: 'DC_12PACK_12OZ', label: '12-Pack' },
  { id: 'DC_FOUNTAIN', label: 'Fountain' },
]

const STORE_TYPE_OPTIONS = [
  { id: '', label: 'All Types' },
  { id: 'convenience', label: 'Convenience' },
  { id: 'grocery', label: 'Grocery' },
  { id: 'gas', label: 'Gas Station' },
  { id: 'drugstore', label: 'Drugstore' },
]

interface FilterPanelProps {
  isOpen: boolean
  onClose: () => void
  resultCount: number
}

export default function FilterPanel({ isOpen, onClose, resultCount }: FilterPanelProps) {
  const { filters, setRadius, setProductFilter, setFilters, resetFilters } = useFilterStore()

  if (!isOpen) return null

  const radiusKm = filters.radiusKm ?? 25
  const radiusMiles = Math.round(radiusKm * 0.621371)
  const activeProductIds = filters.productIds ?? []

  const toggleProduct = (productId: string) => {
    if (activeProductIds.includes(productId)) {
      setProductFilter(activeProductIds.filter((id) => id !== productId))
    } else {
      setProductFilter([...activeProductIds, productId])
    }
  }

  const hasActiveFilters =
    (filters.productIds?.length ?? 0) > 0 ||
    (filters.storeType && filters.storeType !== '') ||
    radiusKm !== 25

  return (
    <>
      {/* Backdrop (mobile) */}
      <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={onClose} />

      {/* Panel */}
      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-40 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Filters</h3>
          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs text-red-600 hover:underline"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Radius */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Search Radius: <span className="text-red-700">{radiusMiles} miles</span>
            </p>
            <div className="flex gap-2">
              {RADIUS_OPTIONS.map((km) => (
                <button
                  key={km}
                  onClick={() => setRadius(km)}
                  className={`flex-1 py-1.5 rounded-lg border text-sm transition-colors ${
                    radiusKm === km
                      ? 'border-red-600 bg-red-50 text-red-700 font-semibold'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {Math.round(km * 0.621371)} mi
                </button>
              ))}
            </div>
          </div>

          {/* Product Types */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Diet Coke Type</p>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_OPTIONS.map((product) => {
                const active = activeProductIds.includes(product.id)
                return (
                  <button
                    key={product.id}
                    onClick={() => toggleProduct(product.id)}
                    className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                      active
                        ? 'border-red-600 bg-red-50 text-red-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {active ? '✓ ' : ''}{product.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Store Type */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Store Type</p>
            <div className="flex flex-wrap gap-2">
              {STORE_TYPE_OPTIONS.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setFilters({ storeType: type.id || undefined })}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                    (filters.storeType ?? '') === type.id
                      ? 'border-red-600 bg-red-50 text-red-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">{resultCount} stores found</p>
          <button
            onClick={onClose}
            className="bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-800 transition-colors"
          >
            Show Results
          </button>
        </div>
      </div>
    </>
  )
}
