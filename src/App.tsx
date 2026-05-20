import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Favorites from './pages/Favorites'
import Profile from './pages/Profile'
import About from './pages/About'
import StorePage from './pages/StorePage'

const NotFound = () => (
  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
    <p className="text-6xl mb-4">🥤</p>
    <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
    <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
    <a href="/" className="bg-red-700 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-red-800 transition-colors">
      Find Stores
    </a>
  </div>
)

function App() {
  const { initialize, isAuthenticated, loading } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">🥤</p>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div className="flex flex-col h-screen">
        <Navbar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/about" element={<About />} />
            <Route path="/store/:id" element={<StorePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
