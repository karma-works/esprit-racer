import { describe, it, expect, beforeEach } from "vitest";
import {
  getSegments,
  setSegments,
  findSegment,
  getLastY,
  addSegment,
  addSprite,
  addRoad,
  addStraight,
  addHill,
  addCurve,
  addLowRollingHills,
  addSCurves,
  addBumps,
  resetRoad,
} from "../../src/engine/segments";
import { COLORS, ROAD } from "../../src/engine/constants";

describe("segments", () => {
  const segmentLength = 200;
  const rumbleLength = 3;
  const playerZ = 2000;

  beforeEach(() => {
    setSegments([]);
  });

  describe("getSegments and setSegments", () => {
    it("starts with empty array", () => {
      setSegments([]);
      expect(getSegments()).toHaveLength(0);
    });

    it("can set segments", () => {
      setSegments([
        {
          index: 0,
          p1: {
            world: { x: 0, y: 0, z: 0 },
            camera: { x: 0, y: 0, z: 0 },
            screen: { x: 0, y: 0, scale: 0 },
          },
          p2: {
            world: { x: 0, y: 0, z: 200 },
            camera: { x: 0, y: 0, z: 0 },
            screen: { x: 0, y: 0, scale: 0 },
          },
          curve: 0,
          sprites: [],
          cars: [],
          color: COLORS.LIGHT,
        },
      ]);
      expect(getSegments()).toHaveLength(1);
    });
  });

  describe("addSegment", () => {
    it("adds a segment to the array", () => {
      addSegment(0, 0, segmentLength, rumbleLength);
      const segments = getSegments();
      expect(segments).toHaveLength(1);
      expect(segments[0]!.index).toBe(0);
      expect(segments[0]!.curve).toBe(0);
    });

    it("sets correct z positions", () => {
      addSegment(0, 0, segmentLength, rumbleLength);
      const segments = getSegments();
      expect(segments[0]!.p1.world.z).toBe(0);
      expect(segments[0]!.p2.world.z).toBe(segmentLength);
    });

    it("sets alternating colors based on rumbleLength", () => {
      for (let i = 0; i < 6; i++) {
        addSegment(0, 0, segmentLength, rumbleLength);
      }
      const segments = getSegments();
      expect(segments[0]!.color).toEqual(COLORS.LIGHT);
      expect(segments[1]!.color).toEqual(COLORS.LIGHT);
      expect(segments[2]!.color).toEqual(COLORS.LIGHT);
      expect(segments[3]!.color).toEqual(COLORS.DARK);
      expect(segments[4]!.color).toEqual(COLORS.DARK);
      expect(segments[5]!.color).toEqual(COLORS.DARK);
    });
  });

  describe("getLastY", () => {
    it("returns 0 for empty segments", () => {
      expect(getLastY()).toBe(0);
    });

    it("returns p2 y of last segment", () => {
      addSegment(0, 100, segmentLength, rumbleLength);
      expect(getLastY()).toBe(100);
    });
  });

  describe("findSegment", () => {
    it("finds correct segment for z position", () => {
      for (let i = 0; i < 5; i++) {
        addSegment(0, 0, segmentLength, rumbleLength);
      }
      const segment = findSegment(400, segmentLength);
      expect(segment.index).toBe(2);
    });

    it("wraps around for z beyond track length", () => {
      for (let i = 0; i < 5; i++) {
        addSegment(0, 0, segmentLength, rumbleLength);
      }
      const segment = findSegment(1200, segmentLength);
      expect(segment.index).toBe(1);
    });
  });

  describe("addSprite", () => {
    it("adds sprite to segment", () => {
      addSegment(0, 0, segmentLength, rumbleLength);
      const sprite = { x: 0, y: 0, w: 80, h: 41 };
      addSprite(0, sprite, 1.5);

      const segments = getSegments();
      expect(segments[0]!.sprites).toHaveLength(1);
      expect(segments[0]!.sprites[0]!.offset).toBe(1.5);
    });

    it("does nothing for non-existent segment", () => {
      const sprite = { x: 0, y: 0, w: 80, h: 41 };
      addSprite(999, sprite, 1.5);
      expect(getSegments()).toHaveLength(0);
    });
  });

  describe("addRoad", () => {
    it("creates enter + hold + leave segments", () => {
      addRoad(2, 3, 2, 0, 0, segmentLength, rumbleLength);
      expect(getSegments()).toHaveLength(7);
    });

    it("applies curve with easing", () => {
      addRoad(5, 0, 5, 10, 0, segmentLength, rumbleLength);
      const segments = getSegments();
      expect(segments[0]!.curve).toBe(0);
      expect(segments[4]!.curve).toBeGreaterThan(0);
      expect(segments[4]!.curve).toBeLessThan(10);
    });

    it("applies height with easing", () => {
      addRoad(5, 0, 5, 0, 1, segmentLength, rumbleLength);
      const segments = getSegments();
      expect(segments[0]!.p1.world.y).toBe(0);
      expect(segments[9]!.p2.world.y).toBeGreaterThan(0);
    });
  });

  describe("addStraight", () => {
    it("creates straight road segments", () => {
      addStraight(ROAD.LENGTH.MEDIUM, segmentLength, rumbleLength);
      const segments = getSegments();
      expect(segments.length).toBe(ROAD.LENGTH.MEDIUM * 3);

      for (const seg of segments) {
        expect(seg.curve).toBe(0);
      }
    });
  });

  describe("addHill", () => {
    it("creates hill with height variation", () => {
      addHill(
        ROAD.LENGTH.MEDIUM,
        ROAD.HILL.MEDIUM,
        segmentLength,
        rumbleLength,
      );
      const segments = getSegments();

      const startHeight = segments[0]!.p1.world.y;
      const endHeight = segments[segments.length - 1]!.p2.world.y;
      expect(endHeight).toBeGreaterThan(startHeight);
    });
  });

  describe("addCurve", () => {
    it("creates curved road", () => {
      addCurve(
        ROAD.LENGTH.MEDIUM,
        ROAD.CURVE.MEDIUM,
        ROAD.HILL.NONE,
        segmentLength,
        rumbleLength,
      );
      const segments = getSegments();

      const curves = segments.map((s) => s.curve);
      const hasCurve = curves.some((c) => c !== 0);
      expect(hasCurve).toBe(true);
    });
  });

  describe("addLowRollingHills", () => {
    it("creates varied terrain", () => {
      addLowRollingHills(segmentLength, rumbleLength);
      const segments = getSegments();
      expect(segments.length).toBeGreaterThan(0);
    });
  });

  describe("addSCurves", () => {
    it("creates S-shaped curves", () => {
      addSCurves(segmentLength, rumbleLength);
      const segments = getSegments();

      const curves = segments.map((s) => s.curve);
      const hasPositive = curves.some((c) => c > 0);
      const hasNegative = curves.some((c) => c < 0);
      expect(hasPositive && hasNegative).toBe(true);
    });
  });

  describe("addBumps", () => {
    it("creates bumpy terrain", () => {
      addBumps(segmentLength, rumbleLength);
      const segments = getSegments();
      expect(segments.length).toBe(240);
    });
  });

  describe("resetRoad", () => {
    it("creates complete track", () => {
      const trackLength = resetRoad(segmentLength, rumbleLength, playerZ);
      const segments = getSegments();

      expect(segments.length).toBeGreaterThan(0);
      expect(trackLength).toBe(segments.length * segmentLength);
    });

    it("marks start segments", () => {
      resetRoad(segmentLength, rumbleLength, playerZ);
      const segments = getSegments();

      const startSegmentIndex = Math.floor(playerZ / segmentLength);
      expect(segments[startSegmentIndex + 2]!.color).toEqual(COLORS.START);
      expect(segments[startSegmentIndex + 3]!.color).toEqual(COLORS.START);
    });

    it("marks finish segments", () => {
      resetRoad(segmentLength, rumbleLength, playerZ);
      const segments = getSegments();

      for (let i = 0; i < rumbleLength; i++) {
        expect(segments[segments.length - 1 - i]!.color).toEqual(COLORS.FINISH);
      }
    });

    it("marks checkpoint segments", () => {
      resetRoad(segmentLength, rumbleLength, playerZ);
      const segments = getSegments();
      const totalSegments = segments.length;
      const segmentsPerCheckpoint = Math.floor(totalSegments / 5);

      let checkpointCount = 0;
      for (let i = 1; i <= 4; i++) {
        const checkpointIndex = segmentsPerCheckpoint * i;
        if (checkpointIndex < totalSegments - rumbleLength) {
          expect(segments[checkpointIndex]!.color).toEqual(COLORS.CHECKPOINT);
          checkpointCount++;
        }
      }
      expect(checkpointCount).toBeGreaterThan(0);
    });
  });
});
