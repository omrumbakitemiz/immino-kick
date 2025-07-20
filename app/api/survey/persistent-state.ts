import { Redis } from '@upstash/redis';

// Initialize Upstash Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface SurveyState {
  userVotes: Record<string, string>; // user_id -> vote option
  votingActive: boolean;
  currentQuestion: string;
  voteOptions: string[];
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_STATE: SurveyState = {
  userVotes: {},
  votingActive: false,
  currentQuestion: "",
  voteOptions: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const STATE_KEY = "survey:current";

export async function getSurveyState(): Promise<SurveyState> {
  try {
    const state = await redis.get<SurveyState>(STATE_KEY);
    if (state) {
      console.log(`📥 Loaded state from Redis: votingActive=${state.votingActive}, question="${state.currentQuestion}"`);
      return state;
    } else {
      console.log(`📭 No state in Redis, using defaults`);
      return { ...DEFAULT_STATE };
    }
  } catch (error) {
    console.error("❌ Error loading state from Redis:", error);
    return { ...DEFAULT_STATE };
  }
}

export async function setSurveyState(state: Partial<SurveyState>): Promise<void> {
  try {
    const currentState = await getSurveyState();
    const newState: SurveyState = {
      ...currentState,
      ...state,
      updatedAt: new Date().toISOString(),
    };

    await redis.set(STATE_KEY, newState);
    console.log(`📤 Saved state to Redis: votingActive=${newState.votingActive}, votes=${Object.keys(newState.userVotes).length}`);
  } catch (error) {
    console.error("❌ Error saving state to Redis:", error);
  }
}

export async function resetSurveyState(): Promise<void> {
  try {
    const resetState: SurveyState = {
      ...DEFAULT_STATE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await redis.set(STATE_KEY, resetState);
    console.log(`🔄 Reset state in Redis`);
  } catch (error) {
    console.error("❌ Error resetting state in Redis:", error);
  }
}

export async function addVote(userId: string, vote: string): Promise<void> {
  try {
    const state = await getSurveyState();
    state.userVotes[userId] = vote;
    state.updatedAt = new Date().toISOString();

    await redis.set(STATE_KEY, state);
    console.log(`🗳️ Added vote: ${userId} -> ${vote} (total: ${Object.keys(state.userVotes).length} votes)`);
  } catch (error) {
    console.error("❌ Error adding vote to Redis:", error);
  }
}
