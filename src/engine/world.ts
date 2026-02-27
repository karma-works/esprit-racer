import type {
  GameConfig,
  PlayerState,
  InputState,
  Car,
  Segment,
} from "./types";
import { SPRITE_SCALE, SPRITE_GROUPS, KEY } from "./constants";
import * as Util from "./utils/math";
import * as Segments from "./segments";
import * as Render from "./renderer/canvas";
import * as Camera from "./camera";

export interface WorldState {
  config: GameConfig;
  player: PlayerState;
  input: InputState;
  cars: Car[];
  segments: Segment[];
  trackLength: number;
  skyOffset: number;
  hillOffset: number;
  treeOffset: number;
  currentLapTime: number;
  lastLapTime: number | null;
  fastLapTime: number | null;
}

export const createDefaultConfig = (): GameConfig => ({
  fps: 60,
  width: 1024,
  height: 768,
  lanes: 3,
  roadWidth: 2000,
  segmentLength: 200,
  rumbleLength: 3,
  drawDistance: 300,
  fogDensity: 5,
  centrifugal: 0.3,
  maxSpeed: 200 / (1 / 60),
  accel: 200 / (1 / 60) / 5,
  braking: -(200 / (1 / 60)),
  decel: -(200 / (1 / 60)) / 5,
  offRoadDecel: -(200 / (1 / 60)) / 2,
  offRoadLimit: 200 / (1 / 60) / 4,
});

export const createDefaultPlayer = (playerZ: number): PlayerState => ({
  x: 0,
  z: playerZ,
  position: 0,
  speed: 0,
});

export const createDefaultInput = (): InputState => ({
  left: false,
  right: false,
  faster: false,
  slower: false,
});

export const createWorld = (): WorldState => {
  const config = createDefaultConfig();
  const cameraDepth = 1 / Math.tan(((100 / 2) * Math.PI) / 180);
  const playerZ = Camera.getPlayerZ(1000, cameraDepth);

  const trackLength = Segments.resetRoad(
    config.segmentLength,
    config.rumbleLength,
    playerZ,
  );
  const segments = Segments.getSegments();

  return {
    config,
    player: createDefaultPlayer(playerZ),
    input: createDefaultInput(),
    cars: [],
    segments,
    trackLength,
    skyOffset: 0,
    hillOffset: 0,
    treeOffset: 0,
    currentLapTime: 0,
    lastLapTime: null,
    fastLapTime: null,
  };
};

export const resetCars = (world: WorldState, totalCars: number): void => {
  world.cars = [];
  for (let n = 0; n < totalCars; n++) {
    const offset = Math.random() * Util.randomChoice([-0.8, 0.8]);
    const z =
      Math.floor(Math.random() * world.segments.length) *
      world.config.segmentLength;
    const sprite = Util.randomChoice(SPRITE_GROUPS.CARS);
    const maxSpeed = world.config.maxSpeed;
    const speed =
      maxSpeed / 4 +
      (Math.random() * maxSpeed) / (sprite === SPRITE_GROUPS.CARS[4] ? 4 : 2);

    const car: Car = { offset, z, sprite, speed };
    const segment = Segments.findSegment(car.z, world.config.segmentLength);
    segment.cars.push(car);
    world.cars.push(car);
  }
};

export const updateCarOffset = (
  car: Car,
  carSegment: Segment,
  playerSegment: Segment,
  playerX: number,
  playerW: number,
  speed: number,
  maxSpeed: number,
  drawDistance: number,
  segments: Segment[],
): number => {
  const lookahead = 20;
  const carW = car.sprite.w * SPRITE_SCALE;

  if (carSegment.index - playerSegment.index > drawDistance) return 0;

  for (let i = 1; i < lookahead; i++) {
    const segmentIndex = (carSegment.index + i) % segments.length;
    const segment = segments[segmentIndex];
    if (!segment) continue;

    if (segment === playerSegment && car.speed > speed) {
      if (Util.overlap(playerX, playerW, car.offset, carW, 1.2)) {
        const dir =
          playerX > 0.5
            ? -1
            : playerX < -0.5
              ? 1
              : car.offset > playerX
                ? 1
                : -1;
        return dir * (1 / i) * ((car.speed - speed) / maxSpeed);
      }
    }

    for (const otherCar of segment.cars) {
      const otherCarW = otherCar.sprite.w * SPRITE_SCALE;
      if (
        car.speed > otherCar.speed &&
        Util.overlap(car.offset, carW, otherCar.offset, otherCarW, 1.2)
      ) {
        const dir =
          otherCar.offset > 0.5
            ? -1
            : otherCar.offset < -0.5
              ? 1
              : car.offset > otherCar.offset
                ? 1
                : -1;
        return dir * (1 / i) * ((car.speed - otherCar.speed) / maxSpeed);
      }
    }
  }

  if (car.offset < -0.9) return 0.1;
  if (car.offset > 0.9) return -0.1;
  return 0;
};

export const updateCars = (
  world: WorldState,
  playerSegment: Segment,
  playerW: number,
): void => {
  const { segmentLength, drawDistance, maxSpeed } = world.config;

  for (const car of world.cars) {
    const oldSegment = Segments.findSegment(car.z, segmentLength);
    car.offset += updateCarOffset(
      car,
      oldSegment,
      playerSegment,
      world.player.x,
      playerW,
      world.player.speed,
      maxSpeed,
      drawDistance,
      world.segments,
    );
    car.z = Util.increase(
      car.z,
      (1 / world.config.fps) * car.speed,
      world.trackLength,
    );
    car.percent = Util.percentRemaining(car.z, segmentLength);

    const newSegment = Segments.findSegment(car.z, segmentLength);
    if (oldSegment !== newSegment) {
      const index = oldSegment.cars.indexOf(car);
      if (index >= 0) oldSegment.cars.splice(index, 1);
      newSegment.cars.push(car);
    }
  }
};

export const update = (world: WorldState, dt: number): void => {
  const { config, player, input } = world;
  const {
    segmentLength,
    maxSpeed,
    accel,
    braking,
    decel,
    offRoadDecel,
    offRoadLimit,
    centrifugal,
    lanes,
  } = config;

  const playerSegment = Segments.findSegment(
    player.position + player.z,
    segmentLength,
  );
  const playerW = SPRITE_GROUPS.CARS[0]!.w * SPRITE_SCALE;
  const speedPercent = player.speed / maxSpeed;
  const dx = dt * 2 * speedPercent;
  const startPosition = player.position;

  updateCars(world, playerSegment, playerW);

  player.position = Util.increase(
    player.position,
    dt * player.speed,
    world.trackLength,
  );

  if (input.left) player.x -= dx;
  else if (input.right) player.x += dx;

  player.x -= dx * speedPercent * playerSegment.curve * centrifugal;

  if (input.faster) player.speed = Util.accelerate(player.speed, accel, dt);
  else if (input.slower)
    player.speed = Util.accelerate(player.speed, braking, dt);
  else player.speed = Util.accelerate(player.speed, decel, dt);

  if (player.x < -1 || player.x > 1) {
    if (player.speed > offRoadLimit) {
      player.speed = Util.accelerate(player.speed, offRoadDecel, dt);
    }

    for (const sprite of playerSegment.sprites) {
      const spriteW = sprite.source.w * SPRITE_SCALE;
      const spriteOffset =
        sprite.offset + (spriteW / 2) * (sprite.offset > 0 ? 1 : -1);
      if (Util.overlap(player.x, playerW, spriteOffset, spriteW)) {
        player.speed = maxSpeed / 5;
        player.position = Util.increase(
          playerSegment.p1.world.z,
          -player.z,
          world.trackLength,
        );
        break;
      }
    }
  }

  for (const car of playerSegment.cars) {
    const carW = car.sprite.w * SPRITE_SCALE;
    if (
      player.speed > car.speed &&
      Util.overlap(player.x, playerW, car.offset, carW, 0.8)
    ) {
      player.speed = car.speed * (car.speed / player.speed);
      player.position = Util.increase(car.z, -player.z, world.trackLength);
      break;
    }
  }

  player.x = Util.limit(player.x, -3, 3);
  player.speed = Util.limit(player.speed, 0, maxSpeed);

  const positionDelta = (player.position - startPosition) / segmentLength;
  world.skyOffset = Util.increase(
    world.skyOffset,
    0.001 * playerSegment.curve * positionDelta,
    1,
  );
  world.hillOffset = Util.increase(
    world.hillOffset,
    0.002 * playerSegment.curve * positionDelta,
    1,
  );
  world.treeOffset = Util.increase(
    world.treeOffset,
    0.003 * playerSegment.curve * positionDelta,
    1,
  );

  if (player.position > player.z) {
    if (world.currentLapTime > 0 && startPosition < player.z) {
      world.lastLapTime = world.currentLapTime;
      world.currentLapTime = 0;
    } else {
      world.currentLapTime += dt;
    }
  }
};

export const formatTime = (dt: number): string => {
  const minutes = Math.floor(dt / 60);
  const seconds = Math.floor(dt - minutes * 60);
  const tenths = Math.floor(10 * (dt - Math.floor(dt)));
  if (minutes > 0) {
    return `${minutes}.${seconds < 10 ? "0" : ""}${seconds}.${tenths}`;
  }
  return `${seconds}.${tenths}`;
};

export const handleKeyDown = (world: WorldState, keyCode: number): void => {
  if (keyCode === KEY.LEFT || keyCode === KEY.A) world.input.left = true;
  if (keyCode === KEY.RIGHT || keyCode === KEY.D) world.input.right = true;
  if (keyCode === KEY.UP || keyCode === KEY.W) world.input.faster = true;
  if (keyCode === KEY.DOWN || keyCode === KEY.S) world.input.slower = true;
};

export const handleKeyUp = (world: WorldState, keyCode: number): void => {
  if (keyCode === KEY.LEFT || keyCode === KEY.A) world.input.left = false;
  if (keyCode === KEY.RIGHT || keyCode === KEY.D) world.input.right = false;
  if (keyCode === KEY.UP || keyCode === KEY.W) world.input.faster = false;
  if (keyCode === KEY.DOWN || keyCode === KEY.S) world.input.slower = false;
};

export interface MirrorCar {
  offset: number;
  distance: number;
  color: string;
}

export const getMirrorCars = (
  cars: Car[],
  playerPosition: number,
  trackLength: number,
  mirrorRange: number,
  maxCars: number = 3,
): MirrorCar[] => {
  const carColors = ["#dc2626", "#3b82f6", "#f59e0b", "#10b981"];
  const mirrorCars: MirrorCar[] = [];

  for (const car of cars) {
    let distanceBehind = playerPosition - car.z;
    if (distanceBehind < 0) {
      distanceBehind += trackLength;
    }
    if (distanceBehind > 0 && distanceBehind < mirrorRange) {
      const colorIndex =
        Math.floor(Math.abs(car.offset * 10)) % carColors.length;
      const normalizedDistance = Math.min(1, distanceBehind / mirrorRange);
      mirrorCars.push({
        offset: car.offset,
        distance: normalizedDistance,
        color: carColors[colorIndex] ?? "#dc2626",
      });
    }
  }

  mirrorCars.sort((a, b) => b.distance - a.distance);
  return mirrorCars.slice(0, maxCars);
};
