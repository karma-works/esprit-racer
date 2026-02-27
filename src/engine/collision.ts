import type { PlayerState } from "./types";

export interface PlayerCollision {
  p1: number;
  p2: number;
  distance: number;
  dx: number;
  dz: number;
}

export const PLAYER_COLLISION_RADIUS = 0.15;
export const PLAYER_COLLISION_ELASTICITY = 0.5;

export const checkPlayerCollision = (
  p1: PlayerState,
  p2: PlayerState,
  collisionRadius: number = PLAYER_COLLISION_RADIUS,
): boolean => {
  const dx = p1.x - p2.x;
  const dz = p1.position - p2.position;
  const distance = Math.sqrt(dx * dx + dz * dz);
  return distance < collisionRadius;
};

export const resolvePlayerCollision = (
  p1: PlayerState,
  p2: PlayerState,
): void => {
  const dx = p1.x - p2.x;
  const dz = p1.position - p2.position;
  const distance = Math.sqrt(dx * dx + dz * dz);

  if (distance === 0) return;

  const minDistance = PLAYER_COLLISION_RADIUS;
  const overlap = minDistance - distance;

  const nx = dx / distance;
  const nz = dz / distance;

  const v1x = p1.speed * 0.01;
  const v2x = p2.speed * 0.01;

  const v1Parallel = v1x * nx;
  const v2Parallel = v2x * nx;

  const m1 = 1;
  const m2 = 1;

  const v1ParallelNew =
    (v1Parallel * (m1 - m2) + 2 * m2 * v2Parallel) / (m1 + m2);
  const v2ParallelNew =
    (v2Parallel * (m2 - m1) + 2 * m1 * v1Parallel) / (m1 + m2);

  const pushFactor = overlap * 0.5;
  p1.x += nx * pushFactor;
  p1.position += nz * pushFactor;
  p2.x -= nx * pushFactor;
  p2.position -= nz * pushFactor;

  const speedTransfer = (p2.speed - p1.speed) * PLAYER_COLLISION_ELASTICITY;
  p1.speed = Math.max(0, p1.speed - speedTransfer * 0.5);
  p2.speed = Math.max(0, p2.speed + speedTransfer * 0.5);
};

export const checkAllPlayerCollisions = (
  players: PlayerState[],
): PlayerCollision[] => {
  const collisions: PlayerCollision[] = [];

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const p1 = players[i];
      const p2 = players[j];
      if (!p1 || !p2) continue;

      if (checkPlayerCollision(p1, p2)) {
        const dx = p1.x - p2.x;
        const dz = p1.position - p2.position;
        const distance = Math.sqrt(dx * dx + dz * dz);

        collisions.push({
          p1: i,
          p2: j,
          distance,
          dx,
          dz,
        });
      }
    }
  }

  return collisions;
};

export const resolveAllPlayerCollisions = (players: PlayerState[]): void => {
  const collisions = checkAllPlayerCollisions(players);

  for (const collision of collisions) {
    const p1 = players[collision.p1];
    const p2 = players[collision.p2];
    if (p1 && p2) {
      resolvePlayerCollision(p1, p2);
    }
  }
};

export const getPlayerDistance = (p1: PlayerState, p2: PlayerState): number => {
  const dx = p1.x - p2.x;
  const dz = p1.position - p2.position;
  return Math.sqrt(dx * dx + dz * dz);
};

export const getPlayerRelativePosition = (
  p1: PlayerState,
  p2: PlayerState,
): { ahead: boolean; distance: number; lateralDistance: number } => {
  const dz = p2.position - p1.position;
  const dx = p2.x - p1.x;

  return {
    ahead: dz > 0,
    distance: Math.abs(dz),
    lateralDistance: Math.abs(dx),
  };
};
