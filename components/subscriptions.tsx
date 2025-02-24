import { useEffect, useState } from 'react';

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [error, setError] = useState<string>();

  const storedAccessToken = sessionStorage.getItem("access_token");

  useEffect(() => {
    async function fetchSubscriptions() {
      try {
        const response = await fetch('/api/get-event-subscriptions', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${storedAccessToken}`,
          },
        });
        const data = await response.json();

        if (response.ok) {
          setSubscriptions(data); // Assuming the API returns an object with a 'data' property
        } else {
          setError(data.error || 'Failed to fetch subscriptions');
        }
      } catch (err) {
        console.error(err);
        setError('An unexpected error occurred');
      }
    }

    fetchSubscriptions();
  }, [storedAccessToken]);

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
        Event Subscriptions
      </h1>
      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
        <pre className="text-gray-300 overflow-x-auto">
          {JSON.stringify(subscriptions, null, 2)}
        </pre>
      </div>
    </div>
  );
}
