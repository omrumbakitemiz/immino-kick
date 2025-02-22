import { NextRequest, NextResponse } from "next/server";
import { getRedisClient } from "@/lib/redis";

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

    const client = await getRedisClient();

    // Reset previous survey data:
    await client.del("survey:userVotes");
    await client.set("survey:currentQuestion", body.question);
    await client.set("survey:voteOptions", JSON.stringify(body.options));
    await client.set("survey:votingActive", "true");

    console.log("📊 Survey started:", body.question, body.options);
    console.log("📊 Voting active: true");

    // Construct the chat message to announce the survey
    const chatMessage = `📢 New Poll: ${body.question}\nVote with: ${body.options.join(", ")}`;
    console.log("token:", token);

    // Send the chat message to Kick
    const response = await fetch(NEXT_PUBLIC_API_URL + "/public/v1/chat", {
      method: "POST",
      headers: {
        Authorization: `${token}`,
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
      question: body.question,
      options: body.options,
      votingActive: true,
    });
  } catch (error) {
    console.error("❌ Error starting survey:", error);
    return NextResponse.json({ error: "Failed to start survey" }, { status: 500 });
  }
}
