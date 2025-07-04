"use client";

import { useState } from "react";
import ConnectionTest from "../components/ConnectionTest";
import "./UploadPage.css";
import { Image } from "lucide-react";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const UploadPageFixed = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ocrMethod, setOcrMethod] = useState("");
  const [logs, setLogs] = useState([]);
  const [debugMode, setDebugMode] = useState(true);

  const addLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      message,
      type,
      timestamp,
    };
    setLogs((prev) => [...prev, logEntry]);
    console.log(`[${timestamp}] ${message}`);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file
      if (!selectedFile.type.startsWith("image/")) {
        addLog("❌ Invalid file type. Please select an image file", "error");
        alert("Please select an image file");
        return;
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        addLog(
          "❌ File too large. Please select an image smaller than 10MB",
          "error"
        );
        alert("File too large. Please select an image smaller than 10MB");
        return;
      }

      setFile(selectedFile);
      addLog(
        `📁 File selected: ${selectedFile.name} (${Math.round(
          selectedFile.size / 1024
        )}KB)`
      );

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
        addLog("🖼️ Preview created successfully");
      };
      reader.onerror = () => {
        addLog("❌ Failed to create preview", "error");
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const processWithTesseract = async (imageData) => {
    try {
      addLog("📦 Loading Tesseract.js...");
      const { createWorker } = await import("tesseract.js");

      setProgress(0);
      const worker = await createWorker("eng", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
            addLog(`🔄 Tesseract progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      addLog("⚙️ Configuring Tesseract for handwriting...");
      await worker.setParameters({
        tessedit_char_whitelist:
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:-/() ",
        tessedit_pageseg_mode: "6",
      });

      addLog("🔍 Processing image with Tesseract...");
      const {
        data: { text, confidence },
      } = await worker.recognize(imageData);
      await worker.terminate();

      addLog(
        `✅ Tesseract completed with ${Math.round(confidence)}% confidence`
      );
      return { text: text.trim(), confidence };
    } catch (error) {
      addLog(`❌ Tesseract error: ${error.message}`, "error");
      throw error;
    }
  };

  const processImage = async () => {
    if (!file) {
      addLog("❌ No file selected", "error");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setOcrMethod("");
    setExtractedText("");
    setLogs([]);

    try {
      addLog("🚀 Starting OCR process...");
      addLog(`📡 API URL: ${API_BASE_URL}`);

      // Create FormData
      const formData = new FormData();
      formData.append("image", file);
      addLog("📦 FormData created with image file");

      addLog("📤 Sending request to server...");

      // Add timeout and better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${API_BASE_URL}/api/ocr`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
        // Don't set Content-Type header - let browser set it with boundary
      });

      clearTimeout(timeoutId);

      addLog(
        `📨 Server response status: ${response.status} ${response.statusText}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        addLog(`❌ Server error response: ${errorText}`, "error");
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      addLog(`📋 Response data received: ${JSON.stringify(data, null, 2)}`);

      if (data.success) {
        if (data.text && data.method !== "client-side") {
          // Server-side OCR successful
          setExtractedText(data.text);
          setOcrMethod(data.method);
          addLog(`✅ Text extracted using ${data.method}`);
          addLog(`📝 Extracted ${data.text.length} characters`);
        } else {
          // Use client-side OCR
          setOcrMethod("Tesseract.js (Client-side)");
          addLog("🔄 Falling back to client-side OCR...");

          const imageData = data.imageData || preview;
          if (!imageData) {
            throw new Error(
              "No image data available for client-side processing"
            );
          }

          const result = await processWithTesseract(imageData);
          setExtractedText(result.text);

          addLog(
            `✅ Text extracted with ${Math.round(
              result.confidence
            )}% confidence`
          );
          addLog(`📝 Extracted ${result.text.length} characters`);
        }
      } else {
        throw new Error(data.error || "Unknown server error");
      }
    } catch (error) {
      if (error.name === "AbortError") {
        addLog("❌ Request timed out after 30 seconds", "error");
      } else if (error.message.includes("Failed to fetch")) {
        addLog("❌ Network error - cannot connect to server", "error");
        addLog("💡 Check if backend server is running on port 5000", "error");
        addLog("💡 Check if CORS is properly configured", "error");
      } else {
        addLog(`❌ Processing error: ${error.message}`, "error");
      }
      console.error("💥 Full error:", error);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const createOrder = async () => {
    if (!extractedText) {
      addLog("❌ No extracted text to create order", "error");
      return;
    }

    try {
      addLog("📝 Creating order...");

      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prescriptionText: extractedText }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (data.success) {
        addLog(`✅ Order created: ${data.orderId}`);
        alert(`Order #${data.orderId} created successfully!`);

        // Reset form
        setFile(null);
        setPreview(null);
        setExtractedText("");
        setOcrMethod("");
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      addLog(`❌ Order creation failed: ${error.message}`, "error");
      alert(`Failed to create order: ${error.message}`);
    }
  };

  return (
    <div className="upload-page">
      <div className="container">
        <h1>Upload Prescription - Debug Mode</h1>

        {/* Connection Test */}
        <ConnectionTest />

        {/* Debug Toggle */}
        <div className="debug-toggle">
          <label>
            <input
              type="checkbox"
              checked={debugMode}
              onChange={(e) => setDebugMode(e.target.checked)}
            />
            Show Debug Logs
          </label>
        </div>

        <div className="upload-grid">
          {/* Upload Section */}
          <div className="upload-section">
            <h2>📤 Upload Image</h2>

            <div className="file-drop-zone">
              {preview ? (
                <div className="preview-container">
                  <Image
                    src={preview || "/placeholder.svg"}
                    alt="Preview"
                    className="preview-image"
                  />
                  <div className="file-info">
                    📁 {file?.name} ({Math.round((file?.size || 0) / 1024)}KB)
                  </div>
                </div>
              ) : (
                <div className="drop-placeholder">
                  <div className="drop-icon">📷</div>
                  <p>Select an image file</p>
                  <p className="file-hint">Max size: 10MB</p>
                </div>
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isProcessing}
              className="file-input"
            />

            {isProcessing && (
              <div className="progress-container">
                <div className="progress-info">
                  Processing with {ocrMethod}
                  {progress > 0 && <span> - {progress}%</span>}
                </div>
                {progress > 0 && (
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={processImage}
              disabled={!file || isProcessing}
              className="btn btn-primary"
            >
              {isProcessing ? "⏳ Extracting Text..." : "🔍 Extract Text"}
            </button>

            {ocrMethod && (
              <div className="ocr-info">
                <p>✅ Processed using: {ocrMethod}</p>
                {extractedText && (
                  <p>📝 {extractedText.length} characters extracted</p>
                )}
              </div>
            )}
          </div>

          {/* Text Section */}
          <div className="text-section">
            <h2>📝 Extracted Text</h2>

            <textarea
              placeholder="Extracted text will appear here..."
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              rows={15}
              className="text-area"
            />

            <div className="button-group">
              <button
                onClick={createOrder}
                disabled={!extractedText}
                className="btn btn-success"
              >
                ✅ Create Order
              </button>
              <button
                onClick={() => {
                  setExtractedText("");
                  setLogs([]);
                }}
                disabled={!extractedText}
                className="btn btn-secondary"
              >
                🗑️ Clear
              </button>
            </div>
          </div>
        </div>

        {/* Debug Logs */}
        {debugMode && (
          <div className="debug-logs">
            <h3>🔍 Debug Logs</h3>
            <div className="logs-container">
              {logs.map((log, index) => (
                <div key={index} className={`log-entry ${log.type}`}>
                  <span className="timestamp">[{log.timestamp}]</span>
                  <span className="message">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPageFixed;
