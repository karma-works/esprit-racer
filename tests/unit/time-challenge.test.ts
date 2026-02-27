import { describe, it, expect } from "vitest";
import {
  calculateTimeLimit,
  createTimeChallengeState,
  CHECKPOINTS_PER_LAP,
  BASE_TIME_PER_SEGMENT,
  MIN_TIME_LIMIT,
} from "../../src/game/modes/time-challenge";

describe("Time Challenge", () => {
  describe("calculateTimeLimit", () => {
    it("calculates time based on track length", () => {
      const segmentLength = 200;
      const trackLength = 1000 * segmentLength;
      const expectedTime = Math.floor(1000 * BASE_TIME_PER_SEGMENT);

      expect(calculateTimeLimit(trackLength, segmentLength)).toBe(expectedTime);
    });

    it("returns minimum time for short tracks", () => {
      const segmentLength = 200;
      const trackLength = 100 * segmentLength;

      expect(calculateTimeLimit(trackLength, segmentLength)).toBe(
        MIN_TIME_LIMIT,
      );
    });

    it("handles zero track length", () => {
      expect(calculateTimeLimit(0, 200)).toBe(MIN_TIME_LIMIT);
    });
  });

  describe("createTimeChallengeState", () => {
    it("creates state with calculated time limit", () => {
      const segmentLength = 200;
      const trackLength = 1000 * segmentLength;
      const expectedTime = Math.floor(1000 * BASE_TIME_PER_SEGMENT);

      const state = createTimeChallengeState(trackLength, segmentLength);

      expect(state.timeLimit).toBe(expectedTime);
      expect(state.currentTime).toBe(expectedTime);
    });

    it("creates state with default time limit when no track length", () => {
      const state = createTimeChallengeState();

      expect(state.timeLimit).toBe(45);
    });

    it("initializes checkpoint count", () => {
      const state = createTimeChallengeState(100000, 200);

      expect(state.totalCheckpoints).toBe(CHECKPOINTS_PER_LAP);
      expect(state.checkpointsPassed).toBe(0);
    });
  });
});
