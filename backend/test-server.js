const express = require("express")
const cors = require("cors")

const app = express()
const PORT = 5000

app.use(cors())
app.use(express.json())

// Simple test endpoint
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Backend server is working!",
    timestamp: new Date().toISOString(),
  })
})

// Test OCR endpoint without file upload
app.post("/api/test-ocr", (req, res) => {
  res.json({
    success: true,
    text: "This is a test response from OCR API",
    method: "Test Mode",
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`)
  console.log(`📋 Test endpoint: http://localhost:${PORT}/api/test`)
})
