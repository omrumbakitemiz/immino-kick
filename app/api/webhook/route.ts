import { NextRequest, NextResponse } from "next/server";
import { surveyState } from "../survey/state";

const webhookData: any[] = [];

export async function POST(req: NextRequest) {
  try {
    const headers = req.headers;
    const eventType = headers.get("Kick-Event-Type");
    if (!eventType) {
      return NextResponse.json({ message: "Missing Kick-Event-Type header" }, { status: 400 });
    }
    if (eventType !== "chat.message.sent") {
      return NextResponse.json({ message: "Ignored non-chat event" }, { status: 200 });
    }
    const body = await req.json();
    const messageContent = body.content.trim();
    console.log("📩 Received Vote:", messageContent);
    // Process vote if voting is active and message is a valid positive integer
    if (surveyState.votingActive && /^[1-9]\d*$/.test(messageContent)) {
      surveyState.votes[messageContent] = (surveyState.votes[messageContent] || 0) + 1;
    }
    webhookData.unshift(body);
    return NextResponse.json({ message: "Vote received" }, { status: 200 });
  } catch (error) {
    console.error("❌ Error handling webhook:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

// GET: Return current vote counts and status
export async function GET() {
  return NextResponse.json({
    votes: surveyState.votes,
    votingActive: surveyState.votingActive,
  });
}

// PUT: End voting and determine the winner
export async function PUT() {
  surveyState.votingActive = false;
  let winnerOption: string | null = null;
  let maxVotes = 0;
  for (const [option, count] of Object.entries(surveyState.votes)) {
    if (count > maxVotes) {
      maxVotes = count;
      winnerOption = option;
    }
  }
  return NextResponse.json({
    message: "Voting ended",
    winner: winnerOption ? { option: winnerOption, count: maxVotes } : null,
    votes: surveyState.votes,
  });
}

// DELETE: Reset the survey (manual reset)
export async function DELETE() {
  surveyState.votes = {};
  surveyState.votingActive = true;
  return NextResponse.json({ message: "Voting reset" });
}
