"use client";

import { useEffect, useRef, useState } from "react";
import SurveyPage from "@/app/survey/page";
import SubscribeEvents from "@/components/subscribe-events";

export default function Home() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const clickTimerRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    async function getAppAccessToken() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/token", {
          method: "GET",
        });

        const data = await response.json();

        if (data.access_token) {
          setAccessToken(data.access_token);
          setError(null);
          // Store the token for use across the app
          sessionStorage.setItem("access_token", data.access_token);

          // App Access Token typically has longer expiration, but we'll still refresh periodically
          if (data.expires_in) {
            // Refresh token a bit before it expires
            const refreshTime = (data.expires_in - 300) * 1000; // 5 minutes before expiration
            setTimeout(() => {
              getAppAccessToken(); // Refresh the token
            }, refreshTime);
          }
        } else {
          setError(data.error || "Failed to get access token");
        }
      } catch (error) {
        console.error("Error getting app access token:", error);
        setError("Failed to connect to Kick API");
      } finally {
        setIsLoading(false);
      }
    }

    // Get App Access Token immediately when app loads
    getAppAccessToken();
  }, []);

  const handleTokenRefresh = () => {
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
        // If reached 5 clicks within 5 seconds, refresh the token
        if (clickTimerRef.current) {
          clearTimeout(clickTimerRef.current);
        }
        setClickCount(0);
        // Refresh the App Access Token
        setIsLoading(true);
        fetch("/api/token", { method: "GET" })
          .then(res => res.json())
          .then(data => {
            if (data.access_token) {
              setAccessToken(data.access_token);
              sessionStorage.setItem("access_token", data.access_token);
            }
          })
          .catch(console.error)
          .finally(() => setIsLoading(false));
      }
      return newCount;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Connecting to Kick API...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">❌ Connection Error</div>
          <p className="text-gray-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (accessToken) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-end mb-8">
            <button
              onClick={handleTokenRefresh}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <span>Connected to Kick API</span>
              <span className="text-emerald-400">✓</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <SurveyPage />
            </div>
            <div>
              <SubscribeEvents />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback (shouldn't reach here with App Access Token)
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-400">Unexpected state. Please refresh the page.</p>
      </div>
    </div>
  );
}
