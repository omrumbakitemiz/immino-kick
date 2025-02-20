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
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Event Subscriptions</h1>
      <ul>
        {JSON.stringify(subscriptions)}
      </ul>
    </div>
  );
}
