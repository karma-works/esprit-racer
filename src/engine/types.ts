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
