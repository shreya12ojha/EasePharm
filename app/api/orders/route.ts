import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { prescriptionText } = await request.json()

    if (!prescriptionText) {
      return NextResponse.json({ success: false, error: "No prescription text provided" })
    }

    // Parse prescription text (simplified for demo)
    const lines = prescriptionText.split("\n")
    const patientLine = lines.find((line) => line.includes("Patient:"))
    const medicationLine = lines.find((line) => line.includes("mg") || line.includes("Rx:"))

    const patientName = patientLine?.replace("Patient:", "").trim() || "Unknown Patient"
    const medication = medicationLine?.replace("Rx:", "").trim() || "Unknown Medication"

    // Generate order ID
    const orderId = `ORD-${Date.now().toString().slice(-6)}`

    // In production, save to database:
    /*
    const order = await prisma.order.create({
      data: {
        id: orderId,
        patientName,
        medication,
        prescriptionText,
        status: 'pending',
        createdAt: new Date()
      }
    })
    */

    console.log("Order created:", { orderId, patientName, medication })

    return NextResponse.json({
      success: true,
      orderId,
      patientName,
      medication,
    })
  } catch (error) {
    console.error("Order Creation Error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to create order",
    })
  }
}
