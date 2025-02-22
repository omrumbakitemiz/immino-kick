export const surveyState = {
  userVotes: {} as Record<string, string>, // user_id -> vote option
  votingActive: false,
  currentQuestion: "",
  voteOptions: [] as string[],
};

export function resetSurvey() {
  surveyState.userVotes = {};
  surveyState.votingActive = false;
  surveyState.currentQuestion = "";
  surveyState.voteOptions = [];
}
