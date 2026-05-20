import { useFilterStore } from '../store/uiStore'

const RADIUS_OPTIONS = [
  { km: 5, label: '3 mi' },
  { km: 10, label: '6 mi' },
  { km: 25, label: '15 mi' },
  { km: 50, label: '31 mi' },
]

const PRODUCT_OPTIONS = [
  { id: 'DC_20OZ_BOTTLE', label: '20oz Bottle' },
  { id: 'DC_2L_BOTTLE', label: '2L Bottle' },
  { id: 'DC_6PACK_12OZ', label: '6-Pack' },
  { id: 'DC_12PACK_12OZ', label: '12-Pack' },
  { id: 'DC_24PACK_12OZ', label: '24-Pack' },
  { id: 'DC_30PACK_12OZ', label: '30-Pack' },
  { id: 'DC_8PACK_MINI', label: 'Mini 8-Pack' },
  { id: 'DC_FOUNTAIN', label: 'Fountain' },
  { id: 'DC_FEISTY_CHERRY_20OZ', label: 'Feisty Cherry' },
  { id: 'DC_GINGER_LIME_20OZ', label: 'Ginger Lime' },
  { id: 'DC_TWISTED_MANGO_20OZ', label: 'Twisted Mango' },
  { id: 'DCZS_20OZ_BOTTLE', label: 'Zero Sugar 20oz' },
  { id: 'DCZS_2L_BOTTLE', label: 'Zero Sugar 2L' },
  { id: 'DCZS_12PACK_12OZ', label: 'Zero Sugar 12-Pack' },
  { id: 'DC_CAFFEINE_FREE_20OZ', label: 'Caffeine Free 20oz' },
  { id: 'DC_CAFFEINE_FREE_2L', label: 'Caffeine Free 2L' },
  { id: 'DC_CAFFEINE_FREE_12PACK', label: 'Caffeine Free 12-Pack' },
  { id: 'DC_CHERRY_20OZ', label: 'Cherry 20oz' },
  { id: 'DC_VANILLA_20OZ', label: 'Vanilla 20oz' },
  { id: 'DC_LIME_20OZ', label: 'Lime 20oz' },
  { id: 'DC_16OZ_BOTTLE', label: '16oz Bottle' },
]

const STORE_TYPE_OPTIONS = [
  { id: '', label: 'All' },
  { id: 'convenience', label: 'Convenience' },
  { id: 'grocery', label: 'Grocery' },
  { id: 'gas', label: 'Gas Station' },
  { id: 'drugstore', label: 'Drugstore' },
  { id: 'fast_food', label: 'Fast Food' },
]

interface FilterPanelProps {
  isOpen: boolean
  onClose: () => void
  resultCount: number
}

export default function FilterPanel({ isOpen, onClose, resultCount }: FilterPanelProps) {
  const { filters, sortBy, setRadius, setProductFilter, setFilters, setSortBy, resetFilters } =
    useFilterStore()

  const radiusKm = filters.radiusKm ?? 25
  const activeProductIds = filters.productIds ?? []

  const toggleProduct = (productId: string) => {
    if (activeProductIds.includes(productId)) {
      setProductFilter(activeProductIds.filter((id) => id !== productId))
    } else {
      setProductFilter([...activeProductIds, productId])
    }
  }

  const hasActiveFilters =
    activeProductIds.length > 0 ||
    Boolean(filters.storeType && filters.storeType !== '') ||
    radiusKm !== 25

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-[2000] transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[2001] bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-[#1A1A1A]">Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-[#E8192C] font-medium hover:underline"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Radius + Sort By — 2-column grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Radius
              </p>
              <div className="flex gap-1.5">
                {RADIUS_OPTIONS.map(({ km, label }) => (
                  <button
                    key={km}
                    onClick={() => setRadius(km)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      radiusKm === km
                        ? 'border-[#E8192C] bg-red-50 text-[#E8192C]'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Sort By
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setSortBy('distance')}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    sortBy === 'distance'
                      ? 'border-[#E8192C] bg-red-50 text-[#E8192C]'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  📍 Near me
                </button>
                <button
                  onClick={() => setSortBy('name')}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    sortBy === 'name'
                      ? 'border-[#E8192C] bg-red-50 text-[#E8192C]'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  A–Z Name
                </button>
              </div>
            </div>
          </div>

          {/* Diet Coke Type */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Diet Coke Type
            </p>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_OPTIONS.map((product) => {
                const active = activeProductIds.includes(product.id)
                return (
                  <button
                    key={product.id}
                    onClick={() => toggleProduct(product.id)}
                    className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                      active
                        ? 'border-[#E8192C] bg-red-50 text-[#E8192C]'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {active && '✓ '}{product.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Store Type */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Store Type
            </p>
            <div className="flex flex-wrap gap-2">
              {STORE_TYPE_OPTIONS.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setFilters({ storeType: type.id || undefined })}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                    (filters.storeType ?? '') === type.id
                      ? 'border-[#E8192C] bg-red-50 text-[#E8192C]'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-6 pt-2 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full bg-[#E8192C] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#c8102e] transition-colors"
          >
            Show {resultCount} Results
          </button>
        </div>
      </div>
    </>
  )
}
