import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, BellOff, MapPin, CheckCircle } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { getEnrichedStockAlerts, removeStockAlert, type EnrichedStockAlert } from '../services/api'

export default function Alerts() {
  const { user, isAuthenticated } = useAuthStore()
  const [alerts, setAlerts] = useState<EnrichedStockAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    getEnrichedStockAlerts(user.id).then((data) => {
      setAlerts(data)
      setLoading(false)
    })
  }, [user])

  const handleRemove = async (alert: EnrichedStockAlert) => {
    if (!user) return
    await removeStockAlert(user.id, alert.store_id, alert.product_id)
    setAlerts((prev) => prev.filter((a) => a.id !== alert.id))
  }

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <Bell size={40} className="text-gray-300 mb-4" />
        <p className="text-gray-600 mb-4">Sign in to manage your stock alerts.</p>
        <Link
          to="/login"
          className="bg-[#E8192C] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#c8102e] transition-colors"
        >
          Sign In
        </Link>
      </div>
    )
  }

  // Group alerts by store
  const byStore = alerts.reduce<Record<string, EnrichedStockAlert[]>>((acc, alert) => {
    if (!acc[alert.store_id]) acc[alert.store_id] = []
    acc[alert.store_id].push(alert)
    return acc
  }, {})

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Alerts</h1>
          {alerts.length > 0 && (
            <span className="text-sm text-gray-400">{alerts.length} active</span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">Loading…</div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-16">
            <Bell size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="font-medium text-gray-500 mb-1">No active alerts</p>
            <p className="text-sm text-gray-400 mb-6">
              Open a store's details and tap the bell icon on an out-of-stock product to get notified when it returns.
            </p>
            <Link
              to="/"
              className="bg-[#E8192C] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#c8102e] transition-colors"
            >
              Find Stores
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.values(byStore).map((storeAlerts) => {
              const { store_name, store_address, store_id } = storeAlerts[0]
              return (
                <div key={store_id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  {/* Store header */}
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                    <MapPin size={13} className="text-[#E8192C] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#1A1A1A] truncate">{store_name}</p>
                      <p className="text-xs text-gray-400 truncate">{store_address}</p>
                    </div>
                    <Link
                      to={`/store/${store_id}`}
                      className="text-xs text-[#E8192C] hover:underline shrink-0"
                    >
                      View →
                    </Link>
                  </div>

                  {/* Alert rows */}
                  <div className="divide-y divide-gray-50">
                    {storeAlerts.map((alert) => (
                      <div key={alert.id} className="flex items-center gap-3 px-4 py-3">
                        {alert.in_stock ? (
                          <CheckCircle size={15} className="text-green-500 shrink-0" />
                        ) : (
                          <Bell size={15} className="text-[#E8192C] shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 truncate">{alert.product_name}</p>
                          {alert.in_stock && (
                            <p className="text-xs text-green-600 font-medium">Back in stock!</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemove(alert)}
                          title="Remove alert"
                          className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
                        >
                          <BellOff size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
