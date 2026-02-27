import type { WorldState } from "../../engine/world";

export type GameScreen =
  | "main-menu"
  | "music-select"
  | "recs"
  | "racing"
  | "results";

export type GameMode = "time" | "race";

export interface TimeChallengeState {
  screen: GameScreen;
  playerName: string;
  selectedTrack: number;
  gameMode: GameMode;
  timeLimit: number;
  currentTime: number;
  score: number;
  lap: number;
  totalLaps: number;
  checkpointsPassed: number;
  totalCheckpoints: number;
  lastCheckpointSegment: number;
  isPaused: boolean;
  isGameOver: boolean;
  bestTime: number | null;
  bestScore: number | null;
  timeBonusFlash: number;
}

export const DEFAULT_TIME_LIMIT = 45;
export const DEFAULT_LAPS = 3;
export const CHECKPOINT_TIME_BONUS = 3;
export const LAP_TIME_BONUS = 20;
export const CHECKPOINT_SCORE_BONUS = 25;
export const LAP_SCORE_BONUS = 100;
export const CHECKPOINTS_PER_LAP = 4;
export const BASE_TIME_PER_SEGMENT = 0.15;
export const MIN_TIME_LIMIT = 30;

export const calculateTimeLimit = (
  trackLength: number,
  segmentLength: number,
): number => {
  const totalSegments = Math.floor(trackLength / segmentLength);
  const calculatedTime = Math.floor(totalSegments * BASE_TIME_PER_SEGMENT);
  return Math.max(MIN_TIME_LIMIT, calculatedTime);
};

export const createTimeChallengeState = (
  trackLength: number = 0,
  segmentLength: number = 200,
): TimeChallengeState => {
  const timeLimit =
    trackLength > 0
      ? calculateTimeLimit(trackLength, segmentLength)
      : DEFAULT_TIME_LIMIT;

  return {
    screen: "main-menu",
    playerName: "PLAYER 1",
    selectedTrack: 0,
    timeLimit,
    currentTime: timeLimit,
    score: 0,
    lap: 1,
    totalLaps: DEFAULT_LAPS,
    checkpointsPassed: 0,
    totalCheckpoints: CHECKPOINTS_PER_LAP,
    lastCheckpointSegment: -1,
    isPaused: false,
    isGameOver: false,
    bestTime: null,
    bestScore: null,
    timeBonusFlash: 0,
  };
};

export const updateTimer = (
  state: TimeChallengeState,
  dt: number,
): TimeChallengeState => {
  if (state.isPaused || state.isGameOver || state.screen !== "racing") {
    return state;
  }

  const newTime = state.currentTime - dt;
  const newFlash = Math.max(0, state.timeBonusFlash - dt);

  if (newTime <= 0) {
    return {
      ...state,
      currentTime: 0,
      isGameOver: true,
      screen: "results",
      timeBonusFlash: 0,
    };
  }

  return {
    ...state,
    currentTime: newTime,
    timeBonusFlash: newFlash,
  };
};

export const checkCheckpoint = (
  state: TimeChallengeState,
  playerPosition: number,
  trackLength: number,
  segmentLength: number,
): { state: TimeChallengeState; bonusAwarded: number } => {
  if (state.isPaused || state.isGameOver) {
    return { state, bonusAwarded: 0 };
  }

  const currentSegment = Math.floor(playerPosition / segmentLength);
  const totalSegments = Math.floor(trackLength / segmentLength);
  const segmentsPerCheckpoint = Math.floor(
    totalSegments / (CHECKPOINTS_PER_LAP + 1),
  );

  const currentCheckpointIndex = Math.floor(
    currentSegment / segmentsPerCheckpoint,
  );

  if (
    currentCheckpointIndex > state.lastCheckpointSegment &&
    currentCheckpointIndex <= CHECKPOINTS_PER_LAP
  ) {
    const bonus = CHECKPOINT_TIME_BONUS;
    return {
      state: {
        ...state,
        currentTime: state.currentTime + bonus,
        score: state.score + CHECKPOINT_SCORE_BONUS,
        checkpointsPassed: currentCheckpointIndex,
        lastCheckpointSegment: currentCheckpointIndex,
        timeBonusFlash: 1.5,
      },
      bonusAwarded: bonus,
    };
  }

  return { state, bonusAwarded: 0 };
};

export const completeLap = (
  state: TimeChallengeState,
  world: WorldState,
): TimeChallengeState => {
  const newLap = state.lap + 1;

  if (newLap > state.totalLaps) {
    const finalScore =
      state.score + Math.floor(state.currentTime * 50) + LAP_SCORE_BONUS;
    const isNewBest = state.bestScore === null || finalScore > state.bestScore;

    return {
      ...state,
      isGameOver: true,
      screen: "results",
      score: finalScore,
      bestScore: isNewBest ? finalScore : state.bestScore,
      bestTime: isNewBest ? world.currentLapTime : state.bestTime,
      timeBonusFlash: 0,
    };
  }

  return {
    ...state,
    lap: newLap,
    currentTime: state.currentTime + LAP_TIME_BONUS,
    score: state.score + LAP_SCORE_BONUS,
    checkpointsPassed: 0,
    lastCheckpointSegment: 0,
    timeBonusFlash: 2,
  };
};

export const startRace = (state: TimeChallengeState): TimeChallengeState => ({
  ...state,
  screen: "racing",
  currentTime: state.timeLimit,
  score: 0,
  lap: 1,
  checkpointsPassed: 0,
  lastCheckpointSegment: 0,
  isPaused: false,
  isGameOver: false,
  timeBonusFlash: 0,
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
