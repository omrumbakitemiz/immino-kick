import { NextRequest, NextResponse } from "next/server";

const webhookData: any[] = []; // Temporary in-memory storage

export async function POST(req: NextRequest) {
  try {
    const headers = req.headers;
    const eventType = headers.get("Kick-Event-Type");

    if (eventType !== "chat.message.sent") {
      return NextResponse.json({ message: "Ignored non-chat event" }, { status: 200 });
    }

    const body = await req.json();
    console.log("Kick Chat Message Received:", body);

    webhookData.unshift(body); // Store new messages at the top

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
