const express = require("express")
const cors = require("cors")
const multer = require("multer")
const FormData = require("form-data")
const axios = require("axios")
require("dotenv").config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  }),
)
app.use(express.json({ limit: "50mb" }))

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Only image files are allowed!"), false)
    }
  },
})

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Pharmacy Assistant API is running",
    timestamp: new Date().toISOString(),
    apis: {
      ocrSpace: !!process.env.OCR_SPACE_API_KEY,
      port: PORT,
    },
  })
})

// OCR endpoint using OCR.space API
app.post("/api/ocr", upload.single("image"), async (req, res) => {
  console.log("📸 OCR request received")

  try {
    if (!req.file) {
      console.log("❌ No file provided")
      return res.status(400).json({
        success: false,
        error: "No image file provided",
      })
    }

    console.log("📁 File details:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    })

    // Convert buffer to base64
    const base64Image = req.file.buffer.toString("base64")
    const imageDataUrl = `data:${req.file.mimetype};base64,${base64Image}`

    // Try OCR.space API first
    if (process.env.OCR_SPACE_API_KEY) {
      console.log("🔑 Using OCR.space API")

      try {
        const formData = new FormData()
        formData.append("base64Image", imageDataUrl)
        formData.append("language", "eng")
        formData.append("isOverlayRequired", "false")
        formData.append("detectOrientation", "false")
        formData.append("scale", "true")
        formData.append("OCREngine", "2")

        const ocrResponse = await axios.post("https://api.ocr.space/parse/image", formData, {
          headers: {
            apikey: process.env.OCR_SPACE_API_KEY,
            ...formData.getHeaders(),
          },
          timeout: 30000,
        })

        console.log("📋 OCR.space response status:", ocrResponse.status)
        const ocrData = ocrResponse.data

        if (ocrData.ParsedResults && ocrData.ParsedResults[0] && ocrData.ParsedResults[0].ParsedText) {
          const extractedText = ocrData.ParsedResults[0].ParsedText.trim()
          console.log("✅ Text extracted successfully:", extractedText.substring(0, 100) + "...")

          return res.json({
            success: true,
            text: extractedText,
            method: "OCR.space API",
            confidence: "High",
          })
        } else {
          console.log("⚠️ OCR.space returned no text")
        }
      } catch (ocrError) {
        console.error("❌ OCR.space API error:", ocrError.response?.data || ocrError.message)
      }
    }

    // Fallback: return image for client-side processing
    console.log("🔄 Falling back to client-side OCR")
    return res.json({
      success: true,
      imageData: imageDataUrl,
      method: "client-side",
      message: "Using client-side OCR processing",
    })
  } catch (error) {
    console.error("💥 Server error:", error)
    return res.status(500).json({
      success: false,
      error: "Internal server error: " + error.message,
    })
  }
})

// Orders endpoint
app.post("/api/orders", (req, res) => {
  console.log("📝 Order creation request")

  try {
    const { prescriptionText } = req.body

    if (!prescriptionText) {
      return res.status(400).json({
        success: false,
        error: "No prescription text provided",
      })
    }

    // Simple parsing
    const lines = prescriptionText.split("\n").filter((line) => line.trim())
    const patientName =
      lines
        .find((line) => line.toLowerCase().includes("patient") || line.toLowerCase().includes("name"))
        ?.replace(/patient:?|name:?/gi, "")
        .trim() || "Unknown Patient"

    const medication =
      lines
        .find(
          (line) =>
            line.includes("mg") || line.toLowerCase().includes("rx") || line.toLowerCase().includes("medication"),
        )
        ?.replace(/rx:?|medication:?/gi, "")
        .trim() || "Unknown Medication"

    const orderId = `ORD-${Date.now().toString().slice(-6)}`

    console.log("✅ Order created:", { orderId, patientName, medication })

    return res.json({
      success: true,
      orderId,
      patientName,
      medication,
      prescriptionText,
    })
  } catch (error) {
    console.error("❌ Order creation error:", error)
    return res.status(500).json({
      success: false,
      error: "Failed to create order",
    })
  }
})

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "File too large. Maximum size is 10MB.",
      })
    }
  }

  console.error("Unhandled error:", error)
  res.status(500).json({
    success: false,
    error: "Internal server error",
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`)
  console.log(`🔑 OCR.space API: ${process.env.OCR_SPACE_API_KEY ? "✅ Configured" : "❌ Not configured"}`)
  console.log("📁 Endpoints:")
  console.log("  - POST /api/ocr (file upload)")
  console.log("  - POST /api/orders (JSON)")
  console.log("  - GET /api/health")
})
