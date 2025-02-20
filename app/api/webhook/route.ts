import { NextRequest, NextResponse } from "next/server";

const webhookData: any[] = []; // Temporary in-memory storage

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Webhook received:", body);

    webhookData.push(body); // Store data in memory

    return NextResponse.json({ message: "Webhook received" }, { status: 200 });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

// Expose stored webhook data via GET request
export async function GET() {
  return NextResponse.json({ data: webhookData });
}
