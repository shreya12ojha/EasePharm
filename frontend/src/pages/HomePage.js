import { Link } from "react-router-dom"
import "./HomePage.css"

const HomePage = () => {
  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="container">
          <h1 className="hero-title">EasePharm💊</h1>
          <p className="hero-subtitle">
            Automatically process handwritten prescriptions and match them against patient orders using AI
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📤</div>
              <h3>Upload</h3>
              <p>Upload prescription images</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Extract</h3>
              <p>AI extracts text from handwriting</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Match</h3>
              <p>Match against patient records</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📦</div>
              <h3>Generate</h3>
              <p>Auto-create pharmacy orders</p>
            </div>
          </div>

          <div className="cta-buttons">
            <Link to="/upload" className="btn btn-primary btn-large">
              📤 Upload Prescription
            </Link>
            <Link to="/dashboard" className="btn btn-secondary btn-large">
              📊 View Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
