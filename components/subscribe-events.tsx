"use client";

import { useState } from "react";

export default function SubscribeEvents() {
  const accessToken = sessionStorage.getItem('access_token');
  const [channelSlug, setChannelSlug] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  if (!accessToken) {
    return (
      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-400">
        Waiting for API connection...
      </div>
    );
  }

  // Function to get user ID from channel name using slug parameter
  const getUserIdFromChannel = async (channelName: string): Promise<number | null> => {
    try {
      // Use the slug query parameter for channel lookup
      const response = await fetch(`https://api.kick.com/public/v1/channels?slug=${channelName}`, {
        headers: {
          "Authorization": "Bearer " + accessToken,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Channel lookup response:", data);

        // Extract broadcaster_user_id from the response structure
        if (data.data && data.data.length > 0) {
          return data.data[0].broadcaster_user_id || null;
        }
        return null;
      } else {
        const errorData = await response.json();
        console.error("Channel lookup failed:", errorData);
        return null;
      }
    } catch (error) {
      console.error("Error fetching user ID:", error);
      return null;
    }
  };

  const handleSubscribe = async () => {
    if (!channelSlug.trim()) {
      setMessage("Please enter a channel name");
      return;
    }

    setIsLoading(true);
    setMessage("🔍 Looking up channel...");

    try {
      // First, resolve the channel name to user ID using slug parameter
      const userId = await getUserIdFromChannel(channelSlug.toLowerCase().trim());

      if (!userId) {
        setMessage(`❌ Channel "${channelSlug}" not found. Please check the spelling.`);
        setIsLoading(false);
        return;
      }

      setMessage("📡 Subscribing to webhooks...");

      // Now subscribe using the broadcaster_user_id (required for app tokens)
      const response = await fetch('https://api.kick.com/public/v1/events/subscriptions', {
        method: 'POST',
        headers: {
          "Authorization": "Bearer " + accessToken,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "method": "webhook",
          "webhook_url": `${window.location.origin}/api/webhook`,
          "broadcaster_user_id": userId,
          "events": [
            {
              "name": "chat.message.sent",
              "version": 1
            }
          ]
        }),
      });

      const data = await response.json();
      console.log("Subscription response:", data);

      if (response.ok) {
        setMessage(`✅ Successfully subscribed to ${channelSlug}'s chat! (User ID: ${userId})`);
        console.log("Subscription successful:", data);
      } else {
        setMessage(`❌ Subscription failed: ${data.message || data.error || "Unknown error"}`);
        console.error("Subscription failed:", data);
      }
    } catch (error) {
      console.error("Subscription error:", error);
      setMessage("❌ Connection error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
        Subscribe to Channel Chat
      </h1>

      <div className="space-y-3">
        <div>
          <label htmlFor="channel" className="block text-sm font-medium text-gray-300 mb-2">
            Channel Name (without kick.com/)
          </label>
          <input
            id="channel"
            type="text"
            value={channelSlug}
            onChange={(e) => setChannelSlug(e.target.value)}
            placeholder="e.g. erenaktan, xqc, ninja"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          onClick={handleSubscribe}
          disabled={isLoading || !channelSlug.trim()}
          className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-emerald-500/25"
        >
          {isLoading ? "Processing..." : "Subscribe to Chat Messages"}
        </button>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.startsWith("✅")
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
              : message.startsWith("🔍") || message.startsWith("📡")
              ? "bg-blue-500/10 border border-blue-500/20 text-blue-400"
              : "bg-red-500/10 border border-red-500/20 text-red-400"
          }`}>
            {message}
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>💡 <strong>Tip:</strong> Enter the exact channel name as it appears on Kick</p>
          <p>📝 <strong>Examples:</strong> erenaktan, trainwreckstv, nmplol</p>
        </div>
      </div>
    </div>
  )
}
