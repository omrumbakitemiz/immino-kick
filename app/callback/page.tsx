"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function CallbackPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const [message, setMessage] = useState("Processing...");

  // Remove query parameters from the URL for better security
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

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
          setMessage("Authentication successfully completed! 🤙");
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
  }, [code, state]);

  return (
    <div className="flex flex-col gap-y-6 p-4 items-center">
      <p>{message}</p>

      <Link
        href="/"
        className="w-fit px-6 py-3 bg-amber-500 hover:bg-amber-500 rounded-md text-white font-semibold transition duration-300"
      >
        Return to Home
      </Link>
    </div>
  );
}
