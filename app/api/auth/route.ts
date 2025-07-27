import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

    // Get the password from environment variables
    const correctPassword = process.env.APP_PASSWORD;

    if (!correctPassword) {
      console.error("❌ APP_PASSWORD environment variable not set");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    // Verify password
    if (password === correctPassword) {
      console.log("✅ Authentication successful");
      return NextResponse.json({ success: true, message: "Authentication successful" });
    } else {
      console.log("❌ Authentication failed - incorrect password");
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }
  } catch (error) {
    console.error("❌ Error in auth endpoint:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
