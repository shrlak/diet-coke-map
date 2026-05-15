import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Pages (to be created)
const Home = () => <div className="flex-1 p-4">Home Page</div>
const Login = () => <div className="flex-1 p-4">Login Page</div>
const NotFound = () => <div className="flex-1 p-4">404 - Not Found</div>

function App() {
  const { initialize, isAuthenticated } = useAuthStore()

  useEffect(() => {
    // Initialize authentication on app load
    initialize()
  }, [initialize])

  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen w-screen">
        {/* Header */}
        <header className="bg-diet-coke-red text-white py-4 px-4 shadow-md">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">Diet Coke Store Locator</h1>
            <nav className="flex gap-4">
              {isAuthenticated ? (
                <>
                  <a href="/" className="hover:text-red-100">Home</a>
                  <a href="/favorites" className="hover:text-red-100">Favorites</a>
                  <a href="/profile" className="hover:text-red-100">Profile</a>
                  <button className="hover:text-red-100">Logout</button>
                </>
              ) : (
                <a href="/login" className="hover:text-red-100">Login</a>
              )}
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-gray-100 text-center py-4 text-sm text-gray-600">
          <p>&copy; 2026 Diet Coke Store Locator. Built with React + Supabase.</p>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App
