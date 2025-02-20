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
    <div className="p-6 bg-black min-h-screen text-white rounded-md">
      <h1 className="text-2xl font-bold mb-4">Chat</h1>
      <div className="max-h-[500px] overflow-y-auto border border-gray-700 rounded-lg p-4 bg-gray-900">
        {messages?.length === 0 ? (
          <p className="text-gray-400">No chat messages received yet.</p>
        ) : (
          <ul className="space-y-4">
            {messages?.map((msg) => (
              <li key={msg.message_id} className="border border-gray-700 p-4 rounded bg-gray-800 flex items-center space-x-4">
                <Image
                  src={msg.sender.profile_picture}
                  alt={msg.sender.username}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-bold">{msg.sender.username}</p>
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
