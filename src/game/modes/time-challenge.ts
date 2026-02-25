import type { WorldState } from "../../engine/world";

export type GameScreen = "main-menu" | "music-select" | "racing" | "results";

export interface TimeChallengeState {
  screen: GameScreen;
  playerName: string;
  selectedTrack: number;
  timeLimit: number;
  currentTime: number;
  score: number;
  lap: number;
  totalLaps: number;
  checkpoints: number[];
  lastCheckpointTime: number;
  isPaused: boolean;
  isGameOver: boolean;
  bestTime: number | null;
  bestScore: number | null;
}

export interface Checkpoint {
  segmentIndex: number;
  passed: boolean;
  bonus: number;
}

export const DEFAULT_TIME_LIMIT = 60;
export const DEFAULT_LAPS = 3;
export const CHECKPOINT_BONUS = 10;

export const createTimeChallengeState = (): TimeChallengeState => ({
  screen: "main-menu",
  playerName: "PLAYER 1",
  selectedTrack: 0,
  timeLimit: DEFAULT_TIME_LIMIT,
  currentTime: DEFAULT_TIME_LIMIT,
  score: 0,
  lap: 1,
  totalLaps: DEFAULT_LAPS,
  checkpoints: [],
  lastCheckpointTime: 0,
  isPaused: false,
  isGameOver: false,
  bestTime: null,
  bestScore: null,
});

export const updateTimer = (
  state: TimeChallengeState,
  dt: number,
): TimeChallengeState => {
  if (state.isPaused || state.isGameOver || state.screen !== "racing") {
    return state;
  }

  const newTime = state.currentTime - dt;

  if (newTime <= 0) {
    return {
      ...state,
      currentTime: 0,
      isGameOver: true,
      screen: "results",
    };
  }

  return {
    ...state,
    currentTime: newTime,
  };
};

export const addCheckpointBonus = (
  state: TimeChallengeState,
): TimeChallengeState => {
  const bonus = CHECKPOINT_BONUS + Math.floor(state.currentTime);
  return {
    ...state,
    score: state.score + bonus,
    lastCheckpointTime: state.currentTime,
  };
};

export const completeLap = (
  state: TimeChallengeState,
  world: WorldState,
): TimeChallengeState => {
  const newLap = state.lap + 1;

  if (newLap > state.totalLaps) {
    const finalScore = state.score + Math.floor(state.currentTime * 100);
    const isNewBest = state.bestScore === null || finalScore > state.bestScore;

    return {
      ...state,
      isGameOver: true,
      screen: "results",
      score: finalScore,
      bestScore: isNewBest ? finalScore : state.bestScore,
      bestTime: isNewBest ? world.currentLapTime : state.bestTime,
    };
  }

  return {
    ...state,
    lap: newLap,
    currentTime: state.currentTime + 30,
    score: state.score + 50,
  };
};

export const startRace = (state: TimeChallengeState): TimeChallengeState => ({
  ...state,
  screen: "racing",
  currentTime: state.timeLimit,
  score: 0,
  lap: 1,
  isPaused: false,
  isGameOver: false,
  lastCheckpointTime: state.timeLimit,
});

export const pauseGame = (state: TimeChallengeState): TimeChallengeState => ({
  ...state,
  isPaused: true,
});

export const resumeGame = (state: TimeChallengeState): TimeChallengeState => ({
  ...state,
  isPaused: false,
});

export const returnToMenu = (
  state: TimeChallengeState,
): TimeChallengeState => ({
  ...createTimeChallengeState(),
  bestTime: state.bestTime,
  bestScore: state.bestScore,
});

export const setPlayerName = (
  state: TimeChallengeState,
  name: string,
): TimeChallengeState => ({
  ...state,
  playerName: name.slice(0, 10).toUpperCase(),
});

export const formatTimeDisplay = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const tenths = Math.floor((seconds % 1) * 10);
  return `${mins}:${secs.toString().padStart(2, "0")}.${tenths}`;
};

export const formatScore = (score: number): string => {
  return score.toString().padStart(6, "0");
};
