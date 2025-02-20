import { NextResponse } from "next/server";

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL as string;

export async function GET(req: Request) {
  try {
    const token = req.headers.get("Authorization");

    if (!token) {
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
    }

    const response = await fetch(`${NEXT_PUBLIC_API_URL}/public/v1/events/subscriptions`, {
      method: "GET",
      headers: {
        "Authorization": token,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: response.status });
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error, " + JSON.stringify(error) }, { status: 500 });
  }
}
