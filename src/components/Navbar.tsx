import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { signOut } from '../services/api'
import { Menu, X, MapPin, Heart, User, LogOut, LogIn, PlusCircle, Bell } from 'lucide-react'
import SuggestStoreModal from './SuggestStoreModal'

export default function Navbar() {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [suggestOpen, setSuggestOpen] = useState(false)

  const handleLogout = async () => {
    await signOut()
    navigate('/')
    setMenuOpen(false)
  }

  return (
    <>
      <header className="bg-[#1A1A1A] text-white">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#E8192C] flex items-center justify-center shrink-0">
              <span className="text-white text-[10px] font-black tracking-tight">DC</span>
            </div>
            <span className="font-bold text-sm tracking-tight">
              Diet Coke <span className="text-[#E8192C]">Locator</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-5 text-sm">
            <Link to="/" className="text-gray-300 hover:text-white transition-colors flex items-center gap-1.5">
              <MapPin size={14} />
              Find Stores
            </Link>
            <button
              onClick={() => setSuggestOpen(true)}
              className="text-gray-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <PlusCircle size={14} />
              Suggest a Store
            </button>
            {isAuthenticated && (
              <Link to="/favorites" className="text-gray-300 hover:text-white transition-colors flex items-center gap-1.5">
                <Heart size={14} />
                Favorites
              </Link>
            )}
            {isAuthenticated && (
              <Link to="/alerts" className="text-gray-300 hover:text-white transition-colors flex items-center gap-1.5">
                <Bell size={14} />
                Alerts
              </Link>
            )}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link to="/profile" className="text-gray-300 hover:text-white transition-colors flex items-center gap-1.5">
                  <User size={14} />
                  {user?.full_name || user?.email?.split('@')[0] || 'Profile'}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 bg-[#E8192C] hover:bg-[#c8102e] text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  <LogOut size={13} />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 bg-[#E8192C] hover:bg-[#c8102e] text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              >
                <LogIn size={13} />
                Login
              </Link>
            )}
          </nav>

          <button
            className="md:hidden text-gray-300 hover:text-white p-1"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-white/10 px-4 py-3 flex flex-col gap-1 text-sm bg-[#1A1A1A]">
            <Link to="/" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 py-2">
              <MapPin size={15} /> Find Stores
            </Link>
            <button
              onClick={() => { setMenuOpen(false); setSuggestOpen(true) }}
              className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 py-2 text-left"
            >
              <PlusCircle size={15} /> Suggest a Store
            </button>
            {isAuthenticated && (
              <Link to="/favorites" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 py-2">
                <Heart size={15} /> Favorites
              </Link>
            )}
            {isAuthenticated && (
              <Link to="/alerts" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 py-2">
                <Bell size={15} /> Alerts
              </Link>
            )}
            {isAuthenticated ? (
              <>
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 py-2">
                  <User size={15} /> Profile
                </Link>
                <button onClick={handleLogout} className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 py-2 text-left">
                  <LogOut size={15} /> Logout
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 py-2">
                <LogIn size={15} /> Login
              </Link>
            )}
          </div>
        )}
      </header>

      {suggestOpen && <SuggestStoreModal onClose={() => setSuggestOpen(false)} />}
    </>
  )
}
