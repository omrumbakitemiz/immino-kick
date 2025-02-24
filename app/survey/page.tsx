"use client";

import { useEffect, useState } from "react";

interface VoteCounts {
  [key: string]: number;
}

interface VoteDetail {
  option: string;
  count: number;
  percentage: number;
}

export default function SurveyPage() {
  // Survey creation states
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Live survey states
  const [votes, setVotes] = useState<VoteCounts>({});
  const [votingActive, setVotingActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [winner, setWinner] = useState<{ option: string; count: number; percentage: number } | null>(null);
  const [voteDetails, setVoteDetails] = useState<VoteDetail[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [intervalTime] = useState(5000);

  // Polling for live vote counts when survey is active
  useEffect(() => {
    let interval: any;
    async function fetchVotes() {
      try {
        const res = await fetch("/api/webhook");
        const data = await res.json();
        setVotes(data.votes);
        setVotingActive(data.votingActive);
      } catch (error) {
        console.error("Error fetching votes:", error);
      }
    }
    
    if (votingActive) {
      fetchVotes();
      interval = setInterval(fetchVotes, intervalTime);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [votingActive, intervalTime]);

  const handleStartSurvey = async () => {
    const accessToken = sessionStorage.getItem('access_token');

    if (!question.trim()) {
      alert("Please enter a survey question.");
      return;
    }

    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      alert("Please enter at least two valid options.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/survey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + accessToken,
        },
        body: JSON.stringify({ 
          question, 
          options: validOptions 
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentQuestion(data.question);
        setCurrentOptions(data.options);
        setVotes({});
        setWinner(null);
        setVotingActive(true);
      } else {
        alert(data.error || "Failed to start survey.");
      }
    } catch (error) {
      console.error("Error starting survey:", error);
      alert("Failed to start survey. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndSurvey = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/webhook", { method: "PUT" });
      const data = await res.json();
      if (res.ok) {
        setWinner(data.winner);
        setVoteDetails(data.voteDetails);
        setTotalVotes(data.totalVotes);
        setVotingActive(false);
      } else {
        alert("Failed to end survey.");
      }
    } catch (error) {
      console.error("Error ending survey:", error);
      alert("Failed to end survey. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSurvey = async () => {
    setIsLoading(true);
    try {
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
    } catch (error) {
      console.error("Error resetting survey:", error);
      alert("Failed to reset survey. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-900 min-h-screen text-gray-100 flex flex-col space-y-6 rounded-md relative">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-800 border-t-emerald-500" />
        </div>
      )}

      <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
        Create Poll
      </h1>

      {/* Survey Creation Form */}
      {!votingActive && !winner && (
        <div className="space-y-6">
          <div>
            <label className="block mb-2 font-semibold text-gray-300">Question</label>
            <input
              type="text"
              className="w-full p-3 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              placeholder="What do you want to ask?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="font-semibold text-gray-300">Options</label>
              <span className="text-sm text-gray-400">{options.length}/6 options</span>
            </div>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm w-6">{index + 1}.</span>
                  <input
                    type="text"
                    className="flex-1 p-3 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                  />
                  {options.length > 2 && (
                    <button
                      onClick={() => handleRemoveOption(index)}
                      className="p-3 text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                      title="Remove option"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 6 && (
              <button
                onClick={handleAddOption}
                className="mt-3 w-full p-3 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <span>Add Option</span>
                <span className="text-emerald-400">+</span>
              </button>
            )}
          </div>

          <button
            onClick={handleStartSurvey}
            disabled={isLoading}
            className="w-full p-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-emerald-500/25"
          >
            Start Poll
          </button>
        </div>
      )}

      {/* Live Vote Count Display */}
      {votingActive && (
        <div className="space-y-6">
          <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 text-emerald-400">{currentQuestion}</h2>
            <div className="space-y-4">
              {currentOptions.map((option, index) => {
                const voteCount = votes[option] || 0;
                const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                return (
                  <div key={index} className="relative">
                    <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg z-10 relative">
                      <span className="text-gray-300">{option}</span>
                      <span className="text-emerald-400 font-semibold">{voteCount} votes</span>
                    </div>
                    <div 
                      className="absolute inset-0 bg-emerald-500/10 rounded-lg transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={handleEndSurvey}
              disabled={isLoading}
              className="flex-1 p-3 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-gray-300 font-semibold rounded-lg transition-colors"
            >
              End Poll
            </button>
            <button
              onClick={handleResetSurvey}
              disabled={isLoading}
              className="flex-1 p-3 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-gray-300 font-semibold rounded-lg transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Winner Announcement */}
      {winner && (
        <div className="space-y-6">
          <div className="p-6 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-emerald-400 mb-2">Poll Results</h2>
              <p className="text-gray-300">Total votes: {totalVotes}</p>
            </div>
            
            <div className="mt-6 space-y-4">
              {voteDetails.map((detail) => (
                <div key={detail.option} className="relative">
                  <div className="flex justify-between items-center p-3 bg-gray-800/80 rounded-lg z-10 relative">
                    <div>
                      <span className="text-gray-300">{detail.option}</span>
                      {detail === winner && (
                        <span className="ml-2 text-emerald-400">👑 Winner</span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-emerald-400 font-semibold">{detail.count} votes</div>
                      <div className="text-sm text-gray-400">{detail.percentage}%</div>
                    </div>
                  </div>
                  <div 
                    className="absolute inset-0 bg-emerald-500/20 rounded-lg transition-all duration-500"
                    style={{ width: `${detail.percentage}%` }}
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleResetSurvey}
            disabled={isLoading}
            className="w-full p-3 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-gray-300 font-semibold rounded-lg transition-colors"
          >
            Create New Poll
          </button>
        </div>
      )}
    </div>
  );
}
