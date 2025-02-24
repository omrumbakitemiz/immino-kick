"use client";

import { generatePKCE } from "@/lib/pkce";
import { useEffect, useRef, useState } from "react";
import SurveyPage from "@/app/survey/page";
// import ChatMessages from "@/components/chat-messages";

const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID as string;
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI as string;
const AUTH_ENDPOINT = process.env.NEXT_PUBLIC_AUTH_ENDPOINT as string;

export default function Home() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const clickTimerRef = useRef<NodeJS.Timeout>(null);

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

  const handleAuthenticatedClick = () => {
    // If this is the first click, start the 5-second timer
    if (clickCount === 0) {
      clickTimerRef.current = setTimeout(() => {
        setClickCount(0);
        clickTimerRef.current = null;
      }, 5000);
    }

    setClickCount((prevCount) => {
      const newCount = prevCount + 1;
      if (newCount >= 5) {
        // If reached 5 clicks within 5 seconds, clear sessionStorage and reload page
        if (clickTimerRef.current) {
          clearTimeout(clickTimerRef.current);
        }
        sessionStorage.clear();
        window.location.reload();
      }
      return newCount;
    });
  };

  if (accessToken) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-end mb-8">
            <button
              onClick={handleAuthenticatedClick}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <span>Connected to Kick</span>
              <span className="text-emerald-400">✓</span>
            </button>
          </div>
          
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            <div className="col-span-3">
              <SurveyPage />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-gray-100">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
          Polls for Kick Streamers
        </h1>
        
        <div className="space-y-6 mb-12">
          <p className="text-xl text-gray-300">
            Create polls in your chat
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="font-semibold text-emerald-400">Polls</h3>
              </div>
              <p className="text-gray-400">Start polls in your chat</p>
            </div>
            
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="font-semibold text-emerald-400">Results</h3>
              </div>
              <p className="text-gray-400">See poll results instantly</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleClick}
          className="group relative inline-flex items-center justify-center px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg overflow-hidden transition-all duration-300 shadow-lg hover:shadow-emerald-500/25"
        >
          <span className="relative flex items-center space-x-3">
            <svg 
              className="w-6 h-6"
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M12 4L20 20H4L12 4Z" />
            </svg>
            <span className="text-lg">Login with Kick</span>
          </span>
        </button>
      </div>
    </div>
  );
}
