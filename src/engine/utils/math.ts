export const timestamp = (): number => new Date().getTime();

export const toInt = (obj: unknown, def: number): number => {
  if (obj !== null && obj !== undefined) {
    const x = parseInt(String(obj), 10);
    if (!isNaN(x)) return x;
  }
  return def;
};

export const toFloat = (obj: unknown, def: number): number => {
  if (obj !== null && obj !== undefined) {
    const x = parseFloat(String(obj));
    if (!isNaN(x)) return x;
  }
  return def;
};

export const limit = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(value, max));

export const randomInt = (min: number, max: number): number =>
  Math.round(interpolate(min, max, Math.random()));

export const randomChoice = <T>(options: readonly T[]): T =>
  options[randomInt(0, options.length - 1)]!;

export const percentRemaining = (n: number, total: number): number =>
  (n % total) / total;

export const accelerate = (v: number, accel: number, dt: number): number =>
  v + accel * dt;

export const interpolate = (a: number, b: number, percent: number): number =>
  a + (b - a) * percent;

export const easeIn = (a: number, b: number, percent: number): number =>
  a + (b - a) * Math.pow(percent, 2);

export const easeOut = (a: number, b: number, percent: number): number =>
  a + (b - a) * (1 - Math.pow(1 - percent, 2));

export const easeInOut = (a: number, b: number, percent: number): number =>
  a + (b - a) * (-Math.cos(percent * Math.PI) / 2 + 0.5);

export const exponentialFog = (distance: number, density: number): number =>
  1 / Math.pow(Math.E, distance * distance * density);

export const increase = (
  start: number,
  increment: number,
  max: number,
): number => {
  let result = start + increment;
  while (result >= max) result -= max;
  while (result < 0) result += max;
  return result;
};

export interface ProjectablePoint {
  world: { x?: number; y?: number; z?: number };
  camera: { x: number; y: number; z: number };
  screen: { x: number; y: number; scale: number; w?: number };
}

export const project = (
  p: ProjectablePoint,
  cameraX: number,
  cameraY: number,
  cameraZ: number,
  cameraDepth: number,
  width: number,
  height: number,
  roadWidth: number,
): void => {
  p.camera.x = (p.world.x ?? 0) - cameraX;
  p.camera.y = (p.world.y ?? 0) - cameraY;
  p.camera.z = (p.world.z ?? 0) - cameraZ;
  p.screen.scale = cameraDepth / p.camera.z;
  p.screen.x = Math.round(
    width / 2 + (p.screen.scale * p.camera.x * width) / 2,
  );
  p.screen.y = Math.round(
    height / 2 - (p.screen.scale * p.camera.y * height) / 2,
  );
  p.screen.w = Math.round((p.screen.scale * roadWidth * width) / 2);
};

export const overlap = (
  x1: number,
  w1: number,
  x2: number,
  w2: number,
  percent: number = 1,
): boolean => {
  const half = percent / 2;
  const min1 = x1 - w1 * half;
  const max1 = x1 + w1 * half;
  const min2 = x2 - w2 * half;
  const max2 = x2 + w2 * half;
  return !(max1 < min2 || min1 > max2);
};
