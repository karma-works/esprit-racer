import type { WorldState } from "../../engine/world";

export type GameScreen =
  | "main-menu"
  | "music-select"
  | "car-select"
  | "difficulty-select"
  | "standings"
  | "recs"
  | "racing"
  | "results";

export type GameMode = "time" | "race" | "championship";

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
  isWin: boolean;
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
    gameMode: "time",
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
    isWin: false,
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

  const newFlash = Math.max(0, state.timeBonusFlash - dt);

  if (state.gameMode === "race") {
    // Race mode: count up, no time limit
    return {
      ...state,
      currentTime: state.currentTime + dt,
      timeBonusFlash: newFlash,
    };
  }

  // Time mode: count down with limit
  const newTime = state.currentTime - dt;

  if (newTime <= 0) {
    return {
      ...state,
      currentTime: 0,
      isGameOver: true,
      isWin: false,
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
    // No time bonus in race mode
    const bonus = state.gameMode === "race" ? 0 : CHECKPOINT_TIME_BONUS;
    return {
      state: {
        ...state,
        currentTime: state.currentTime + bonus,
        score: state.score + CHECKPOINT_SCORE_BONUS,
        checkpointsPassed: currentCheckpointIndex,
        lastCheckpointSegment: currentCheckpointIndex,
        timeBonusFlash: state.gameMode === "race" ? 0 : 1.5,
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
    // Race complete
    if (state.gameMode === "race") {
      // Race mode: lower time is better
      const isNewBest =
        state.bestTime === null || world.currentLapTime < state.bestTime;

      return {
        ...state,
        isGameOver: true,
        isWin: true,
        screen: "results",
        score: state.score,
        bestScore: state.bestScore,
        bestTime: isNewBest ? world.currentLapTime : state.bestTime,
        timeBonusFlash: 0,
      };
    }

    // Time mode: higher remaining time is better
    const finalScore =
      state.score + Math.floor(state.currentTime * 50) + LAP_SCORE_BONUS;
    const isNewBest = state.bestScore === null || finalScore > state.bestScore;

    return {
      ...state,
      isGameOver: true,
      isWin: true,
      screen: "results",
      score: finalScore,
      bestScore: isNewBest ? finalScore : state.bestScore,
      bestTime: isNewBest ? world.currentLapTime : state.bestTime,
      timeBonusFlash: 0,
    };
  }

  // Lap complete but race continues
  if (state.gameMode === "race") {
    return {
      ...state,
      lap: newLap,
      checkpointsPassed: 0,
      lastCheckpointSegment: 0,
      timeBonusFlash: 2,
    };
  }

  // Time mode: add time bonus
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
  currentTime: state.gameMode === "race" ? 0 : state.timeLimit,
  score: 0,
  lap: 1,
  checkpointsPassed: 0,
  lastCheckpointSegment: 0,
  isPaused: false,
  isGameOver: false,
  isWin: false,
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

export const toggleGameMode = (
  state: TimeChallengeState,
): TimeChallengeState => ({
  ...state,
  gameMode: state.gameMode === "time" ? "race" : "time",
});
