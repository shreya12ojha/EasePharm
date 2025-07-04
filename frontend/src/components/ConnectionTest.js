"use client";

import { useState } from "react";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const ConnectionTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [testing, setTesting] = useState(false);

  const addResult = (message, success = true) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults((prev) => [
      ...prev,
      {
        message,
        success,
        timestamp,
      },
    ]);
  };

  const runTests = async () => {
    setTesting(true);
    setTestResults([]);

    // Test 1: Check if backend is running
    addResult("🔍 Testing backend connection...");
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        addResult(`✅ Backend connected: ${data.message}`, true);
        addResult(`📊 Database status: ${data.database || "Unknown"}`, true);
      } else {
        addResult(
          `❌ Backend responded with status: ${response.status}`,
          false
        );
      }
    } catch (error) {
      addResult(`❌ Backend connection failed: ${error.message}`, false);
      addResult("💡 Make sure backend server is running on port 5000", false);
    }

    // Test 2: Check CORS
    addResult("🔍 Testing CORS configuration...");
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: "OPTIONS",
      });
      addResult("✅ CORS preflight successful", true);
    } catch (error) {
      addResult(`❌ CORS error: ${error.message}`, false);
    }

    // Test 3: Test file upload endpoint
    addResult("🔍 Testing file upload endpoint...");
    try {
      // Create a small test file
      const testFile = new File(["test"], "test.txt", { type: "text/plain" });
      const formData = new FormData();
      formData.append("image", testFile);

      const response = await fetch(`${API_BASE_URL}/api/ocr`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        addResult("✅ Upload endpoint accessible", true);
      } else {
        const errorText = await response.text();
        addResult(
          `❌ Upload endpoint error: ${response.status} - ${errorText}`,
          false
        );
      }
    } catch (error) {
      addResult(`❌ Upload test failed: ${error.message}`, false);
    }

    setTesting(false);
  };

  return (
    <div className="connection-test">
      <div className="test-header">
        <h3>🔧 Connection Diagnostics</h3>
        <button
          onClick={runTests}
          disabled={testing}
          className="btn btn-primary"
        >
          {testing ? "🔄 Testing..." : "🧪 Run Tests"}
        </button>
      </div>

      <div className="test-info">
        <p>
          <strong>API URL:</strong> {API_BASE_URL}
        </p>
        <p>
          <strong>Frontend URL:</strong> {window.location.origin}
        </p>
      </div>

      <div className="test-results">
        {testResults.map((result, index) => (
          <div
            key={index}
            className={`test-result ${result.success ? "success" : "error"}`}
          >
            <span className="timestamp">[{result.timestamp}]</span>
            <span className="message">{result.message}</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        .connection-test {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 1rem;
          margin: 1rem 0;
        }

        .test-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .test-info {
          background: #e9ecef;
          padding: 0.5rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }

        .test-results {
          max-height: 300px;
          overflow-y: auto;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          padding: 0.5rem;
        }

        .test-result {
          padding: 0.25rem 0;
          font-family: monospace;
          font-size: 0.875rem;
          border-bottom: 1px solid #f1f3f4;
        }

        .test-result:last-child {
          border-bottom: none;
        }

        .test-result.success {
          color: #155724;
        }

        .test-result.error {
          color: #721c24;
        }

        .timestamp {
          color: #6c757d;
          margin-right: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default ConnectionTest;
