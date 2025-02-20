"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function CallbackPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const [message, setMessage] = useState("Processing...");

  useEffect(() => {
    if (!code) {
      setMessage("No authorization code found.");
      return;
    }

    // Retrieve `code_verifier` from session storage
    const codeVerifier = sessionStorage.getItem("code_verifier");

    if (!codeVerifier) {
      setMessage("Missing code_verifier.");
      return;
    }

    async function fetchToken() {
      try {
        const response = await fetch("/api/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            code_verifier: codeVerifier,
            state,
          }),
        });

        const data = await response.json();

        if (data.access_token) {
          setMessage(`Access Token: ${data.access_token}`);
          sessionStorage.setItem("access_token", data.access_token);
          sessionStorage.setItem("refresh_token", data.refresh_token);
          sessionStorage.setItem("expires_in", data.expires_in);
        } else {
          setMessage(`Error: ${data.error || "Unknown error"}`);
        }
      } catch (error) {
        console.error(error);
        setMessage("Failed to exchange code for token.");
      }
    }

    fetchToken();
  }, [code]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>OAuth Callback</h1>
      <p>{message}</p>

      {/* back to home page*/}
      <Link href="/">Return to Home</Link>

      {/*refresh token*/}
    </div>
  );
}
