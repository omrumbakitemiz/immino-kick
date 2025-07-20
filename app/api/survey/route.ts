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

    // Reset survey state in KV
    await resetSurveyState();

    // Set new survey data in KV
    await setSurveyState({
      currentQuestion: body.question,
      voteOptions: body.options,
      votingActive: true,
      userVotes: {},
    });

    console.log("📊 Survey started:", body.question, body.options);
    console.log("📊 Voting active: true");

    // Note: App Access Tokens cannot send chat messages
    // Poll will work via webhook - users vote by typing numbers in chat
    console.log("ℹ️ Poll ready - users can vote by typing option numbers (1, 2, 3...) in chat");

    return NextResponse.json({
      message: "Survey started - users can vote by typing numbers in chat",
      question: body.question,
      options: body.options,
      votingActive: true,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
