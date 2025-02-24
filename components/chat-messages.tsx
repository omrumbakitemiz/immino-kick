"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface WebhookMessage {
  message_id: string;
  broadcaster: {
    username: string;
    profile_picture: string;
  };
  sender: {
    username: string;
    profile_picture: string;
  };
  content: string;
  timestamp?: string; // Timestamp added
}

// Function to format timestamp
const formatTimestamp = (timestamp?: string) => {
  if (!timestamp) return "Unknown time";
  const date = new Date(timestamp);
  return date.toLocaleString(); // Convert to readable format
};

export default function WebhookDataPage() {
  const [messages, setMessages] = useState<WebhookMessage[]>([]);

  useEffect(() => {
    async function fetchWebhookData() {
      const res = await fetch("/api/webhook");
      const data = await res.json();
      console.log(data);
      setMessages(data.data);
    }

    fetchWebhookData();

    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchWebhookData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-gray-100 rounded-md">
      <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">Chat</h1>
      <div className="max-h-[500px] overflow-y-auto border border-gray-700 rounded-lg p-4 bg-gray-800/50">
        {messages?.length === 0 ? (
          <p className="text-gray-400">No chat messages received yet.</p>
        ) : (
          <ul className="space-y-4">
            {messages?.map((msg) => (
              <li key={msg.message_id} className="border border-gray-700 p-4 rounded bg-gray-800 hover:bg-gray-800/80 transition-colors flex items-center space-x-4">
                <Image
                  src={msg.sender.profile_picture}
                  alt={msg.sender.username}
                  className="w-12 h-12 rounded-full ring-2 ring-emerald-500/20"
                  width={48}
                  height={48}
                />
                <div>
                  <p className="font-bold text-emerald-400">{msg.sender.username}</p>
                  <p className="text-gray-300">{msg.content}</p>
                  <p className="text-gray-500 text-sm">{formatTimestamp(msg.timestamp)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
