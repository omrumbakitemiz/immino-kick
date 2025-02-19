import { NextResponse } from "next/server";

const TOKEN_URL = process.env.TOKEN_URL as string;
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID as string;
const CLIENT_SECRET = process.env.CLIENT_SECRET as string;
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI as string;

export async function POST(req: Request) {
  try {
    const { code, code_verifier } = await req.json();

    if (!code || !code_verifier) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET, // Include only if required
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier,
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
      return NextResponse.json({ error: data.error_description || "Token exchange failed" }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
