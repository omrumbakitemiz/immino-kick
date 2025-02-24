"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const [message, setMessage] = useState("Processing your login...");

  // Remove query parameters from the URL for better security
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    async function handleAuth() {
      try {
        const codeVerifier = sessionStorage.getItem("code_verifier");
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
          sessionStorage.setItem("access_token", data.access_token);
          sessionStorage.setItem("refresh_token", data.refresh_token);
          sessionStorage.setItem("expires_in", data.expires_in);
          setMessage("Login successful! Redirecting...");
          setTimeout(() => {
            router.push('/');
          }, 1500);
        } else {
          setTimeout(() => {
            router.push('/');
          }, 2000);
        }
      } catch (error) {
        console.error(error);
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    }

    handleAuth();
  }, [code, state, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="flex flex-col items-center gap-y-6">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-800 border-t-emerald-500" />
        <p className="text-lg text-gray-300 font-medium">{message}</p>
      </div>
    </div>
  );
}
