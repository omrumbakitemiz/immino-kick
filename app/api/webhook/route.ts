import { NextRequest, NextResponse } from "next/server";

let votes: Record<string, number> = {}; // Store vote counts
let votingActive = true; // Controls voting state
const webhookData: any[] = []; // Store raw messages for debugging

export async function POST(req: NextRequest) {
  try {
    const headers = req.headers;
    const eventType = headers.get("Kick-Event-Type");
    const body = await req.json();

    if (eventType !== "chat.message.sent") {
      return NextResponse.json({ message: "Ignored non-chat event" }, { status: 200 });
    }

    const messageContent = body.content.trim(); // Get chat message
    console.log("📩 Received Vote:", messageContent);

    // Only process votes if voting is active
    if (votingActive && /^[1-9]\d*$/.test(messageContent)) {
      votes[messageContent] = (votes[messageContent] || 0) + 1;
    }

    webhookData.unshift(body); // Store raw messages

    return NextResponse.json({ message: "Vote received" }, { status: 200 });
  } catch (error) {
    console.error("❌ Error handling webhook:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

// API to fetch vote counts
export async function GET() {
  return NextResponse.json({ votes, votingActive });
}

// API to reset votes and start a new survey
export async function DELETE() {
  votes = {}; // Reset votes
  votingActive = true;
  return NextResponse.json({ message: "Voting reset" });
}

// API to stop voting and determine winner
export async function PUT() {
  votingActive = false;

  let winnerOption: string | null = null;
  let maxVotes = 0;

  // Iterate through votes to find the option with the highest count
  for (const [option, count] of Object.entries(votes)) {
    if (count > maxVotes) {
      maxVotes = count;
      winnerOption = option;
    }
  }

  return NextResponse.json({
    message: "Voting ended",
    winner: winnerOption ? { option: winnerOption, count: maxVotes } : null,
    votes,
  });
}
