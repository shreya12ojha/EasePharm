import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom"
import HomePage from "./pages/HomePage"
import UploadPage from "./pages/UploadPage"
import DashboardPage from "./pages/DashboardPage"
import { ToastProvider } from "./components/ui/toast"
import { Toaster } from "./components/ui/toaster"
import "./App.css"

function App() {
  return (
    <ToastProvider>
      <Router>
        <div className="App">
          {/* Navigation Bar */}
          <nav className="border-b bg-white shadow-sm">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
              <Link to="/" className="text-xl font-bold text-blue-600">
                PharmAssist AI
              </Link>
              <div className="space-x-4">
                <Link to="/upload" className="px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors">
                  Upload
                </Link>
                <Link to="/dashboard" className="px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors">
                  Dashboard
                </Link>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
            </Routes>
          </main>

          {/* Toast Notifications */}
          <Toaster />
        </div>
      </Router>
    </ToastProvider>
  )
}

export default App
