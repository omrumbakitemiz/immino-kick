import { NextRequest, NextResponse } from "next/server";
import { surveyState, resetSurvey } from "./state";

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL as string;

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

    // Construct the chat message to announce the survey
    const chatMessage = `📢 New Survey: ${surveyState.currentQuestion}\nVote with: ${surveyState.voteOptions.join(", ")}`;

    console.log('token:', token);
    // Send the chat message to Kick
    const response = await fetch(NEXT_PUBLIC_API_URL + '/public/v1/chat', {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: chatMessage,
        type: "bot",
      }),
    });

    if (!response.ok) {
      console.error("❌ Failed to send chat message:", await response.text());
    }

    return NextResponse.json({
      message: "Survey started",
      question: surveyState.currentQuestion,
      options: surveyState.voteOptions,
      votingActive: surveyState.votingActive,
    });
  } catch (error) {
    console.error("❌ Error starting survey:", error);
    return NextResponse.json({ error: "Failed to start survey" }, { status: 500 });
  }
}
