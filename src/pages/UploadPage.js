"use client"

import { useState } from "react"
import { Upload, FileImage, Loader2, Eye } from "lucide-react"
import { useToast } from "../hooks/useToast"

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000"

const UploadPage = () => {
  const [file, setFile] = useState(null)
  const [extractedText, setExtractedText] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [preview, setPreview] = useState(null)
  const [progress, setProgress] = useState(0)
  const [ocrMethod, setOcrMethod] = useState("")
  const { toast } = useToast()

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        })
        return
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive",
        })
        return
      }

      setFile(selectedFile)
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result)
      reader.readAsDataURL(selectedFile)
    }
  }

  const processWithTesseract = async (imageData) => {
    try {
      const Tesseract = await import("tesseract.js")

      setProgress(0)
      const { createWorker } = Tesseract
      const worker = await createWorker("eng", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100))
          }
        },
      })

      await worker.setParameters({
        tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:-/() ",
        tessedit_pageseg_mode: "6",
      })

      const {
        data: { text, confidence },
      } = await worker.recognize(imageData)
      await worker.terminate()

      return { text: text.trim(), confidence }
    } catch (error) {
      console.error("Tesseract Error:", error)
      throw new Error("Client-side OCR failed")
    }
  }

  const processImage = async () => {
    if (!file) return

    setIsProcessing(true)
    setProgress(0)
    setOcrMethod("")
    setExtractedText("")

    try {
      // First try server-side OCR
      const formData = new FormData()
      formData.append("image", file)

      const response = await fetch(`${API_BASE_URL}/api/ocr`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      console.log("API Response:", data)

      if (data.success) {
        if (data.text && data.method !== "client-side") {
          // Server-side OCR successful
          setExtractedText(data.text)
          setOcrMethod(data.method)
          toast({
            title: "Success",
            description: `Text extracted using ${data.method}`,
          })
        } else {
          // Use client-side OCR with Tesseract.js
          setOcrMethod("Tesseract.js (Client-side)")
          toast({
            title: "Processing",
            description: "Using client-side OCR...",
          })

          const imageData = data.imageData || preview
          const result = await processWithTesseract(imageData)
          setExtractedText(result.text)

          toast({
            title: "Success",
            description: `Text extracted with ${Math.round(result.confidence)}% confidence`,
          })
        }
      } else {
        throw new Error(data.error || "Failed to process image")
      }
    } catch (error) {
      console.error("Processing error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to process image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const createOrder = async () => {
    if (!extractedText) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prescriptionText: extractedText }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Order Created",
          description: `Order #${data.orderId} created successfully`,
        })

        // Reset form
        setFile(null)
        setPreview(null)
        setExtractedText("")
        setOcrMethod("")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Upload Prescription</h1>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Upload Image</h2>
              <p className="text-gray-600">Upload a clear image of the handwritten prescription</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {preview ? (
                  <div className="space-y-2">
                    <img
                      src={preview || "/placeholder.svg"}
                      alt="Preview"
                      className="max-w-full h-48 object-contain mx-auto rounded"
                    />
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                      <Eye className="h-4 w-4" />
                      <span>{file?.name}</span>
                      <span>({Math.round((file?.size || 0) / 1024)} KB)</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No image selected</p>
                    <p className="text-xs text-gray-400 mt-1">Max size: 10MB</p>
                  </div>
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isProcessing}
                className="w-full p-2 border border-gray-300 rounded-md"
              />

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing with {ocrMethod}</span>
                    {progress > 0 && <span>{progress}%</span>}
                  </div>
                  {progress > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={processImage}
                disabled={!file || isProcessing}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting Text...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Extract Text
                  </>
                )}
              </button>

              {ocrMethod && (
                <div className="text-xs text-center space-y-1">
                  <p className="text-gray-500">Processed using: {ocrMethod}</p>
                  {extractedText && <p className="text-green-600">✓ {extractedText.length} characters extracted</p>}
                </div>
              )}
            </div>
          </div>

          {/* Text Section */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Extracted Text</h2>
              <p className="text-gray-600">Review and edit the extracted prescription text</p>
            </div>
            <div className="p-6 space-y-4">
              <textarea
                placeholder="Extracted text will appear here..."
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                rows={12}
                className="w-full p-3 border border-gray-300 rounded-md font-mono text-sm"
              />

              <div className="flex space-x-2">
                <button
                  onClick={createOrder}
                  disabled={!extractedText}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Order
                </button>
                <button
                  onClick={() => setExtractedText("")}
                  disabled={!extractedText}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* API Status */}
        <div className="mt-8 bg-white rounded-lg border shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">API Status</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Available OCR Services:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Server-side APIs (if configured)</li>
                <li>• Tesseract.js (always available)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Tips for Better Results:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Use high-contrast images</li>
                <li>• Ensure text is clearly visible</li>
                <li>• Avoid shadows and glare</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UploadPage
