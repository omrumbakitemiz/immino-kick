export const surveyState = {
  userVotes: {} as Record<string, string>, // user_id -> vote option
  votes: {} as Record<string, number>, // vote option -> count
  votingActive: false,
  currentQuestion: "",
  voteOptions: [] as string[],
  stateId: Math.random().toString(36).substring(7), // Unique ID to track state instance
  createdAt: new Date().toISOString(), // When this state instance was created
};

console.log(`🆔 Survey state initialized - ID: ${surveyState.stateId} at ${surveyState.createdAt}`);

export function resetSurvey() {
  console.log(`🔄 Resetting survey state - ID: ${surveyState.stateId}`);
  surveyState.userVotes = {};
  surveyState.votes = {};
  surveyState.votingActive = false;
  surveyState.currentQuestion = "";
  surveyState.voteOptions = [];
}

export function logStateInfo(context: string) {
  console.log(`📊 [${context}] State info:`, {
    stateId: surveyState.stateId,
    createdAt: surveyState.createdAt,
    votingActive: surveyState.votingActive,
    totalVotes: Object.keys(surveyState.userVotes).length,
    currentQuestion: surveyState.currentQuestion
  });
}
