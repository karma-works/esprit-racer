import type {
  PlayerState,
  PlayerRaceState,
  RaceState,
} from "../../engine/types";
import type { WorldState } from "../../engine/world";

export type GameScreen =
  | "main-menu"
  | "music-select"
  | "car-select"
  | "difficulty-select"
  | "standings"
  | "recs"
  | "racing"
  | "race-results";

export interface MultiplayerRaceState {
  screen: GameScreen;
  isPaused: boolean;
  isGameOver: boolean;
  raceState: RaceState;
  playerCount: number;
  totalLaps: number;
}

export const DEFAULT_LAPS = 3;
export const RACE_START_COUNTDOWN = 3;

export const createPlayerRaceState = (playerId: number): PlayerRaceState => ({
  playerId,
  position: 0,
  lap: 1,
  lastLapTime: null,
  finished: false,
  finishTime: null,
  rank: 0,
});

export const createRaceState = (playerCount: number): RaceState => ({
  playerStates: Array.from({ length: playerCount }, (_, i) =>
    createPlayerRaceState(i),
  ),
  winner: null,
  isPaused: false,
  countdown: RACE_START_COUNTDOWN,
  countdownTimer: 0,
});

export const createMultiplayerRaceState = (
  playerCount: number = 1,
): MultiplayerRaceState => ({
  screen: "main-menu",
  isPaused: false,
  isGameOver: false,
  raceState: createRaceState(playerCount),
  playerCount,
  totalLaps: DEFAULT_LAPS,
});

export const updateRaceCountdown = (
  state: MultiplayerRaceState,
  dt: number,
): MultiplayerRaceState => {
  if (state.screen !== "racing" || state.isPaused) {
    return state;
  }

  const raceState = state.raceState;
  if (raceState.countdown > 0) {
    raceState.countdownTimer += dt;
    if (raceState.countdownTimer >= 1) {
      raceState.countdown--;
      raceState.countdownTimer = 0;
    }
    return { ...state };
  }

  return state;
};

export const checkLapComplete = (
  state: MultiplayerRaceState,
  playerIndex: number,
  world: WorldState,
): MultiplayerRaceState => {
  if (state.screen !== "racing" || state.isPaused || state.isGameOver) {
    return state;
  }

  const playerState = state.raceState.playerStates[playerIndex];
  if (!playerState || playerState.finished) {
    return state;
  }

  const player = world.players[playerIndex];
  if (!player) return state;

  const prevPosition = playerState.position;
  playerState.position = player.position;

  if (
    prevPosition > world.trackLength * 0.8 &&
    player.position < world.player.z
  ) {
    playerState.lap++;
    playerState.lastLapTime = world.currentLapTime;

    if (playerState.lap > state.totalLaps) {
      playerState.finished = true;
      playerState.finishTime = Date.now();

      const finishedPlayers = state.raceState.playerStates.filter(
        (p) => p.finished,
      ).length;
      playerState.rank = finishedPlayers;

      if (state.raceState.winner === null) {
        state.raceState.winner = playerIndex;
      }

      const allFinished = state.raceState.playerStates.every((p) => p.finished);
      if (allFinished) {
        state.isGameOver = true;
        state.screen = "race-results";
      }
    }
  }

  return { ...state };
};

export const checkRaceComplete = (
  state: MultiplayerRaceState,
): { complete: boolean; winner: number | null } => {
  if (state.raceState.winner !== null) {
    const allFinished = state.raceState.playerStates.every((p) => p.finished);
    return { complete: allFinished, winner: state.raceState.winner };
  }
  return { complete: false, winner: null };
};

export const getPlayerRankings = (
  state: MultiplayerRaceState,
  world: WorldState,
): Array<{ playerId: number; rank: number; lap: number; position: number }> => {
  const players = state.raceState.playerStates.map((ps, idx) => {
    const player = world.players[idx];
    const totalProgress =
      (ps.lap - 1) * world.trackLength + (player?.position ?? 0);
    return {
      playerId: idx,
      rank: ps.rank,
      lap: ps.lap,
      position: player?.position ?? 0,
      totalProgress,
      finished: ps.finished,
      finishTime: ps.finishTime,
    };
  });

  players.sort((a, b) => {
    if (a.finished && b.finished) {
      return (a.finishTime ?? 0) - (b.finishTime ?? 0);
    }
    if (a.finished) return -1;
    if (b.finished) return 1;
    return b.totalProgress - a.totalProgress;
  });

  return players.map((p, idx) => ({
    playerId: p.playerId,
    rank: p.finished ? p.rank : idx + 1,
    lap: p.lap,
    position: p.position,
  }));
};

export const startRace = (
  state: MultiplayerRaceState,
  playerCount: number = 1,
): MultiplayerRaceState => ({
  ...state,
  screen: "racing",
  isPaused: false,
  isGameOver: false,
  raceState: createRaceState(playerCount),
  playerCount,
});

export const pauseRace = (
  state: MultiplayerRaceState,
): MultiplayerRaceState => ({
  ...state,
  isPaused: true,
  raceState: { ...state.raceState, isPaused: true },
});

export const resumeRace = (
  state: MultiplayerRaceState,
): MultiplayerRaceState => ({
  ...state,
  isPaused: false,
  raceState: { ...state.raceState, isPaused: false },
});

export const returnToMenu = (
  state: MultiplayerRaceState,
): MultiplayerRaceState => ({
  ...createMultiplayerRaceState(state.playerCount),
});

export const isRaceActive = (state: MultiplayerRaceState): boolean => {
  return state.screen === "racing" && !state.isPaused && !state.isGameOver;
};

export const isCountdownActive = (state: MultiplayerRaceState): boolean => {
  return state.raceState.countdown > 0;
};

export const getCountdownDisplay = (state: MultiplayerRaceState): string => {
  const count = state.raceState.countdown;
  return count > 0 ? count.toString() : "GO!";
};
