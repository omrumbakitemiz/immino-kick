"use client";

import { generatePKCE } from "@/lib/pkce";
import { useEffect, useState } from "react";
import SurveyPage from "@/app/survey/page";
import ChatMessages from "@/components/chat-messages";

const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID as string;
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI as string;
const AUTH_ENDPOINT = process.env.NEXT_PUBLIC_AUTH_ENDPOINT as string;

export default function Home() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  useEffect(() => {
    async function refreshAccessToken() {
      if (!refreshToken) return;

      try {
        const response = await fetch("/api/refresh-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        const data = await response.json();

        if (data.access_token) {
          setAccessToken(data.access_token);
          sessionStorage.setItem("access_token", data.access_token);
          sessionStorage.setItem("refresh_token", data.refresh_token); // Update refresh token if provided
        } else {
          console.error("Failed to refresh token:", data.error);
        }
      } catch (error) {
        console.error("Error refreshing token:", error);
      }
    }

    // Load tokens from sessionStorage (or a secure storage)
    const storedAccessToken = sessionStorage.getItem("access_token");
    const storedRefreshToken = sessionStorage.getItem("refresh_token");

    setAccessToken(storedAccessToken);
    setRefreshToken(storedRefreshToken);

    if (storedAccessToken && storedRefreshToken) {
      // Schedule token refresh 5 minutes before expiration
      const refreshInterval = setInterval(() => {
        refreshAccessToken();
      }, (7200 - 300) * 1000); // 1 hour 55 minutes

      return () => clearInterval(refreshInterval); // Cleanup on unmount
    }
  }, [refreshToken]);


  const handleClick = async () => {
    const { codeVerifier, codeChallenge } = await generatePKCE();

    // Store the code_verifier in session storage (it will be needed later)
    sessionStorage.setItem("code_verifier", codeVerifier);
    console.log("codeVerifier", codeVerifier);

    const scopes = ["events:subscribe", "chat:write"];
    const scopeString = scopes.join(" "); // "events:subscribe chat:write"

    const url = new URL(AUTH_ENDPOINT);
    url.searchParams.set("client_id", CLIENT_ID);
    url.searchParams.set("redirect_uri", REDIRECT_URI);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", scopeString);
    url.searchParams.set("state", "123456");
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("code_challenge", codeChallenge);

    window.location.href = url.toString();
  }

  return (
    <div className="p-4">
      {accessToken ? (
        <div className="flex flex-col space-y-4">
          <div className="text-end">
            <p>Authenticated ✅</p>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-3">
              <SurveyPage />
            </div>

            <div className="col-span-1">
              <ChatMessages />
            </div>
          </div>
        </div>
      ) : (
        <div>
          <p>Not authenticated ❌</p>
        </div>
      )}

      {!accessToken && (
        <input type="button" value="Authenticate" onClick={handleClick} />
      )}

    </div>
  );
}
