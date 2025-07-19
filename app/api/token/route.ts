import { NextResponse } from "next/server";

const TOKEN_URL = process.env.TOKEN_URL as string;
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID as string;
const CLIENT_SECRET = process.env.CLIENT_SECRET as string;

// App Access Token endpoint - uses client credentials grant
export async function POST() {
  try {
    // For App Access Token, we use client_credentials grant type
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    });

    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error_description || "Token request failed" }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET method to retrieve App Access Token (since it doesn't require user interaction)
export async function GET() {
  try {
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    });

    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error_description || "Token request failed" }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
