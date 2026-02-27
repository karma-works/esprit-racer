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
  segments = [];

  addStraight(ROAD.LENGTH.SHORT, segmentLength, rumbleLength);
  addLowRollingHills(segmentLength, rumbleLength);
  addSCurves(segmentLength, rumbleLength);
  addCurve(
    ROAD.LENGTH.MEDIUM,
    ROAD.CURVE.MEDIUM,
    ROAD.HILL.LOW,
    segmentLength,
    rumbleLength,
  );
  addBumps(segmentLength, rumbleLength);
  addCurve(
    ROAD.LENGTH.LONG,
    ROAD.CURVE.MEDIUM,
    ROAD.HILL.MEDIUM,
    segmentLength,
    rumbleLength,
  );
  addStraight(ROAD.LENGTH.MEDIUM, segmentLength, rumbleLength);
  addHill(ROAD.LENGTH.MEDIUM, ROAD.HILL.HIGH, segmentLength, rumbleLength);
  addCurve(
    ROAD.LENGTH.MEDIUM,
    -ROAD.CURVE.MEDIUM,
    ROAD.HILL.NONE,
    segmentLength,
    rumbleLength,
  );
  addDownhillToEnd(segmentLength, rumbleLength);

  resetSprites();

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
