export const surveyState = {
  userVotes: {} as Record<string, string>, // user_id -> vote option
  votes: {} as Record<string, number>, // vote option -> count
  votingActive: false,
  currentQuestion: "",
  voteOptions: [] as string[],
};
