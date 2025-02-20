"use client";

import { useEffect, useState } from "react";

interface VoteCounts {
  [key: string]: number;
}

export default function SurveyPage() {
  // Survey creation states
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  // Live survey states
  const [votes, setVotes] = useState<VoteCounts>({});
  const [votingActive, setVotingActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [winner, setWinner] = useState<{ option: string; count: number } | null>(null);

  // Polling for live vote counts when survey is active
  useEffect(() => {
    let interval: any;
    async function fetchVotes() {
      const res = await fetch("/api/webhook");
      const data = await res.json();
      setVotes(data.votes);
      setVotingActive(data.votingActive);
    }
    if (votingActive) {
      fetchVotes();
      interval = setInterval(fetchVotes, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [votingActive]);

  const handleStartSurvey = async () => {
    const accessToken = sessionStorage.getItem('access_token');

    if (!question.trim() || options.some(opt => !opt.trim())) {
      alert("Please enter a valid question and all options.");
      return;
    }
    const res = await fetch("/api/survey", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + accessToken,
      },
      body: JSON.stringify({ question, options }),
    });
    const data = await res.json();
    if (res.ok) {
      // Store current survey details
      setCurrentQuestion(data.question);
      setCurrentOptions(data.options);
      setVotes({});
      setWinner(null);
      setVotingActive(true);
    } else {
      alert("Failed to start survey.");
    }
  };

  const handleEndSurvey = async () => {
    const res = await fetch("/api/webhook", { method: "PUT" });
    const data = await res.json();
    if (res.ok) {
      setWinner(data.winner);
      setVotingActive(false);
    } else {
      alert("Failed to end survey.");
    }
  };

  const handleResetSurvey = async () => {
    const res = await fetch("/api/webhook", { method: "DELETE" });
    if (res.ok) {
      setVotes({});
      setWinner(null);
      setVotingActive(false);
      setCurrentQuestion("");
      setCurrentOptions([]);
      setQuestion("");
      setOptions(["", ""]);
    } else {
      alert("Failed to reset survey.");
    }
  };

  const handleAddOption = () => {
    setOptions([...options, ""]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <div className="p-6 bg-black min-h-screen text-white flex flex-col items-center space-y-6">
      <h1 className="text-3xl font-bold">Kick Chat Survey</h1>

      {/* Survey Creation Form */}
      {!votingActive && !winner && (
        <div className="w-96 space-y-4">
          <div>
            <label className="block mb-2 font-semibold">Survey Question:</label>
            <input
              type="text"
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
              placeholder="Enter survey question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>
          <div>
            <label className="block mb-2 font-semibold">Vote Options:</label>
            {options.map((option, index) => (
              <div key={index} className="flex items-center mb-2">
                <input
                  type="text"
                  className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                />
                {options.length > 1 && (
                  <button
                    onClick={() => handleRemoveOption(index)}
                    className="ml-2 px-2 bg-red-600 hover:bg-red-700 rounded"
                  >
                    ✖
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={handleAddOption}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
            >
              ➕ Add Option
            </button>
          </div>
          <button
            onClick={handleStartSurvey}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-semibold"
          >
            Start Survey
          </button>
        </div>
      )}

      {/* Live Vote Count Display */}
      {votingActive && (
        <div className="w-96 space-y-4">
          <div className="p-4 bg-gray-900 border border-gray-700 rounded">
            <h2 className="text-xl font-semibold mb-2">Survey: {currentQuestion}</h2>
            <p className="mb-2">Vote options: {currentOptions.join(", ")}</p>
            <h3 className="font-semibold">Live Vote Counts:</h3>
            {Object.keys(votes).length === 0 ? (
              <p className="text-gray-400">No votes yet.</p>
            ) : (
              <ul className="space-y-2">
                {Object.entries(votes).map(([option, count]) => (
                  <li key={option} className="flex justify-between p-2 bg-gray-800 rounded">
                    <span>Option {option}</span>
                    <span className="text-green-400 font-bold">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex space-x-4">
            <button
              onClick={handleEndSurvey}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-semibold"
            >
              End Survey
            </button>
            <button
              onClick={handleResetSurvey}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold"
            >
              Reset Survey
            </button>
          </div>
        </div>
      )}

      {/* Winner Announcement */}
      {winner && (
        <div className="w-96 p-4 bg-green-700 rounded text-black font-bold text-center">
          🎉 Winner: Option {winner.option} with {winner.count} votes!
        </div>
      )}
    </div>
  );
}
