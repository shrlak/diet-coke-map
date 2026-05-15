import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { signOut } from '../services/supabase'

export default function Navbar() {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await signOut()
    navigate('/')
    setMenuOpen(false)
  }

  return (
    <header className="bg-red-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl hover:text-red-100 transition-colors">
          <span className="text-2xl">🥤</span>
          <span className="hidden sm:block">Diet Coke Locator</span>
          <span className="sm:hidden">DCL</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="hover:text-red-100 transition-colors">Find Stores</Link>
          {isAuthenticated && (
            <Link to="/favorites" className="hover:text-red-100 transition-colors">Favorites</Link>
          )}
          <Link to="/about" className="hover:text-red-100 transition-colors">About</Link>
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link to="/profile" className="hover:text-red-100 transition-colors">
                {user?.full_name || user?.email?.split('@')[0] || 'Profile'}
              </Link>
              <button
                onClick={handleLogout}
                className="bg-white text-red-700 px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-red-50 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="bg-white text-red-700 px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-red-50 transition-colors"
            >
              Login
            </Link>
          )}
        </nav>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <div className="w-6 h-0.5 bg-white mb-1.5" />
          <div className="w-6 h-0.5 bg-white mb-1.5" />
          <div className="w-6 h-0.5 bg-white" />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-red-600 px-4 py-3 flex flex-col gap-3 text-sm">
          <Link to="/" onClick={() => setMenuOpen(false)} className="hover:text-red-100">Find Stores</Link>
          {isAuthenticated && (
            <Link to="/favorites" onClick={() => setMenuOpen(false)} className="hover:text-red-100">Favorites</Link>
          )}
          <Link to="/about" onClick={() => setMenuOpen(false)} className="hover:text-red-100">About</Link>
          {isAuthenticated ? (
            <>
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="hover:text-red-100">Profile</Link>
              <button onClick={handleLogout} className="text-left hover:text-red-100">Logout</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)} className="hover:text-red-100">Login</Link>
          )}
        </div>
      )}
    </header>
  )
}
