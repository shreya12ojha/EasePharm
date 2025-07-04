import { Link } from "react-router-dom"
import { Upload, FileText, Users, Package } from "lucide-react"

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Pharmacist's AI Assistant</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Automatically process handwritten prescriptions and match them against patient orders using AI
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg border shadow-sm p-6 text-center">
            <Upload className="h-12 w-12 text-blue-600 mx-auto mb-2" />
            <h3 className="text-lg font-semibold mb-2">Upload</h3>
            <p className="text-sm text-gray-600">Upload prescription images</p>
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-6 text-center">
            <FileText className="h-12 w-12 text-green-600 mx-auto mb-2" />
            <h3 className="text-lg font-semibold mb-2">Extract</h3>
            <p className="text-sm text-gray-600">AI extracts text from handwriting</p>
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-6 text-center">
            <Users className="h-12 w-12 text-purple-600 mx-auto mb-2" />
            <h3 className="text-lg font-semibold mb-2">Match</h3>
            <p className="text-sm text-gray-600">Match against patient records</p>
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-6 text-center">
            <Package className="h-12 w-12 text-orange-600 mx-auto mb-2" />
            <h3 className="text-lg font-semibold mb-2">Generate</h3>
            <p className="text-sm text-gray-600">Auto-create pharmacy orders</p>
          </div>
        </div>

        <div className="text-center space-x-4">
          <Link
            to="/upload"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upload Prescription
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            View Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

export default HomePage
