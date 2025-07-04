import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get("image") as File

    if (!image) {
      return NextResponse.json({ success: false, error: "No image provided" })
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer()
    const base64Image = Buffer.from(bytes).toString("base64")

    // Option 1: OCR.space API (Free tier: 25,000 requests/month)
    if (process.env.OCR_SPACE_API_KEY) {
      try {
        const ocrFormData = new FormData()
        ocrFormData.append("base64Image", `data:${image.type};base64,${base64Image}`)
        ocrFormData.append("language", "eng")
        ocrFormData.append("isOverlayRequired", "false")
        ocrFormData.append("detectOrientation", "false")
        ocrFormData.append("scale", "true")
        ocrFormData.append("OCREngine", "2") // Engine 2 is better for handwriting

        const ocrResponse = await fetch("https://api.ocr.space/parse/image", {
          method: "POST",
          headers: {
            apikey: process.env.OCR_SPACE_API_KEY,
          },
          body: ocrFormData,
        })

        const ocrData = await ocrResponse.json()
        console.log("OCR.space response:", ocrData)

        if (ocrData.ParsedResults?.[0]?.ParsedText) {
          return NextResponse.json({
            success: true,
            text: ocrData.ParsedResults[0].ParsedText,
            method: "OCR.space API",
            confidence: ocrData.ParsedResults[0].TextOverlay?.HasOverlay ? "High" : "Medium",
          })
        }
      } catch (error) {
        console.error("OCR.space API Error:", error)
      }
    }

    // Option 2: Azure Computer Vision (Free tier: 5,000 transactions/month)
    if (process.env.AZURE_VISION_KEY && process.env.AZURE_VISION_ENDPOINT) {
      try {
        const azureResponse = await fetch(
          `${process.env.AZURE_VISION_ENDPOINT}/vision/v3.2/ocr?language=en&detectOrientation=true`,
          {
            method: "POST",
            headers: {
              "Ocp-Apim-Subscription-Key": process.env.AZURE_VISION_KEY,
              "Content-Type": "application/octet-stream",
            },
            body: Buffer.from(base64Image, "base64"),
          },
        )

        const azureData = await azureResponse.json()
        console.log("Azure response:", azureData)

        if (azureData.regions) {
          const extractedText = azureData.regions
            .map((region: any) =>
              region.lines.map((line: any) => line.words.map((word: any) => word.text).join(" ")).join("\n"),
            )
            .join("\n")

          return NextResponse.json({
            success: true,
            text: extractedText,
            method: "Azure Computer Vision",
            confidence: "High",
          })
        }
      } catch (error) {
        console.error("Azure Vision API Error:", error)
      }
    }

    // Option 3: Fallback to client-side processing
    return NextResponse.json({
      success: true,
      imageData: `data:${image.type};base64,${base64Image}`,
      method: "client-side",
      message: "Using free client-side OCR processing...",
    })
  } catch (error) {
    console.error("OCR Error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to process image",
    })
  }
}
