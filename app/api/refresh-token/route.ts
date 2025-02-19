import { NextResponse } from "next/server";

const TOKEN_URL = process.env.TOKEN_URL as string;
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID as string;
const CLIENT_SECRET = process.env.CLIENT_SECRET as string;

export async function POST(req: Request) {
  try {
    const { refresh_token } = await req.json();

    if (!refresh_token) {
      return NextResponse.json({ error: "Missing refresh_token" }, { status: 400 });
    }

    // Prepare the request body
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token,
    });

    // Call Kick's OAuth API
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error_description || "Failed to refresh token" }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
