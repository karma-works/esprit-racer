import type { Segment, SegmentSprite, Sprite } from "./types";
import {
  COLORS,
  ROAD,
  SPRITES,
  SPRITE_SCALE,
  SPRITE_GROUPS,
} from "./constants";
import * as Util from "./utils/math";

let segments: Segment[] = [];

export const getSegments = (): Segment[] => segments;
export const setSegments = (s: Segment[]): void => {
  segments = s;
};

export const findSegment = (z: number, segmentLength: number): Segment => {
  const index = Math.floor(z / segmentLength) % segments.length;
  return segments[index]!;
};

export const getLastY = (): number => {
  if (segments.length === 0) return 0;
  return segments[segments.length - 1]!.p2.world.y;
};

export const addSegment = (
  curve: number,
  y: number,
  segmentLength: number,
  rumbleLength: number,
): void => {
  const n = segments.length;
  segments.push({
    index: n,
    p1: {
      world: { x: 0, y: getLastY(), z: n * segmentLength },
      camera: { x: 0, y: 0, z: 0 },
      screen: { x: 0, y: 0, scale: 0, w: 0 },
    },
    p2: {
      world: { x: 0, y, z: (n + 1) * segmentLength },
      camera: { x: 0, y: 0, z: 0 },
      screen: { x: 0, y: 0, scale: 0, w: 0 },
    },
    curve,
    sprites: [],
    cars: [],
    color: Math.floor(n / rumbleLength) % 2 ? COLORS.DARK : COLORS.LIGHT,
  });
};

export const addSprite = (n: number, sprite: Sprite, offset: number): void => {
  if (segments[n]) {
    segments[n]!.sprites.push({ source: sprite, offset });
  }
};

export const addRoad = (
  enter: number,
  hold: number,
  leave: number,
  curve: number,
  y: number,
  segmentLength: number,
  rumbleLength: number,
): void => {
  const startY = getLastY();
  const endY = startY + Util.toInt(y, 0) * segmentLength;
  const total = enter + hold + leave;

  for (let n = 0; n < enter; n++) {
    addSegment(
      Util.easeIn(0, curve, n / enter),
      Util.easeInOut(startY, endY, n / total),
      segmentLength,
      rumbleLength,
    );
  }
  for (let n = 0; n < hold; n++) {
    addSegment(
      curve,
      Util.easeInOut(startY, endY, (enter + n) / total),
      segmentLength,
      rumbleLength,
    );
  }
  for (let n = 0; n < leave; n++) {
    addSegment(
      Util.easeInOut(curve, 0, n / leave),
      Util.easeInOut(startY, endY, (enter + hold + n) / total),
      segmentLength,
      rumbleLength,
    );
  }
};

export const addStraight = (
  num: number,
  segmentLength: number,
  rumbleLength: number,
): void => {
  const n = num || ROAD.LENGTH.MEDIUM;
  addRoad(n, n, n, 0, 0, segmentLength, rumbleLength);
};

export const addHill = (
  num: number,
  height: number,
  segmentLength: number,
  rumbleLength: number,
): void => {
  const n = num || ROAD.LENGTH.MEDIUM;
  const h = height || ROAD.HILL.MEDIUM;
  addRoad(n, n, n, 0, h, segmentLength, rumbleLength);
};

export const addCurve = (
  num: number,
  curve: number,
  height: number,
  segmentLength: number,
  rumbleLength: number,
): void => {
  const n = num || ROAD.LENGTH.MEDIUM;
  const c = curve || ROAD.CURVE.MEDIUM;
  const h = height || ROAD.HILL.NONE;
  addRoad(n, n, n, c, h, segmentLength, rumbleLength);
};

export const addLowRollingHills = (
  segmentLength: number,
  rumbleLength: number,
): void => {
  addRoad(
    ROAD.LENGTH.SHORT,
    ROAD.LENGTH.SHORT,
    ROAD.LENGTH.SHORT,
    0,
    ROAD.HILL.LOW / 2,
    segmentLength,
    rumbleLength,
  );
  addRoad(
    ROAD.LENGTH.SHORT,
    ROAD.LENGTH.SHORT,
    ROAD.LENGTH.SHORT,
    0,
    -ROAD.HILL.LOW,
    segmentLength,
    rumbleLength,
  );
  addRoad(
    ROAD.LENGTH.SHORT,
    ROAD.LENGTH.SHORT,
    ROAD.LENGTH.SHORT,
    ROAD.CURVE.EASY,
    ROAD.HILL.LOW,
    segmentLength,
    rumbleLength,
  );
  addRoad(
    ROAD.LENGTH.SHORT,
    ROAD.LENGTH.SHORT,
    ROAD.LENGTH.SHORT,
    0,
    0,
    segmentLength,
    rumbleLength,
  );
  addRoad(
    ROAD.LENGTH.SHORT,
    ROAD.LENGTH.SHORT,
    ROAD.LENGTH.SHORT,
    -ROAD.CURVE.EASY,
    ROAD.HILL.LOW / 2,
    segmentLength,
    rumbleLength,
  );
  addRoad(
    ROAD.LENGTH.SHORT,
    ROAD.LENGTH.SHORT,
    ROAD.LENGTH.SHORT,
    0,
    0,
    segmentLength,
    rumbleLength,
  );
};

export const addSCurves = (
  segmentLength: number,
  rumbleLength: number,
): void => {
  addRoad(
    ROAD.LENGTH.MEDIUM,
    ROAD.LENGTH.MEDIUM,
    ROAD.LENGTH.MEDIUM,
    -ROAD.CURVE.EASY,
    ROAD.HILL.NONE,
    segmentLength,
    rumbleLength,
  );
  addRoad(
    ROAD.LENGTH.MEDIUM,
    ROAD.LENGTH.MEDIUM,
    ROAD.LENGTH.MEDIUM,
    ROAD.CURVE.MEDIUM,
    ROAD.HILL.MEDIUM,
    segmentLength,
    rumbleLength,
  );
  addRoad(
    ROAD.LENGTH.MEDIUM,
    ROAD.LENGTH.MEDIUM,
    ROAD.LENGTH.MEDIUM,
    ROAD.CURVE.EASY,
    -ROAD.HILL.LOW,
    segmentLength,
    rumbleLength,
  );
  addRoad(
    ROAD.LENGTH.MEDIUM,
    ROAD.LENGTH.MEDIUM,
    ROAD.LENGTH.MEDIUM,
    -ROAD.CURVE.EASY,
    ROAD.HILL.MEDIUM,
    segmentLength,
    rumbleLength,
  );
  addRoad(
    ROAD.LENGTH.MEDIUM,
    ROAD.LENGTH.MEDIUM,
    ROAD.LENGTH.MEDIUM,
    -ROAD.CURVE.MEDIUM,
    -ROAD.HILL.MEDIUM,
    segmentLength,
    rumbleLength,
  );
};

export const addBumps = (segmentLength: number, rumbleLength: number): void => {
  addRoad(10, 10, 10, 0, 5, segmentLength, rumbleLength);
  addRoad(10, 10, 10, 0, -2, segmentLength, rumbleLength);
  addRoad(10, 10, 10, 0, -5, segmentLength, rumbleLength);
  addRoad(10, 10, 10, 0, 8, segmentLength, rumbleLength);
  addRoad(10, 10, 10, 0, 5, segmentLength, rumbleLength);
  addRoad(10, 10, 10, 0, -7, segmentLength, rumbleLength);
  addRoad(10, 10, 10, 0, 5, segmentLength, rumbleLength);
  addRoad(10, 10, 10, 0, -2, segmentLength, rumbleLength);
};

export const addDownhillToEnd = (
  segmentLength: number,
  rumbleLength: number,
): void => {
  addRoad(
    200,
    200,
    200,
    -ROAD.CURVE.EASY,
    -getLastY() / segmentLength,
    segmentLength,
    rumbleLength,
  );
};

export const resetSprites = (): void => {
  addSprite(20, SPRITES.BILLBOARD07, -1);
  addSprite(40, SPRITES.BILLBOARD06, -1);
  addSprite(60, SPRITES.BILLBOARD08, -1);
  addSprite(80, SPRITES.BILLBOARD09, -1);
  addSprite(100, SPRITES.BILLBOARD01, -1);
  addSprite(120, SPRITES.BILLBOARD02, -1);
  addSprite(140, SPRITES.BILLBOARD03, -1);
  addSprite(160, SPRITES.BILLBOARD04, -1);
  addSprite(180, SPRITES.BILLBOARD05, -1);

  addSprite(240, SPRITES.BILLBOARD07, -1.2);
  addSprite(240, SPRITES.BILLBOARD06, 1.2);
  addSprite(segments.length - 25, SPRITES.BILLBOARD07, -1.2);
  addSprite(segments.length - 25, SPRITES.BILLBOARD06, 1.2);

  for (let n = 10; n < 200; n += 4 + Math.floor(n / 100)) {
    addSprite(n, SPRITES.PALM_TREE, 0.5 + Math.random() * 0.5);
    addSprite(n, SPRITES.PALM_TREE, 1 + Math.random() * 2);
  }

  for (let n = 250; n < 1000; n += 5) {
    addSprite(n, SPRITES.COLUMN, 1.1);
    addSprite(n + Util.randomInt(0, 5), SPRITES.TREE1, -1 - Math.random() * 2);
    addSprite(n + Util.randomInt(0, 5), SPRITES.TREE2, -1 - Math.random() * 2);
  }

  for (let n = 200; n < segments.length; n += 3) {
    addSprite(
      n,
      Util.randomChoice(SPRITE_GROUPS.PLANTS),
      Util.randomChoice([1, -1]) * (2 + Math.random() * 5),
    );
  }

  for (let n = 1000; n < segments.length - 50; n += 100) {
    const side = Util.randomChoice([1, -1]);
    addSprite(
      n + Util.randomInt(0, 50),
      Util.randomChoice(SPRITE_GROUPS.BILLBOARDS),
      -side,
    );
    for (let i = 0; i < 20; i++) {
      const sprite = Util.randomChoice(SPRITE_GROUPS.PLANTS);
      const offset = side * (1.5 + Math.random());
      addSprite(n + Util.randomInt(0, 50), sprite, offset);
    }
  }
};

export const CHECKPOINTS_PER_LAP = 4;

export const resetRoad = (
  segmentLength: number,
  rumbleLength: number,
  playerZ: number,
): number => {
  return resetRoadForTheme("night", segmentLength, rumbleLength, playerZ);
};

/**
 * Generate a distinct, shorter track layout for each theme.
 * Target: ~150-220 base segments, finishable in ~2 min (3 laps) at normal speed.
 */
export const resetRoadForTheme = (
  themeId: string,
  segmentLength: number,
  rumbleLength: number,
  playerZ: number,
): number => {
  segments = [];

  const S = ROAD.LENGTH.SHORT;   // 25
  const M = ROAD.LENGTH.MEDIUM;  // 50
  const L = ROAD.LENGTH.LONG;    // 100
  const CE = ROAD.CURVE.EASY;
  const CM = ROAD.CURVE.MEDIUM;
  const CH = ROAD.CURVE.HARD;
  const HL = ROAD.HILL.LOW;
  const HM = ROAD.HILL.MEDIUM;
  const HH = ROAD.HILL.HIGH;

  // Build one of 13 distinct track layouts based on theme
  switch (themeId) {
    case "night":
      // Fast sweeping highway — lots of long curves, gentle hills
      addStraight(S, segmentLength, rumbleLength);
      addCurve(M, CE, HL, segmentLength, rumbleLength);
      addStraight(S, segmentLength, rumbleLength);
      addCurve(M, -CE, 0, segmentLength, rumbleLength);
      addCurve(S, CM, HM, segmentLength, rumbleLength);
      addStraight(M, segmentLength, rumbleLength);
      addCurve(S, -CM, HL, segmentLength, rumbleLength);
      addStraight(S, segmentLength, rumbleLength);
      break;

    case "fog":
      // Slow, cautious — short sightlines & tight corners
      addStraight(S, segmentLength, rumbleLength);
      addCurve(S, CM, 0, segmentLength, rumbleLength);
      addCurve(S, -CH, HL, segmentLength, rumbleLength);
      addStraight(S, segmentLength, rumbleLength);
      addCurve(S, CH, HM, segmentLength, rumbleLength);
      addBumps(segmentLength, rumbleLength);
      addCurve(S, -CM, 0, segmentLength, rumbleLength);
      break;

    case "snow":
      // Twisty alpine village — S-curves with moderate hills
      addStraight(S, segmentLength, rumbleLength);
      addSCurves(segmentLength, rumbleLength);
      addHill(S, HL, segmentLength, rumbleLength);
      addCurve(S, CM, 0, segmentLength, rumbleLength);
      addBumps(segmentLength, rumbleLength);
      addCurve(S, -CM, HM, segmentLength, rumbleLength);
      addStraight(S, segmentLength, rumbleLength);
      break;

    case "storm":
      // Chaotic rain-soaked highway — medium curves, rolling bumps
      addStraight(S, segmentLength, rumbleLength);
      addCurve(S, CE, 0, segmentLength, rumbleLength);
      addBumps(segmentLength, rumbleLength);
      addCurve(M, -CM, HL, segmentLength, rumbleLength);
      addBumps(segmentLength, rumbleLength);
      addCurve(S, CE, HM, segmentLength, rumbleLength);
      addStraight(S, segmentLength, rumbleLength);
      break;

    case "desert":
      // Long open road, gentle curves, a few dunes
      addStraight(M, segmentLength, rumbleLength);
      addCurve(S, CE, HL, segmentLength, rumbleLength);
      addStraight(M, segmentLength, rumbleLength);
      addHill(S, HM, segmentLength, rumbleLength);
      addStraight(S, segmentLength, rumbleLength);
      addCurve(S, -CE, HL, segmentLength, rumbleLength);
      addStraight(S, segmentLength, rumbleLength);
      break;

    case "future":
      // Technical circuit — chicanes, sharp curves, turbo straights
      addStraight(S, segmentLength, rumbleLength);
      addCurve(S, CH, 0, segmentLength, rumbleLength);
      addCurve(S, -CH, 0, segmentLength, rumbleLength);
      addStraight(S, segmentLength, rumbleLength);
      addCurve(S, CM, HL, segmentLength, rumbleLength);
      addStraight(S, segmentLength, rumbleLength);
      addCurve(S, -CM, 0, segmentLength, rumbleLength);
      addCurve(S, CE, HM, segmentLength, rumbleLength);
      break;

    case "marsh":
      // Winding swamp road — many medium curves, slippery feel
      addCurve(S, CM, HL, segmentLength, rumbleLength);
      addCurve(S, -CM, HL, segmentLength, rumbleLength);
      addBumps(segmentLength, rumbleLength);
      addCurve(S, CM, 0, segmentLength, rumbleLength);
      addStraight(S, segmentLength, rumbleLength);
      addCurve(S, -CH, HM, segmentLength, rumbleLength);
      addStraight(S, segmentLength, rumbleLength);
      break;

    case "mountains":
      // Steep switchback — lots of extreme curves, high hills
      addStraight(S, segmentLength, rumbleLength);
      addCurve(S, CH, HH, segmentLength, rumbleLength);
      addCurve(S, -CH, HM, segmentLength, rumbleLength);
      addStraight(S, segmentLength, rumbleLength);
      addHill(S, HH, segmentLength, rumbleLength);
      addCurve(S, CM, HL, segmentLength, rumbleLength);
      addCurve(S, -CM, 0, segmentLength, rumbleLength);
      break;

    case "lakes":
      // Scenic lakeside — gently rolling, medium curves
      addStraight(S, segmentLength, rumbleLength);
      addLowRollingHills(segmentLength, rumbleLength);
      addCurve(S, CM, HL, segmentLength, rumbleLength);
      addStraight(S, segmentLength, rumbleLength);
      addCurve(S, -CM, HM, segmentLength, rumbleLength);
      addLowRollingHills(segmentLength, rumbleLength);
      break;

    case "country":
      // Countryside lanes — rolling hills, gentle curves
      addStraight(S, segmentLength, rumbleLength);
      addLowRollingHills(segmentLength, rumbleLength);
      addCurve(S, CE, HL, segmentLength, rumbleLength);
      addHill(S, HM, segmentLength, rumbleLength);
      addStraight(S, segmentLength, rumbleLength);
      addCurve(S, -CE, 0, segmentLength, rumbleLength);
      addLowRollingHills(segmentLength, rumbleLength);
      break;

    case "city":
      // Urban grid — sharp 90° feel, mostly flat
      addStraight(M, segmentLength, rumbleLength);
      addCurve(S, CH, 0, segmentLength, rumbleLength);
      addStraight(M, segmentLength, rumbleLength);
      addCurve(S, -CH, 0, segmentLength, rumbleLength);
      addStraight(S, segmentLength, rumbleLength);
      addCurve(S, CM, HL, segmentLength, rumbleLength);
      addStraight(S, segmentLength, rumbleLength);
      break;

    case "roadworks":
      // Construction maze — bumpy, twisty, slow
      addStraight(S, segmentLength, rumbleLength);
      addBumps(segmentLength, rumbleLength);
      addCurve(S, CM, 0, segmentLength, rumbleLength);
      addBumps(segmentLength, rumbleLength);
      addCurve(S, -CM, HL, segmentLength, rumbleLength);
      addStraight(S, segmentLength, rumbleLength);
      addBumps(segmentLength, rumbleLength);
      break;

    case "windy":
      // Open plains — long straights punctuated by big curves
      addStraight(M, segmentLength, rumbleLength);
      addCurve(S, CE, 0, segmentLength, rumbleLength);
      addStraight(M, segmentLength, rumbleLength);
      addCurve(S, -CE, HL, segmentLength, rumbleLength);
      addStraight(S, segmentLength, rumbleLength);
      addHill(S, HL, segmentLength, rumbleLength);
      addStraight(S, segmentLength, rumbleLength);
      break;

    default:
      // Original layout (fallback)
      addStraight(S, segmentLength, rumbleLength);
      addLowRollingHills(segmentLength, rumbleLength);
      addSCurves(segmentLength, rumbleLength);
      addCurve(M, CM, HL, segmentLength, rumbleLength);
      addBumps(segmentLength, rumbleLength);
      addCurve(S, -CM, HM, segmentLength, rumbleLength);
      addStraight(S, segmentLength, rumbleLength);
      break;
  }

  addDownhillToEnd(segmentLength, rumbleLength);

  // Add per-theme sprites (scenery variety)
  addThemeSprites(themeId);

  const playerSegment = findSegment(playerZ, segmentLength);
  segments[playerSegment.index + 2]!.color = COLORS.START;
  segments[playerSegment.index + 3]!.color = COLORS.START;

  const totalSegments = segments.length;
  const segmentsPerCheckpoint = Math.floor(
    totalSegments / (CHECKPOINTS_PER_LAP + 1),
  );

  for (let i = 1; i <= CHECKPOINTS_PER_LAP; i++) {
    const checkpointIndex = segmentsPerCheckpoint * i;
    if (checkpointIndex < totalSegments - rumbleLength) {
      segments[checkpointIndex]!.color = COLORS.CHECKPOINT;
      addSprite(checkpointIndex, SPRITES.CHECKPOINT_BANNER, 0);
    }
  }

  for (let n = 0; n < rumbleLength; n++) {
    segments[segments.length - 1 - n]!.color = COLORS.FINISH;
  }
  addSprite(segments.length - rumbleLength - 5, SPRITES.FINISH_BANNER, 0);

  return segments.length * segmentLength;
};

/**
 * Add scenery sprites characteristic to each theme.
 * Each theme gets a distinct visual identity on the roadside.
 */
const addThemeSprites = (themeId: string): void => {
  const len = segments.length;

  // Always: start billboards
  addSprite(20, SPRITES.BILLBOARD07, -1);
  addSprite(40, SPRITES.BILLBOARD06, 1);

  switch (themeId) {
    case "night":
    case "city":
      // Urban: columns, billboards, few trees
      for (let n = 50; n < len - 20; n += 8) {
        addSprite(n, SPRITES.COLUMN, 1.1);
        if (n % 24 === 0) addSprite(n, Util.randomChoice(SPRITE_GROUPS.BILLBOARDS), -1.2);
      }
      break;

    case "desert":
    case "windy":
      // Open: dead trees, boulders, sparse
      for (let n = 40; n < len - 10; n += 6) {
        addSprite(n, SPRITES.DEAD_TREE1, Util.randomChoice([1, -1]) * (1.5 + Math.random()));
        if (n % 30 === 0) addSprite(n, SPRITES.BOULDER3, Util.randomChoice([1, -1]) * 1.5);
      }
      break;

    case "snow":
    case "mountains":
      // Alpine: dense trees, boulders
      for (let n = 30; n < len - 10; n += 4) {
        addSprite(n, SPRITES.TREE1, Util.randomChoice([1, -1]) * (1.5 + Math.random()));
        if (n % 10 === 0) addSprite(n, SPRITES.BOULDER2, Util.randomChoice([1, -1]) * 2);
        if (n % 15 === 0) addSprite(n, SPRITES.TREE2, Util.randomChoice([1, -1]) * (2 + Math.random()));
      }
      break;

    case "future":
      // Sci-fi: columns + billboards only
      for (let n = 30; n < len - 10; n += 10) {
        addSprite(n, SPRITES.COLUMN, 1.1);
        addSprite(n, SPRITES.COLUMN, -1.1);
        if (n % 30 === 0) addSprite(n, Util.randomChoice(SPRITE_GROUPS.BILLBOARDS), 1.3);
      }
      break;

    case "marsh":
    case "lakes":
    case "country":
      // Green: dense mixed plants
      for (let n = 30; n < len - 10; n += 3) {
        addSprite(n, Util.randomChoice(SPRITE_GROUPS.PLANTS), Util.randomChoice([1, -1]) * (1.5 + Math.random() * 2));
        if (n % 20 === 0) addSprite(n, SPRITES.BILLBOARD02, -1.3);
      }
      break;

    case "roadworks":
      // Construction: billboards, boulders every few segments
      for (let n = 20; n < len - 5; n += 5) {
        addSprite(n, Util.randomChoice(SPRITE_GROUPS.BILLBOARDS), Util.randomChoice([1, -1]) * 1.2);
        if (n % 15 === 0) addSprite(n, SPRITES.BOULDER3, Util.randomChoice([1, -1]) * 1.4);
      }
      break;

    default:
      // Mixed: palm trees + billboards
      for (let n = 20; n < len - 10; n += 5) {
        addSprite(n, SPRITES.PALM_TREE, Util.randomChoice([1, -1]) * (1.5 + Math.random()));
        if (n % 25 === 0) addSprite(n, Util.randomChoice(SPRITE_GROUPS.BILLBOARDS), -1.3);
      }
      break;
  }
};

