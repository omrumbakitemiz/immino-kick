"use client";

export default function SubscribeEvents() {
  const accessToken = sessionStorage.getItem('access_token');

  if (!accessToken) {
    return (
      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-400">
        Please sign in to subscribe to events
      </div>
    );
  }

  const handleClick = async () => {
    const response = await fetch('https://api.kick.com/public/v1/events/subscriptions', {
      method: 'POST',
      headers: {
        "Authorization": "Bearer " + accessToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "method": "webhook",
        "events": [
          {
            "name": "chat.message.sent",
            "version": 1
          }
        ]
      }),
    });
    const data = await response.json();

    console.log(data);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
        Subscribe to Events
      </h1>
      <button 
        onClick={handleClick}
        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-emerald-500/25"
      >
        Subscribe
      </button>
    </div>
  )
}
