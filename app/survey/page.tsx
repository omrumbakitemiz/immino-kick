"use client";

import { useEffect, useState } from "react";
import Fireworks from "../components/Fireworks";

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
  const [timerDuration, setTimerDuration] = useState<number | null>(null);
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
  const [showFireworks, setShowFireworks] = useState(false);

  // Timer states
  const [timerEndTime, setTimerEndTime] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Timer countdown effect
  useEffect(() => {
    let countdownInterval: any;

    if (votingActive && timerEndTime) {
      const updateCountdown = () => {
        const now = new Date().getTime();
        const endTime = new Date(timerEndTime).getTime();
        const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));

        setTimeRemaining(remaining);

        // Auto-end poll when timer reaches 0
        if (remaining === 0 && votingActive) {
          handleEndSurvey();
        }
      };

      updateCountdown();
      countdownInterval = setInterval(updateCountdown, 1000);
    }

    return () => {
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [votingActive, timerEndTime]);

  // Polling for live vote counts when survey is active
  useEffect(() => {
    let interval: any;
    async function fetchVotes() {
      try {
        const res = await fetch("/api/webhook");
        const data = await res.json();
        setVotes(data.votes);
        setVotingActive(data.votingActive);

        // Calculate total votes from the current vote counts
        const total = Object.values(data.votes).reduce((sum: number, count: any) => sum + (count || 0), 0);
        setTotalVotes(total);

        // Update timer info if available
        if (data.timerEndTime) {
          setTimerEndTime(data.timerEndTime);
        }
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
          options: validOptions,
          timerDuration
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentQuestion(data.question);
        setCurrentOptions(data.options);
        setVotes({});
        setWinner(null);
        setVotingActive(true);

        // Set timer info if enabled
        if (data.timerEndTime) {
          setTimerEndTime(data.timerEndTime);
        }
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
        setShowFireworks(true);

        // Note: App Access Tokens cannot send chat messages
        // Results are displayed in the UI instead
        console.log(`🎉 Poll Results: "${data.winner?.option}" won with ${data.winner?.percentage}% of ${data.totalVotes} votes!`);

        // Reset fireworks after 3 seconds
        setTimeout(() => {
          setShowFireworks(false);
        }, 3000);
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
        setTimerDuration(null);
        setTimerEndTime(null);
        setTimeRemaining(0);
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
      <Fireworks isActive={showFireworks} />
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
            <label className="block mb-3 font-semibold text-gray-300">Timer Duration</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTimerDuration(null)}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  timerDuration === null
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-gray-800/50 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                }`}
              >
                Manual End
              </button>
              <button
                type="button"
                onClick={() => setTimerDuration(60)}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  timerDuration === 60
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-gray-800/50 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                }`}
              >
                60s
              </button>
              <button
                type="button"
                onClick={() => setTimerDuration(90)}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  timerDuration === 90
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-gray-800/50 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                }`}
              >
                90s
              </button>
              <button
                type="button"
                onClick={() => setTimerDuration(180)}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  timerDuration === 180
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-gray-800/50 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                }`}
              >
                180s
              </button>
            </div>
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
          {/* Timer Countdown Display */}
          {timerEndTime && (
            <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
              <div className="flex items-center justify-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">⏱️</span>
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${timeRemaining <= 10 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                      {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                    </div>
                    <div className="text-sm text-gray-400">Time remaining</div>
                  </div>
                </div>
              </div>
              {timeRemaining <= 10 && timeRemaining > 0 && (
                <div className="text-center mt-2 text-red-400 text-sm animate-pulse">
                  ⚠️ Poll ending soon!
                </div>
              )}
            </div>
          )}

          <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 text-emerald-400">{currentQuestion}</h2>

            {/* Voting Instructions */}
            <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                💬 <strong>How to vote:</strong> Type the option number in chat (1, 2, 3, etc.)
              </p>
            </div>

            <div className="space-y-4">
              {currentOptions.map((option, index) => {
                const voteCount = votes[option] || 0;
                const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                return (
                  <div key={index} className="relative">
                    <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg z-10 relative">
                      <div className="flex items-center space-x-3">
                        <span className="bg-emerald-500 text-white text-sm font-bold px-2 py-1 rounded">
                          {index + 1}
                        </span>
                        <span className="text-gray-300">{option}</span>
                      </div>
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
              {voteDetails.map((detail, index) => {
                // Find the option index to show the number
                const optionIndex = currentOptions.findIndex(opt => opt === detail.option);
                const optionNumber = optionIndex !== -1 ? optionIndex + 1 : index + 1;

                return (
                  <div key={detail.option} className="relative">
                    <div className="flex justify-between items-center p-3 bg-gray-800/80 rounded-lg z-10 relative">
                      <div className="flex items-center space-x-3">
                        <span className="bg-gray-600 text-white text-sm font-bold px-2 py-1 rounded">
                          {optionNumber}
                        </span>
                        <div>
                          <span className="text-gray-300">{detail.option}</span>
                          {detail === winner && (
                            <span className="ml-2 text-emerald-400">👑 Winner</span>
                          )}
                        </div>
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
                );
              })}
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
