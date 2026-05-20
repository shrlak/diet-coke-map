import { lazy, Suspense, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { getStoreById } from '../services/api'
import StoreDetailsModal from '../components/StoreDetailsModal'
import type { Store } from '../types'

const Map = lazy(() => import('../components/Map'))

export default function StorePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return }
    getStoreById(id).then(({ data }) => {
      if (!data) setNotFound(true)
      else setStore(data)
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">🥤</p>
          <p className="text-gray-500 text-sm">Loading store…</p>
        </div>
      </div>
    )
  }

  if (notFound || !store) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <p className="text-5xl mb-4">🥤</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Store not found</h1>
        <p className="text-gray-500 text-sm mb-6">This store doesn't exist or may have been removed.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-[#E8192C] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#c8102e] transition-colors"
        >
          Find Stores
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* Mini breadcrumb */}
      <div className="bg-[#E8192C] px-4 py-2.5 flex items-center gap-2">
        <button onClick={() => navigate('/')} className="text-white/80 hover:text-white text-sm flex items-center gap-1.5 transition-colors">
          <MapPin size={14} />
          All Stores
        </button>
        <span className="text-white/40 text-sm">›</span>
        <span className="text-white text-sm font-medium truncate">{store.name}</span>
      </div>

      {/* Map centered on this store */}
      <div className="flex-1 relative overflow-hidden">
        <Suspense fallback={<div className="flex-1 flex items-center justify-center bg-gray-100 h-full">Loading map…</div>}>
          <Map
            stores={[store]}
            selectedStoreId={store.id}
            center={[store.latitude, store.longitude]}
            zoom={15}
            mapLayer="street"
            showTraffic={false}
            showHeatmap={false}
            onStoreSelect={() => {}}
            onMapLayerChange={() => {}}
            onTrafficToggle={() => {}}
            onHeatmapToggle={() => {}}
            onGeolocate={() => {}}
          />
        </Suspense>
      </div>

      {/* Details modal — always open, not closeable in a way that leaves the page blank */}
      <StoreDetailsModal
        store={store}
        onClose={() => navigate('/')}
      />
    </div>
  )
}
