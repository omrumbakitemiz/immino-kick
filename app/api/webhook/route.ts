import { NextRequest, NextResponse } from "next/server";
import { getSurveyState, setSurveyState, addVote } from "../survey/persistent-state";
import { verifyKickWebhookSignature } from "../../../lib/kick-webhook-security";

const webhookData: any[] = [];

export async function POST(req: NextRequest) {
  console.log("🔵 Webhook POST received");

  try {
    const headers = req.headers;
    const eventType = headers.get("Kick-Event-Type");
    const messageId = headers.get("Kick-Event-Message-Id");
    const subscriptionId = headers.get("Kick-Event-Subscription-Id");
    const timestamp = headers.get("Kick-Event-Message-Timestamp");
    const signature = headers.get("Kick-Event-Signature");

    console.log("📨 Headers:", {
      eventType,
      messageId,
      subscriptionId,
      timestamp,
      hasSignature: !!signature
    });

    // Verify required headers
    if (!eventType) {
      console.log("❌ Missing Kick-Event-Type header");
      return NextResponse.json({ message: "Missing Kick-Event-Type header" }, { status: 400 });
    }

    if (!messageId || !timestamp || !signature) {
      console.log("❌ Missing required security headers");
      return NextResponse.json({ message: "Missing required security headers" }, { status: 401 });
    }

    // Get raw body for signature verification
    const rawBody = await req.text();

        // Verify webhook signature from Kick (skip in development mode)
    const isDevelopmentMode = process.env.NODE_ENV === 'development' || process.env.SKIP_SIGNATURE_VERIFICATION === 'true';

    if (isDevelopmentMode) {
      console.log("🚧 DEVELOPMENT MODE: Skipping signature verification");
    } else {
      const isValidSignature = verifyKickWebhookSignature(messageId, timestamp, rawBody, signature);

      if (!isValidSignature) {
        console.log("🚫 Invalid webhook signature - potential unauthorized request");
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }

      console.log("✅ Webhook signature verified - request is authentic");
    }

    if (eventType !== "chat.message.sent") {
      console.log(`ℹ️ Ignored non-chat event: ${eventType}`);
      return NextResponse.json({ message: "Ignored non-chat event" }, { status: 200 });
    }

    // Parse the JSON body (we already have rawBody for signature verification)
    const body = JSON.parse(rawBody);
    console.log("💬 Raw chat message body:", JSON.stringify(body, null, 2));

    const messageContent = body.content?.trim();
    const senderId = body.sender?.user_id?.toString();
    const senderUsername = body.sender?.username;
    const broadcasterUsername = body.broadcaster?.username;

    console.log("📝 Parsed message data:", {
      content: messageContent,
      senderId,
      senderUsername,
      broadcasterUsername,
      isValidVote: /^[1-9]\d*$/.test(messageContent)
    });

    // Load current state from KV
    const surveyState = await getSurveyState();

    console.log("📊 Current survey state:", {
      votingActive: surveyState.votingActive,
      currentQuestion: surveyState.currentQuestion,
      voteOptions: surveyState.voteOptions,
      existingVotesCount: Object.keys(surveyState.userVotes).length
    });

    // Process vote if voting is active
    if (surveyState.votingActive) {
      // Accept any alphanumeric input as a valid vote (letters, numbers, or combination)
      if (/^[a-zA-Z0-9]+$/.test(messageContent)) {
        console.log(`✅ Processing alphanumeric vote: "${messageContent}" from ${senderUsername} (${senderId})`);
        await addVote(senderId, messageContent);
      } else {
        console.log(`🚫 Invalid vote: "${messageContent}" - only alphanumeric characters allowed`);
      }
    } else {
      console.log("⏸️ Vote ignored - voting not active");
    }

    webhookData.unshift(body);
    console.log(`📦 Stored webhook data (total: ${webhookData.length})`);

    return NextResponse.json({ message: "Vote received" }, { status: 200 });
  } catch (error) {
    console.error("❌ Error handling webhook:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

// GET: Return current vote counts and status
export async function GET() {
  console.log("🔵 Webhook GET received - fetching vote counts");

  try {
    // Load state from KV
    const surveyState = await getSurveyState();

    // Calculate vote counts from userVotes
    const votes: Record<string, number> = {};
    console.log("📊 Processing user votes:", surveyState.userVotes);

    for (const vote of Object.values(surveyState.userVotes || {})) {
      votes[vote] = (votes[vote] || 0) + 1;
    }

    console.log("📈 Calculated vote counts:", votes);
    console.log("📊 Survey state:", {
      votingActive: surveyState.votingActive,
      totalUniqueVoters: Object.keys(surveyState.userVotes).length
    });

    return NextResponse.json({
      votes,
      votingActive: surveyState.votingActive,
    });
  } catch (error) {
    console.error("❌ Error in GET:", error);
    return NextResponse.json({
      votes: {},
      votingActive: false,
    });
  }
}

// PUT: End voting and determine the winner (counting each user's last vote only)
export async function PUT() {
  console.log("🔵 Webhook PUT received - ending survey");

  try {
    // Load and update state
    await setSurveyState({ votingActive: false });
    const surveyState = await getSurveyState();

    console.log("⏹️ Voting deactivated");

    // Tally votes by iterating over userVotes (user_id -> vote option)
    const voteCounts: Record<string, number> = {};
    for (const vote of Object.values(surveyState.userVotes || {})) {
      voteCounts[vote] = (voteCounts[vote] || 0) + 1;
    }

    // Calculate total votes
    let totalVotes = 0;
    for (const count of Object.values(voteCounts)) {
      totalVotes += count;
    }

    console.log("📊 Final results:", {
      voteCounts,
      totalVotes,
      totalUniqueVoters: Object.keys(surveyState.userVotes).length
    });

    // Calculate percentages and create vote details
    const voteDetails = Object.entries(voteCounts).map(([option, count]) => ({
      option,
      count,
      percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
    }));

    // Determine the winning option
    let winnerOption: string | null = null;
    let maxVotes = 0;
    for (const {option, count} of voteDetails) {
      if (count > maxVotes) {
        maxVotes = count;
        winnerOption = option;
      }
    }

    const winner = winnerOption ? {
      option: winnerOption,
      count: maxVotes,
      percentage: Math.round((maxVotes / totalVotes) * 100)
    } : null;

    console.log("🏆 Winner determined:", winner);

    return NextResponse.json({
      message: "Voting ended",
      winner,
      votes: voteCounts,
      voteDetails,
      totalVotes
    });
  } catch (error) {
    console.error("❌ Error in PUT:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Reset the survey (manual reset)
export async function DELETE() {
  console.log("🔵 Webhook DELETE received - resetting survey");

  try {
    await setSurveyState({
      userVotes: {},
      votingActive: true,
    });

    console.log("🔄 Survey reset - voting reactivated");

    return NextResponse.json({ message: "Voting reset" });
  } catch (error) {
    console.error("❌ Error in DELETE:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
