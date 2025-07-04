const express = require("express");
const cors = require("cors");
const multer = require("multer");
const FormData = require("form-data");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// Import database
const { initDatabase, dbOperations, closeDatabase } = require("./database");

const app = express();
const PORT = process.env.PORT || 5000;

// Create uploads directory
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use("/uploads", express.static("uploads"));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "prescription-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Initialize database
initDatabase().catch(console.error);

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    const stats = await dbOperations.getDashboardStats();
    res.json({
      status: "OK",
      message: "Pharmacy Assistant API is running",
      timestamp: new Date().toISOString(),
      database: "Connected",
      stats,
      apis: {
        ocrSpace: !!process.env.OCR_SPACE_API_KEY,
        port: PORT,
      },
    });
  } catch (error) {
    res.json({
      status: "OK",
      message: "API running, database stats unavailable",
      error: error.message,
    });
  }
});

// Enhanced OCR endpoint with database storage
app.post("/api/ocr", upload.single("image"), async (req, res) => {
  console.log("📸 OCR request received");

  try {
    if (!req.file) {
      console.log("❌ No file provided");
      return res.status(400).json({
        success: false,
        error: "No image file provided",
      });
    }

    console.log("📁 File saved:", req.file.filename);

    // Read file and convert to base64
    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString("base64");
    const imageDataUrl = `data:${req.file.mimetype};base64,${base64Image}`;

    let extractedText = "";
    let ocrMethod = "";
    let confidenceScore = 0;

    // Try OCR.space API first
    if (process.env.OCR_SPACE_API_KEY) {
      console.log("🔑 Using OCR.space API");

      try {
        const formData = new FormData();
        formData.append("base64Image", imageDataUrl);
        formData.append("language", "eng");
        formData.append("isOverlayRequired", "false");
        formData.append("detectOrientation", "false");
        formData.append("scale", "true");
        formData.append("OCREngine", "2");

        const ocrResponse = await axios.post(
          "https://api.ocr.space/parse/image",
          formData,
          {
            headers: {
              apikey: process.env.OCR_SPACE_API_KEY,
              ...formData.getHeaders(),
            },
            timeout: 30000,
          }
        );

        const ocrData = ocrResponse.data;

        if (
          ocrData.ParsedResults &&
          ocrData.ParsedResults[0] &&
          ocrData.ParsedResults[0].ParsedText
        ) {
          extractedText = ocrData.ParsedResults[0].ParsedText.trim();
          ocrMethod = "OCR.space API";
          confidenceScore = 0.85; // OCR.space doesn't provide confidence, so we estimate

          console.log(
            "✅ Text extracted successfully:",
            extractedText.substring(0, 100) + "..."
          );
        }
      } catch (ocrError) {
        console.error(
          "❌ OCR.space API error:",
          ocrError.response?.data || ocrError.message
        );
      }
    }

    // Store prescription in database
    let prescriptionId = null;
    try {
      const prescriptionData = {
        extractedText: extractedText || "OCR processing failed",
        confidenceScore,
        ocrMethod: ocrMethod || "client-side",
        imagePath: req.file.filename,
      };

      const prescription = await dbOperations.createPrescription(
        prescriptionData
      );
      prescriptionId = prescription.id;
      console.log("💾 Prescription saved to database:", prescriptionId);
    } catch (dbError) {
      console.error("❌ Database error:", dbError);
    }

    if (extractedText) {
      return res.json({
        success: true,
        text: extractedText,
        method: ocrMethod,
        confidence: confidenceScore,
        prescriptionId,
        imageUrl: `/uploads/${req.file.filename}`,
      });
    } else {
      // Fallback: return image for client-side processing
      console.log("🔄 Falling back to client-side OCR");
      return res.json({
        success: true,
        imageData: imageDataUrl,
        method: "client-side",
        message: "Using client-side OCR processing",
        prescriptionId,
        imageUrl: `/uploads/${req.file.filename}`,
      });
    }
  } catch (error) {
    console.error("💥 Server error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error: " + error.message,
    });
  }
});

// Enhanced orders endpoint with database storage
app.post("/api/orders", async (req, res) => {
  console.log("📝 Order creation request");

  try {
    const { prescriptionText, prescriptionId } = req.body;

    if (!prescriptionText) {
      return res.status(400).json({
        success: false,
        error: "No prescription text provided",
      });
    }

    // Enhanced parsing
    const lines = prescriptionText.split("\n").filter((line) => line.trim());

    // Extract patient name
    let patientName = "Unknown Patient";
    const patientLine = lines.find(
      (line) => /patient|name/i.test(line) && !/medication|drug|rx/i.test(line)
    );
    if (patientLine) {
      patientName = patientLine.replace(/patient:?|name:?/gi, "").trim();
    }

    // Extract medication
    let medicationName = "Unknown Medication";
    const medicationLine = lines.find((line) =>
      /mg|tablet|capsule|ml|rx|medication|drug/i.test(line)
    );
    if (medicationLine) {
      medicationName = medicationLine.replace(/rx:?|medication:?/gi, "").trim();
    }

    // Extract dosage
    let dosage = "";
    const dosageLine = lines.find((line) =>
      /daily|times|once|twice|thrice|every|hours|morning|evening/i.test(line)
    );
    if (dosageLine) {
      dosage = dosageLine.trim();
    }

    // Extract quantity
    let quantity = 1;
    const quantityLine = lines.find((line) => /quantity|qty|#/i.test(line));
    if (quantityLine) {
      const match = quantityLine.match(/\d+/);
      if (match) quantity = Number.parseInt(match[0]);
    }

    // Extract prescriber
    let prescribedBy = "";
    const prescriberLine = lines.find((line) =>
      /dr\.|doctor|physician|prescribed by/i.test(line)
    );
    if (prescriberLine) {
      prescribedBy = prescriberLine
        .replace(/dr\.|doctor|physician|prescribed by:?/gi, "")
        .trim();
    }

    const orderId = `ORD-${Date.now().toString().slice(-6)}`;

    // Save to database
    const orderData = {
      orderId,
      patientName,
      medicationName,
      dosage,
      quantity,
      instructions: dosage,
      prescribedBy,
      prescriptionText,
      prescriptionId,
    };

    const savedOrder = await dbOperations.createOrder(orderData);
    console.log("✅ Order saved to database:", savedOrder);

    return res.json({
      success: true,
      orderId,
      patientName,
      medicationName,
      dosage,
      quantity,
      prescribedBy,
      prescriptionText,
      databaseId: savedOrder.id,
    });
  } catch (error) {
    console.error("❌ Order creation error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create order: " + error.message,
    });
  }
});

// Get all orders
app.get("/api/orders", async (req, res) => {
  try {
    const orders = await dbOperations.getAllOrders();
    res.json({
      success: true,
      orders: orders.map((order) => ({
        id: order.order_id,
        patientName: order.patient_name,
        medication: order.medication_name,
        dosage: order.dosage,
        quantity: order.quantity,
        status: order.status,
        prescribedBy: order.prescribed_by,
        createdAt: order.created_at,
        ocrMethod: order.ocr_method,
        confidence: order.confidence_score,
      })),
    });
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch orders",
    });
  }
});

// Get single order
app.get("/api/orders/:orderId", async (req, res) => {
  try {
    const order = await dbOperations.getOrderById(req.params.orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    res.json({
      success: true,
      order: {
        id: order.order_id,
        patientName: order.patient_name,
        medication: order.medication_name,
        dosage: order.dosage,
        quantity: order.quantity,
        status: order.status,
        prescribedBy: order.prescribed_by,
        prescriptionText: order.prescription_text,
        createdAt: order.created_at,
        imageUrl: order.image_path ? `/uploads/${order.image_path}` : null,
        ocrMethod: order.ocr_method,
        confidence: order.confidence_score,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching order:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch order",
    });
  }
});

// Update order status
app.put("/api/orders/:orderId/status", async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = [
      "pending",
      "processing",
      "ready",
      "dispensed",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status",
      });
    }

    const result = await dbOperations.updateOrderStatus(
      req.params.orderId,
      status
    );

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    res.json({
      success: true,
      message: "Order status updated",
      orderId: req.params.orderId,
      status,
    });
  } catch (error) {
    console.error("❌ Error updating order status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update order status",
    });
  }
});

// Dashboard statistics
app.get("/api/dashboard/stats", async (req, res) => {
  try {
    const stats = await dbOperations.getDashboardStats();
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("❌ Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard statistics",
    });
  }
});

// Search medications
app.get("/api/medications/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({
        success: false,
        error: "Search query required",
      });
    }

    const medications = await dbOperations.searchMedications(q);
    res.json({
      success: true,
      medications,
    });
  } catch (error) {
    console.error("❌ Error searching medications:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search medications",
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "File too large. Maximum size is 10MB.",
      });
    }
  }

  console.error("Unhandled error:", error);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down server...");
  await closeDatabase();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(
    `🔑 OCR.space API: ${
      process.env.OCR_SPACE_API_KEY ? "✅ Configured" : "❌ Not configured"
    }`
  );
  console.log(`💾 Database: SQLite (pharmacy.db)`);
  console.log("📁 Endpoints:");
  console.log("  - POST /api/ocr (file upload)");
  console.log("  - POST /api/orders (create order)");
  console.log("  - GET /api/orders (list orders)");
  console.log("  - GET /api/orders/:id (get order)");
  console.log("  - PUT /api/orders/:id/status (update status)");
  console.log("  - GET /api/dashboard/stats (dashboard)");
  console.log("  - GET /api/medications/search (search meds)");
});
