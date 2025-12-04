import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import './App.css'
import VendorManagementView from './views/VendorManagementView'
import RFPCreationView from './views/RFPCreationView'
import RFPDashboard from './views/RFPDashboard'
import ProposalComparisonView from './views/ProposalComparisonView'

function Header() {
  return (
    <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white shadow-lg">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/10 backdrop-blur-sm p-2 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">RFP Management System</h1>
              <p className="text-blue-100 text-sm">AI-Powered Procurement Workflow</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">System Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function Navigation() {
  const location = useLocation()

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const navItems = [
    { path: '/', label: 'Vendors', icon: '👥' },
    { path: '/create-rfp', label: 'Create RFP', icon: '✨' },
    { path: '/rfp-dashboard', label: 'Dashboard', icon: '📊' }
  ]

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
      <div className="container mx-auto px-6">
        <div className="flex space-x-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`relative py-4 px-6 font-medium text-sm transition-all duration-200 ${
                isActive(item.path)
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {isActive(item.path) && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"></div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <Header />
        <Navigation />
        <main className="container mx-auto px-6 py-8 min-h-[calc(100vh-300px)]">
          <Routes>
            <Route path="/" element={<VendorManagementView />} />
            <Route path="/create-rfp" element={<RFPCreationView />} />
            <Route path="/rfp-dashboard" element={<RFPDashboard />} />
            <Route path="/rfp/:id/comparison" element={<ProposalComparisonView />} />
          </Routes>
        </main>
        <footer className="bg-white border-t border-gray-200 mt-16 backdrop-blur-sm bg-white/95">
          <div className="container mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 font-medium">© 2025 RFP Management System. Powered by AI.</p>
              </div>
              <div className="flex items-center space-x-6">
                <span className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  <span className="text-lg">⚡</span>
                  <span className="font-medium">Fast</span>
                </span>
                <span className="flex items-center space-x-2 text-sm text-gray-600 hover:text-green-600 transition-colors">
                  <span className="text-lg">🔒</span>
                  <span className="font-medium">Secure</span>
                </span>
                <span className="flex items-center space-x-2 text-sm text-gray-600 hover:text-purple-600 transition-colors">
                  <span className="text-lg">🤖</span>
                  <span className="font-medium">AI-Powered</span>
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  )
}

export default App
