"use client"

import { useState } from "react"

const TestConnection = () => {
  const [testResult, setTestResult] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const testBackend = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("http://localhost:5000/api/test")
      const data = await response.json()
      setTestResult(`✅ Backend connected: ${data.message}`)
    } catch (error) {
      setTestResult(`❌ Backend connection failed: ${error.message}`)
    }
    setIsLoading(false)
  }

  const testOCR = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("http://localhost:5000/api/test-ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: true }),
      })
      const data = await response.json()
      setTestResult(`✅ OCR API working: ${data.text}`)
    } catch (error) {
      setTestResult(`❌ OCR API failed: ${error.message}`)
    }
    setIsLoading(false)
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg mb-4">
      <h3 className="font-bold mb-2">🔧 Debug Panel</h3>
      <div className="space-x-2 mb-2">
        <button onClick={testBackend} disabled={isLoading} className="px-3 py-1 bg-blue-500 text-white rounded text-sm">
          Test Backend
        </button>
        <button onClick={testOCR} disabled={isLoading} className="px-3 py-1 bg-green-500 text-white rounded text-sm">
          Test OCR API
        </button>
      </div>
      {testResult && <div className="text-sm p-2 bg-white rounded border">{testResult}</div>}
    </div>
  )
}

export default TestConnection
