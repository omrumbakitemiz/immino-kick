export const surveyState = {
  userVotes: {} as Record<string, string>, // user_id -> vote option
  votes: {} as Record<string, number>, // vote option -> count
  votingActive: false,
  currentQuestion: "",
  voteOptions: [] as string[],
};

export function resetSurvey() {
  surveyState.userVotes = {};
  surveyState.votes = {};
  surveyState.votingActive = false;
  surveyState.currentQuestion = "";
  surveyState.voteOptions = [];
}
