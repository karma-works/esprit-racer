import type {
  GameConfig,
  PlayerState,
  InputState,
  Car,
  Segment,
  LevelTheme,
  WindState,
  JumpState,
  Particle,
  Tumbleweed,
  ThemePhysics,
  CarType,
} from "./types";
import { DEFAULT_CAR } from "./cars";
import { updateRacingAI } from "../game/modes/championship-ai";
import { SPRITE_SCALE, SPRITE_GROUPS, KEY } from "./constants";
import * as Util from "./utils/math";
import * as Segments from "./segments";
import * as Render from "./renderer/canvas";
import * as Camera from "./camera";

export interface RaceOpponent {
  id: number;
  name: string;
  position: number;   // track position same units as player.position
  x: number;          // lateral offset
  speed: number;
  spriteName: string; // e.g. "car-esprit-road.svg"
  skill: number;      // 0.7–1.0
}

export interface WorldState {
  config: GameConfig;
  baseConfig: GameConfig;
  player: PlayerState;
  input: InputState;
  players: PlayerState[];
  inputs: InputState[];
  cars: Car[];
  raceOpponents: RaceOpponent[];
  segments: Segment[];
  trackLength: number;
  skyOffset: number;
  hillOffset: number;
  treeOffset: number;
  currentLapTime: number;
  lastLapTime: number | null;
  fastLapTime: number | null;
  currentTheme: LevelTheme | null;
  windState: WindState;
  jumpState: JumpState;
  particles: Particle[];
  tumbleweeds: Tumbleweed[];
  slideVelocity: number;
  lightningActive: boolean;
  lightningTimer: number;
  playerCount: number;
  onCollision?: (intensity: number) => void;
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
  maxSpeed: (200 / (1 / 60)) * 1.5, // 50% faster
  accel: (200 / (1 / 60) / 5) * 1.5,
  braking: -(200 / (1 / 60)) * 1.5,
  decel: -(200 / (1 / 60) / 5) * 1.5,
  offRoadDecel: -(200 / (1 / 60) / 2) * 1.5,
  offRoadLimit: (200 / (1 / 60) / 4) * 1.5,
});

export const createDefaultPlayer = (playerZ: number, name: string = "PLAYER"): PlayerState => ({
  x: 0,
  z: playerZ,
  position: 0,
  speed: 0,
  selectedCar: DEFAULT_CAR,
  name,
});

export const applyThemePhysics = (
  baseConfig: GameConfig,
  physics: ThemePhysics,
  car?: CarType,
): GameConfig => {
  const config = {
    ...baseConfig,
    maxSpeed: baseConfig.maxSpeed * physics.maxSpeed,
    accel: baseConfig.accel * physics.acceleration,
    braking: baseConfig.braking * physics.brakeForce,
    offRoadDecel: baseConfig.offRoadDecel * physics.offRoadGrip,
    centrifugal: baseConfig.centrifugal * physics.grip,
  };

  if (car) {
    config.maxSpeed *= car.topSpeed;
    config.accel *= car.acceleration;
    config.centrifugal *= car.handling;
    config.braking *= car.braking;
  }

  return config;
};

export const setTheme = (world: WorldState, theme: LevelTheme): void => {
  world.currentTheme = theme;
  world.config = applyThemePhysics(world.baseConfig, theme.physics, world.player.selectedCar);
  world.windState = createDefaultWindState();
  world.jumpState = createDefaultJumpState();
  world.particles = [];
  world.tumbleweeds = [];
  world.slideVelocity = 0;
  world.lightningActive = false;
  world.lightningTimer = 0;
};

export const updateWind = (
  world: WorldState,
  dt: number,
  speedPercent: number,
): void => {
  const theme = world.currentTheme;
  if (!theme?.effects.wind) return;

  const wind = world.windState;
  const config = theme.effects.wind;

  wind.gustTimer += dt * 1000;

  if (!wind.gusting && wind.gustTimer > config.gustInterval) {
    // Variable gust duration (1.5-3s) and random direction
    if (Math.random() < 0.7) {
      wind.gusting = true;
      wind.gustDuration = config.gustDuration + Math.random() * 1500;
      wind.currentDirection = Math.random() > 0.5 ? 1 : -1;
      wind.currentForce =
        config.baseForce +
        Math.random() * (config.maxGustForce - config.baseForce);
    }
    wind.gustTimer = 0;
  }

  if (wind.gusting && wind.gustTimer > wind.gustDuration) {
    wind.gusting = false;
    wind.currentForce = 0;
    wind.currentDirection = 0;
    wind.gustTimer = 0;
  }

  // Apply wind force only during active gusts and only when moving
  // Wind doesn't affect stationary cars
  if (wind.gusting && speedPercent > 0) {
    world.player.x +=
      wind.currentForce * wind.currentDirection * dt * 0.5 * speedPercent;
  }
};

export const updateJump = (world: WorldState, dt: number): void => {
  const jump = world.jumpState;
  if (!jump.active) return;

  const elapsed = (performance.now() - jump.startTime) / 1000;
  const progress = elapsed / jump.duration;

  if (progress >= 1) {
    jump.active = false;
    jump.peakHeight = 0;
    spawnWaterSplash(world, world.player.x);
  } else {
    jump.peakHeight = 4 * jump.peakHeight * (progress - progress * progress);
  }
};

export const spawnWaterSplash = (world: WorldState, x: number): void => {
  for (let i = 0; i < 8; i++) {
    world.particles.push({
      x,
      y: 0,
      vx: (Math.random() - 0.5) * 3,
      vy: -Math.random() * 5,
      life: 0.5,
      sprite: "water-splash.svg",
      size: 3 + Math.random() * 4,
    });
  }
};

export const updateParticles = (world: WorldState, dt: number): void => {
  const theme = world.currentTheme;
  const windX = world.windState.currentForce * world.windState.currentDirection;

  for (const p of world.particles) {
    p.x += (p.vx + windX * 50) * dt;
    p.y += p.vy * dt;
    p.life -= dt * 0.8;
  }

  world.particles = world.particles.filter(
    (p) => p.life > 0 && p.y < world.config.height,
  );

  if (theme?.effects.snow && Math.random() < theme.effects.snow.density * dt) {
    world.particles.push({
      x: Math.random() * world.config.width,
      y: -10,
      vx: theme.effects.snow.direction * 30,
      vy: theme.effects.snow.speed * 80,
      life: 1,
      sprite: "snowflake.svg",
      size: 2 + Math.random() * 3,
    });
  }

  if (theme?.effects.rain && Math.random() < theme.effects.rain.density * dt) {
    world.particles.push({
      x: Math.random() * world.config.width,
      y: -10,
      vx: theme.effects.rain.direction * 50,
      vy: theme.effects.rain.speed * 200,
      life: 0.8,
      sprite: "raindrop.svg",
      size: 1 + Math.random() * 2,
    });
  }
};

export const updateTumbleweeds = (world: WorldState, dt: number): void => {
  if (!world.currentTheme?.effects.wind) return;

  for (const weed of world.tumbleweeds) {
    weed.x += weed.speed * weed.direction * dt;
    weed.rotation += weed.speed * 3 * dt;
  }

  world.tumbleweeds = world.tumbleweeds.filter(
    (w) => Math.abs(w.x) < 4 && w.z > world.player.position - 500,
  );

  if (Math.random() < 0.015) {
    const direction =
      world.windState.currentDirection || (Math.random() > 0.5 ? 1 : -1);
    world.tumbleweeds.push({
      x: direction > 0 ? -3.5 : 3.5,
      z:
        world.player.position +
        world.config.drawDistance * world.config.segmentLength,
      rotation: 0,
      speed: 0.5 + Math.random() * 0.5,
      direction,
    });
  }

  for (const weed of world.tumbleweeds) {
    if (Math.abs(world.player.x - weed.x) < 0.15) {
      world.player.x += weed.direction * 0.02;
      world.player.speed *= 0.995;
    }
  }
};

export const updateLightning = (world: WorldState, dt: number): void => {
  const theme = world.currentTheme;
  if (!theme?.effects.lightning) return;

  const config = theme.effects.lightning;
  world.lightningTimer += dt * 1000;

  if (world.lightningActive) {
    if (world.lightningTimer > config.duration) {
      world.lightningActive = false;
      world.lightningTimer = 0;
    }
  } else if (world.lightningTimer > config.interval && Math.random() < 0.05) {
    world.lightningActive = true;
    world.lightningTimer = 0;
  }
};

export const updateSlidePhysics = (world: WorldState, dt: number): void => {
  const theme = world.currentTheme;
  if (!theme?.physics.slippery) {
    world.slideVelocity *= 0.9;
    return;
  }

  const { input, player } = world;

  if (input.left) {
    world.slideVelocity -= 0.02 * (1 - theme.physics.grip);
  } else if (input.right) {
    world.slideVelocity += 0.02 * (1 - theme.physics.grip);
  }

  player.x += world.slideVelocity * dt * 20;
  world.slideVelocity *= 0.98;
  world.slideVelocity = Util.limit(world.slideVelocity, -0.3, 0.3);
};

export const createDefaultInput = (): InputState => ({
  left: false,
  right: false,
  faster: false,
  slower: false,
});

export const createDefaultWindState = (): WindState => ({
  currentForce: 0,
  currentDirection: 0,
  gustTimer: 0,
  gusting: false,
  gustDuration: 0,
  extremeWindTimer: 0,
  extremeWindActive: false,
});

export const createDefaultJumpState = (): JumpState => ({
  active: false,
  startTime: 0,
  duration: 0,
  peakHeight: 0,
});

export const createWorld = (playerCount: number = 1, playerNames: string[] = []): WorldState => {
  const config = createDefaultConfig();
  const cameraDepth = 1 / Math.tan(((100 / 2) * Math.PI) / 180);
  const playerZ = Camera.getPlayerZ(1000, cameraDepth);

  const trackLength = Segments.resetRoad(
    config.segmentLength,
    config.rumbleLength,
    playerZ,
  );
  const segments = Segments.getSegments();

  const players: PlayerState[] = [];
  const inputs: InputState[] = [];

  for (let i = 0; i < playerCount; i++) {
    players.push(createDefaultPlayer(playerZ, playerNames[i] || `PLAYER ${i + 1}`));
    inputs.push(createDefaultInput());
  }

  const player = players[0] ?? createDefaultPlayer(playerZ, playerNames[0] || "PLAYER 1");
  const input = inputs[0] ?? createDefaultInput();

  return {
    config,
    baseConfig: { ...config },
    player,
    input,
    players,
    inputs,
    cars: [],
    raceOpponents: [],
    segments,
    trackLength,
    skyOffset: 0,
    hillOffset: 0,
    treeOffset: 0,
    currentLapTime: 0,
    lastLapTime: null,
    fastLapTime: null,
    currentTheme: null,
    windState: createDefaultWindState(),
    jumpState: createDefaultJumpState(),
    particles: [],
    tumbleweeds: [],
    slideVelocity: 0,
    lightningActive: false,
    lightningTimer: 0,
    playerCount,
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
  dt: number,
): void => {
  const { segmentLength, drawDistance, maxSpeed } = world.config;

  for (const car of world.cars) {
    const oldSegment = Segments.findSegment(car.z, segmentLength);
    if (car.ai) {
      updateRacingAI(car, oldSegment, world.player.position, world.player.z, dt, maxSpeed);
    } else {
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
    }
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

  updateCars(world, playerSegment, playerW, dt);

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
      // Trigger collision event for sound
      if (world.onCollision) {
        world.onCollision(0.7);
      }
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
