import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { supabase, getFavoriteStores, getStoreReviews, getStockAlerts } from '../services/api'

export default function Profile() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({ favorites: 0, alerts: 0 })

  useEffect(() => {
    if (!user) return
    Promise.all([
      getFavoriteStores(user.id),
      getStockAlerts(user.id),
    ]).then(([favs, alerts]) => {
      setStats({ favorites: favs.data.length, alerts: alerts.data.length })
    })
  }, [user])

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <p className="text-gray-600 mb-4">You need to be logged in to view your profile.</p>
        <Link
          to="/login"
          className="bg-red-700 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-red-800 transition-colors"
        >
          Sign In
        </Link>
      </div>
    )
  }

  const handleLogout = async () => {
    setLoading(true)
    await logout()
    navigate('/')
  }

  const handlePasswordReset = async () => {
    if (!user?.email) return
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      setError(error.message)
    } else {
      setSuccess('Password reset email sent! Check your inbox.')
    }
    setLoading(false)
  }

  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

        {/* User Info */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-2xl font-bold text-red-700">
              {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user?.full_name || 'Diet Coke Fan'}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              {joinDate && (
                <p className="text-xs text-gray-400 mt-0.5">Member since {joinDate}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg px-4 py-3 text-center">
              <p className="text-2xl font-bold text-[#E8192C]">{stats.favorites}</p>
              <p className="text-xs text-gray-500 mt-0.5">Favorite Stores</p>
            </div>
            <div className="bg-gray-50 rounded-lg px-4 py-3 text-center">
              <p className="text-2xl font-bold text-[#E8192C]">{stats.alerts}</p>
              <p className="text-xs text-gray-500 mt-0.5">Active Alerts</p>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}
          {success && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>
          )}
        </div>

        {/* Quick Links */}
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 mb-4">
          <Link to="/favorites" className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors">
            <span className="text-sm font-medium text-gray-800">❤️ My Favorite Stores</span>
            <span className="text-gray-400 text-sm">→</span>
          </Link>
          <Link to="/alerts" className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors">
            <span className="text-sm font-medium text-gray-800">🔔 My Stock Alerts</span>
            {stats.alerts > 0 && (
              <span className="text-xs bg-[#E8192C] text-white rounded-full px-2 py-0.5">{stats.alerts}</span>
            )}
          </Link>
          <Link to="/" className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors">
            <span className="text-sm font-medium text-gray-800">🗺️ Find Stores</span>
            <span className="text-gray-400 text-sm">→</span>
          </Link>
        </div>

        {/* Account Actions */}
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 mb-4">
          <button
            onClick={handlePasswordReset}
            disabled={loading}
            className="flex items-center justify-between w-full px-4 py-3.5 hover:bg-gray-50 transition-colors text-left disabled:opacity-60"
          >
            <span className="text-sm text-gray-700">🔒 Change Password</span>
            <span className="text-gray-400 text-sm">→</span>
          </button>
        </div>

        <button
          onClick={handleLogout}
          disabled={loading}
          className="w-full border border-red-200 text-red-700 py-3 rounded-xl font-medium hover:bg-red-50 transition-colors disabled:opacity-60"
        >
          {loading ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    </div>
  )
}
