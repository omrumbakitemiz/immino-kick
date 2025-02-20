import { NextRequest, NextResponse } from "next/server";

const webhookData: any[] = []; // Temporary in-memory storage

export async function POST(req: NextRequest) {
  try {
    const headers = req.headers;
    const eventType = headers.get("Kick-Event-Type");
    const timestamp = headers.get("Kick-Event-Message-Timestamp"); // Extract timestamp

    const body = await req.json();

    // Log webhook event with timestamp
    console.log("📩 Webhook Received at:", timestamp);
    console.log("Headers:", JSON.stringify(Object.fromEntries(headers.entries()), null, 2));
    console.log("Payload:", JSON.stringify(body, null, 2));

    if (eventType !== "chat.message.sent") {
      console.log("⚠️ Ignored non-chat event:", eventType);
      return NextResponse.json({ message: "Ignored non-chat event" }, { status: 200 });
    }

    // Store message with timestamp
    webhookData.unshift({
      ...body,
      timestamp, // Include timestamp in the stored data
    });

    return NextResponse.json({ message: "Webhook received" }, { status: 200 });
  } catch (error) {
    console.error("❌ Error handling webhook:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

// API to fetch stored webhook data
export async function GET() {
  return NextResponse.json({ data: webhookData });
}
