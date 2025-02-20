"use client";

import { useEffect, useState } from "react";

export default function ChatMessages() {
  const [webhookData, setWebhookData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchWebhookData() {
      const res = await fetch("/api/webhook");
      const data = await res.json();
      setWebhookData(data.data);
    }

    fetchWebhookData();

    // Optional: Auto-refresh every 5 seconds
    const interval = setInterval(fetchWebhookData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Webhook Data</h1>
      {webhookData.length === 0 ? (
        <p>No data received yet.</p>
      ) : (
        <ul className="space-y-3">
          {webhookData.map((item, index) => (
            <li key={index} className="border p-3 rounded bg-gray-100">
              <pre className="whitespace-pre-wrap">{JSON.stringify(item, null, 2)}</pre>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
