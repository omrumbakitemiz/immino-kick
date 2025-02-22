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
      const senderId = body.sender.user_id.toString();
      surveyState.userVotes[senderId] = messageContent;
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
  // when returning the webhook data, we want to do some calculations on surveyState.userVotes
  // we want to count the number of votes for each option, but count should be based on senderId
  const votes: Record<string, number> = {};

  for (const vote of Object.values(surveyState.userVotes || {})) {
    votes[vote] = (votes[vote] || 0) + 1;
  }

  return NextResponse.json({
    votes,
    votingActive: surveyState.votingActive,
  });
}

// PUT: End voting and determine the winner (counting each user's last vote only)
export async function PUT() {
  surveyState.votingActive = false;

  // Tally votes by iterating over userVotes (user_id -> vote option)
  const voteCounts: Record<string, number> = {};
  for (const vote of Object.values(surveyState.userVotes || {})) {
    voteCounts[vote] = (voteCounts[vote] || 0) + 1;
  }

  // Determine the winning option
  let winnerOption: string | null = null;
  let maxVotes = 0;
  for (const [option, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count;
      winnerOption = option;
    }
  }

  return NextResponse.json({
    message: "Voting ended",
    winner: winnerOption ? { option: winnerOption, count: maxVotes } : null,
    votes: voteCounts,
  });
}

// DELETE: Reset the survey (manual reset)
export async function DELETE() {
  surveyState.userVotes = {};
  surveyState.votingActive = true;
  return NextResponse.json({ message: "Voting reset" });
}
