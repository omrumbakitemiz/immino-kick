"use client";

import { generatePKCE } from "@/lib/pkce";

const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID as string;
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI as string;
const AUTH_ENDPOINT = process.env.NEXT_PUBLIC_AUTH_ENDPOINT as string;

export default function Home() {
  const handleClick = async () => {
    const { codeVerifier, codeChallenge } = await generatePKCE();

    // Store the code_verifier in session storage (it will be needed later)
    sessionStorage.setItem("code_verifier", codeVerifier);
    console.log("codeVerifier", codeVerifier);

    // OAuth Authorization URL

    const scope = "events:subscribe";

    const url = new URL(AUTH_ENDPOINT);
    url.searchParams.set("client_id", CLIENT_ID);
    url.searchParams.set("redirect_uri", REDIRECT_URI);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", scope);
    url.searchParams.set("state", "123456");
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("code_challenge", codeChallenge);

    window.location.href = url.toString();
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <input type="button" value="Authorize" onClick={handleClick} />
    </div>
  );
}
