"use client";

export default function SubscribeEvents() {
  const accessToken = sessionStorage.getItem('access_token');

  if (!accessToken) {
    return <div>Please sign in to subscribe to events</div>;
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
    <div>
      <h1>Subscribe to Events</h1>
      <button className="bg-red-300 px-4 py-1 border rounded" onClick={handleClick}>Subscribe</button>
    </div>
  )
}
