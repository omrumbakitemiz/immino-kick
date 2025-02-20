export const surveyState = {
  votes: {} as Record<string, number>,
  votingActive: false,
  currentQuestion: "",
  voteOptions: [] as string[],
};

export function resetSurvey() {
  surveyState.votes = {};
  surveyState.votingActive = false;
  surveyState.currentQuestion = "";
  surveyState.voteOptions = [];
}
