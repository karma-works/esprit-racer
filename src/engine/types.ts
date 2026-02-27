export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface WorldPoint {
  world: Point3D;
  camera: Point3D;
  screen: Point2D & { scale: number; w?: number };
}

export interface Segment {
  index: number;
  p1: WorldPoint;
  p2: WorldPoint;
  curve: number;
  sprites: SegmentSprite[];
  cars: Car[];
  color: SegmentColor;
  looped?: boolean;
  fog?: number;
  clip?: number;
}

export interface SegmentSprite {
  source: Sprite;
  offset: number;
}

export interface SegmentColor {
  road: string;
  grass: string;
  rumble: string;
  lane?: string;
}

export interface Sprite {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Car {
  offset: number;
  z: number;
  sprite: Sprite;
  speed: number;
  percent?: number;
}

export interface BackgroundLayer {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CameraConfig {
  height: number;
  depth: number;
  fieldOfView: number;
}

export interface GameConfig {
  fps: number;
  width: number;
  height: number;
  lanes: number;
  roadWidth: number;
  segmentLength: number;
  rumbleLength: number;
  drawDistance: number;
  fogDensity: number;
  centrifugal: number;
  maxSpeed: number;
  accel: number;
  braking: number;
  decel: number;
  offRoadDecel: number;
  offRoadLimit: number;
}

export interface PlayerState {
  x: number;
  z: number;
  position: number;
  speed: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  faster: boolean;
  slower: boolean;
}

export interface InputMapping {
  left: number[];
  right: number[];
  faster: number[];
  slower: number[];
}

export interface PlayerConfig {
  id: number;
  name: string;
  inputMapping: InputMapping;
  color: string;
  spriteColor: string;
}

export interface PlayerRaceState {
  playerId: number;
  position: number;
  lap: number;
  lastLapTime: number | null;
  finished: boolean;
  finishTime: number | null;
  rank: number;
}

export interface RaceState {
  playerStates: PlayerRaceState[];
  winner: number | null;
  isPaused: boolean;
  countdown: number;
  countdownTimer: number;
}

export interface InputMapping {
  left: number[];
  right: number[];
  faster: number[];
  slower: number[];
}

export interface PlayerConfig {
  id: number;
  name: string;
  inputMapping: InputMapping;
  color: string;
  spriteColor: string;
}

export interface PlayerRaceState {
  playerId: number;
  position: number;
  lap: number;
  lastLapTime: number | null;
  finished: boolean;
  finishTime: number | null;
  rank: number;
}

export interface RaceState {
  playerStates: PlayerRaceState[];
  winner: number | null;
  isPaused: boolean;
  countdown: number;
  countdownTimer: number;
}

export interface HudValues {
  speed: number;
  currentTime: number;
  lastLapTime: number | null;
  fastLapTime: number | null;
}

export type KeyCode = number;

export interface KeyBinding {
  keys: KeyCode[];
  mode: "down" | "up";
  action: () => void;
}

export interface ParticleConfig {
  density: number;
  speed: number;
  direction: number;
  sprite?: string;
}

export interface LightningConfig {
  interval: number;
  duration: number;
  flashIntensity: number;
}

export interface WindConfig {
  baseForce: number;
  gustInterval: number;
  gustDuration: number;
  maxGustForce: number;
  direction: number;
}

export interface ThemeEffects {
  fogDensity: number;
  fogStart: number;
  lightning?: LightningConfig;
  rain?: ParticleConfig;
  snow?: ParticleConfig;
  heatHaze?: boolean;
  wind?: WindConfig;
}

export interface ThemePhysics {
  grip: number;
  offRoadGrip: number;
  maxSpeed: number;
  acceleration: number;
  brakeForce: number;
  windForce?: number;
  windDirection?: number;
  jumpZones?: boolean;
  turboZones?: boolean;
  slippery?: boolean;
}

export interface ThemeFilters {
  global: string;
  background: string;
  road: string;
}

export interface LevelTheme {
  id: string;
  name: string;
  description: string;
  colors: {
    sky: string;
    fog: string;
    road: SegmentColor;
  };
  effects: ThemeEffects;
  physics: ThemePhysics;
  filters: ThemeFilters;
  background: string;
  spriteOverrides?: Record<string, string>;
}

export interface WindState {
  currentForce: number;
  currentDirection: number;
  gustTimer: number;
  gusting: boolean;
  gustDuration: number;
  extremeWindTimer: number;
  extremeWindActive: boolean;
}

export interface JumpState {
  active: boolean;
  startTime: number;
  duration: number;
  peakHeight: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  sprite?: string;
  size: number;
}

export interface Tumbleweed {
  x: number;
  z: number;
  rotation: number;
  speed: number;
  direction: number;
}

export interface OilSlick {
  offset: number;
  z: number;
}

export interface TurboZone {
  z: number;
  length: number;
  multiplier: number;
}

export interface LaserObstacle {
  z: number;
  timing: number;
  active: boolean;
  interval: number;
}

export interface JumpZone {
  z: number;
  length: number;
  height: number;
}

export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
  playerIndex: number;
}

export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
  playerIndex: number;
}
