import { NextRequest, NextResponse } from "next/server";
import { setSurveyState, resetSurveyState } from "./persistent-state";

export async function POST(req: NextRequest) {
  try {
    console.log("🔵 Survey POST received - starting new poll");

    const token = req.headers.get("Authorization");

    if (!token) {
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.question || !body.options || !Array.isArray(body.options)) {
      return NextResponse.json({ error: "Invalid request. Provide a question and options." }, { status: 400 });
    }

    // Validate timer duration if provided
    const timerDuration = body.timerDuration;
    if (timerDuration && ![60, 90, 180].includes(timerDuration)) {
      return NextResponse.json({ error: "Invalid timer duration. Must be 60, 90, or 180 seconds." }, { status: 400 });
    }

    // Reset survey state in KV
    await resetSurveyState();

    // Calculate timer timestamps if timer is enabled
    const now = new Date();
    const timerStartTime = timerDuration ? now.toISOString() : undefined;
    const timerEndTime = timerDuration ? new Date(now.getTime() + timerDuration * 1000).toISOString() : undefined;

    // Set new survey data in KV
    await setSurveyState({
      currentQuestion: body.question,
      voteOptions: body.options,
      votingActive: true,
      userVotes: {},
      timerDuration,
      timerStartTime,
      timerEndTime,
    });

    console.log("📊 Survey started:", body.question, body.options);
    console.log("⏱️ Timer:", timerDuration ? `${timerDuration}s (ends at ${timerEndTime})` : "disabled");
    console.log("📊 Voting active: true");

    // Note: App Access Tokens cannot send chat messages
    // Poll will work via webhook - users vote by typing numbers in chat
    console.log("ℹ️ Poll ready - users can vote by typing option numbers (1, 2, 3...) in chat");

    return NextResponse.json({
      message: "Survey started - users can vote by typing numbers in chat",
      question: body.question,
      options: body.options,
      votingActive: true,
      timerDuration,
      timerStartTime,
      timerEndTime,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
