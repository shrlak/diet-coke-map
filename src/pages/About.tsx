import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <span className="text-6xl">🥤</span>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">About Diet Coke Locator</h1>
          <p className="mt-2 text-gray-600">Find your favorite Diet Coke, wherever you are</p>
        </div>

        <div className="space-y-6 text-gray-700">
          <div className="bg-red-50 border border-red-100 rounded-xl p-5">
            <h2 className="font-bold text-red-800 text-lg mb-2">What We Do</h2>
            <p className="text-sm leading-relaxed">
              Diet Coke Locator helps Diet Coke enthusiasts find their favorite beverage at nearby
              stores. We track which stores carry Diet Coke products — 20oz bottles, 2L bottles,
              fountain drinks, and more — so you never have to search blindly again.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <h2 className="font-bold text-gray-800 text-lg">Features</h2>
            <ul className="space-y-3 text-sm">
              {[
                ['🗺️', 'Interactive map with store locations across the US'],
                ['🔍', 'Search by address, city, or zip code'],
                ['📍', 'Geolocation-based nearby store search'],
                ['🕐', 'Real-time store hours and open/closed status'],
                ['🥤', 'Filter by available Diet Coke product types'],
                ['❤️', 'Save favorite stores to your account'],
                ['📱', 'Mobile-friendly, works on any device'],
              ].map(([icon, text]) => (
                <li key={text as string} className="flex items-start gap-3">
                  <span className="text-lg shrink-0">{icon}</span>
                  <span className="text-gray-600">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-bold text-gray-800 text-lg mb-2">Current Coverage</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              We are currently in beta, covering stores in <strong>Pennsylvania</strong>. We are
              actively working to expand coverage to other states. If you know of stores we should
              add, please reach out!
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              {[
                ['🏙️', 'Philadelphia Metro'],
                ['🏙️', 'Pittsburgh Metro'],
                ['🏘️', 'Harrisburg Area'],
                ['🏘️', 'Allentown Area'],
              ].map(([icon, city]) => (
                <div key={city as string} className="flex items-center gap-2 text-gray-600">
                  <span>{icon}</span>
                  <span>{city}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-bold text-gray-800 text-lg mb-2">Data Accuracy</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Store information is manually verified and kept up to date. Product availability is
              shown with a "last verified" date. If you notice outdated information, please let us
              know — your feedback helps us improve!
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-bold text-gray-800 text-lg mb-2">Contact Us</h2>
            <p className="text-sm text-gray-600">
              Have questions, suggestions, or want to report incorrect store information?
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Open an issue on GitHub or reach out via email.
            </p>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link
            to="/"
            className="bg-red-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-800 transition-colors"
          >
            Start Finding Stores
          </Link>
        </div>
      </div>
    </div>
  )
}
