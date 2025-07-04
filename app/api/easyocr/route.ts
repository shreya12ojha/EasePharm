import { type NextRequest, NextResponse } from "next/server"

// This is a mock implementation since EasyOCR requires Python
// In a real implementation, you would need a Python backend service
export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json()

    if (!image) {
      return NextResponse.json({ success: false, error: "No image provided" })
    }

    // In a real implementation, you would call a Python service with EasyOCR
    // For now, we'll return a mock response
    return NextResponse.json({
      success: true,
      text: "This is a mock response from EasyOCR API. In a real implementation, this would be the extracted text from the image.",
      confidence: 0.85,
    })
  } catch (error) {
    console.error("EasyOCR Error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to process image with EasyOCR",
    })
  }
}
