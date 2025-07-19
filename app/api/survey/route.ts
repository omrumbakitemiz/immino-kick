import { NextRequest, NextResponse } from "next/server";
import { surveyState, resetSurvey } from "./state";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization");

    if (!token) {
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.question || !body.options || !Array.isArray(body.options)) {
      return NextResponse.json({ error: "Invalid request. Provide a question and options." }, { status: 400 });
    }

    // Reset survey state
    resetSurvey();

    // Set new survey data using the mutable object
    surveyState.currentQuestion = body.question;
    surveyState.voteOptions.splice(0, surveyState.voteOptions.length, ...body.options);
    surveyState.votingActive = true;

    console.log("📊 Survey started:", surveyState.currentQuestion, surveyState.voteOptions);
    console.log("📊 Voting active:", surveyState.votingActive);

    // Note: App Access Tokens cannot send chat messages
    // Poll will work via webhook - users vote by typing numbers in chat
    console.log("ℹ️ Poll ready - users can vote by typing option numbers (1, 2, 3...) in chat");

    return NextResponse.json({
      message: "Survey started - users can vote by typing numbers in chat",
      question: surveyState.currentQuestion,
      options: surveyState.voteOptions,
      votingActive: surveyState.votingActive,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
