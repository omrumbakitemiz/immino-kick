"use client";

import { useEffect, useState } from "react";

interface VoteCounts {
  [key: string]: number;
}

export default function SurveyPage() {
  const [votes, setVotes] = useState<VoteCounts>({});
  const [votingActive, setVotingActive] = useState(true);
  const [winner, setWinner] = useState<{ option: string; count: number } | null>(null);
  const [options] = useState<string[]>(["1", "2", "3"]);

  useEffect(() => {
    async function fetchVotes() {
      const res = await fetch("/api/webhook");
      const data = await res.json();
      setVotes(data.votes);
      setVotingActive(data.votingActive);
    }

    fetchVotes();
    const interval = setInterval(fetchVotes, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleEndSurvey = async () => {
    const res = await fetch("/api/webhook", { method: "PUT" });
    const data = await res.json();
    setWinner(data.winner);
    setVotingActive(false);
  };

  const handleResetSurvey = async () => {
    await fetch("/api/webhook", { method: "DELETE" });
    setVotes({});
    setWinner(null);
    setVotingActive(true);
  };

  return (
    <div className="p-6 bg-black min-h-screen text-white flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Kick Chat Survey</h1>

      {/* Voting Options */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Vote Options:</h2>
        <ul className="flex space-x-4">
          {options.map((option) => (
            <li key={option} className="p-2 bg-gray-800 rounded text-white">{option}</li>
          ))}
        </ul>
      </div>

      {/* Live Vote Counts */}
      <div className="max-h-[400px] overflow-y-auto border border-gray-700 rounded-lg p-4 bg-gray-900 w-96">
        <h2 className="text-lg font-semibold">Live Vote Counts:</h2>
        {Object.keys(votes).length === 0 ? (
          <p className="text-gray-400">No votes received yet.</p>
        ) : (
          <ul className="space-y-2">
            {Object.entries(votes).map(([option, count]) => (
              <li key={option} className="flex justify-between p-2 bg-gray-800 rounded">
                <span className="text-white font-medium">Option {option}</span>
                <span className="text-green-400 font-semibold">{count} votes</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Winner Announcement */}
      {winner && (
        <div className="mt-4 p-4 bg-green-700 text-black rounded font-bold">
          🎉 Winner: Option {winner.option} with {winner.count} votes!
        </div>
      )}

      {/* Control Buttons */}
      <div className="mt-4 space-x-4">
        {votingActive ? (
          <button onClick={handleEndSurvey} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white font-semibold transition">
            End Survey
          </button>
        ) : (
          <button onClick={handleResetSurvey} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold transition">
            Start New Survey
          </button>
        )}
      </div>
    </div>
  );
}
