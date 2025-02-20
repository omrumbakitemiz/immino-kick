"use client";

import { useEffect, useState } from "react";

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
}

export default function WebhookDataPage() {
  const [messages, setMessages] = useState<WebhookMessage[]>([]);

  useEffect(() => {
    async function fetchWebhookData() {
      const res = await fetch("/api/webhook");
      const data = await res.json();
      setMessages(data.data);
    }

    fetchWebhookData();

    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchWebhookData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Kick Chat Messages</h1>
      {messages.length === 0 ? (
        <p>No chat messages received yet.</p>
      ) : (
        <ul className="space-y-4">
          {messages.map((msg) => (
            <li key={msg.message_id} className="border p-4 rounded bg-gray-100 flex items-center space-x-4">
              <img
                src={msg.sender.profile_picture}
                alt={msg.sender.username}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <p className="font-bold">{msg.sender.username}</p>
                <p>{msg.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
