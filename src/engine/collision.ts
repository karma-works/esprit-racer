import type { PlayerState } from "./types";
import * as Util from "./utils/math";

export interface PlayerCollision {
  p1: number;
  p2: number;
  distance: number;
  dx: number;
  dz: number;
}

// Player car width for collision detection (similar to traffic cars)
export const PLAYER_CAR_WIDTH = 0.5;
// How close players need to be on the track (in segment lengths)
export const PLAYER_COLLISION_Z_DISTANCE = 200; // segmentLength is typically 200

export const checkPlayerCollision = (
  p1: PlayerState,
  p2: PlayerState,
  segmentLength: number = 200,
): boolean => {
  // Check if players are close enough on the Z axis (track position)
  let dz = p1.position - p2.position;

  // Handle track wrapping
  if (Math.abs(dz) > segmentLength * 100) {
    // Wrapped around track
    return false;
  }

  // Check Z distance
  if (Math.abs(dz) > PLAYER_COLLISION_Z_DISTANCE) {
    return false;
  }

  // Check lateral overlap using same method as traffic cars
  // Use 0.8 percent overlap like traffic car collision
  return Util.overlap(p1.x, PLAYER_CAR_WIDTH, p2.x, PLAYER_CAR_WIDTH, 0.8);
};

export const resolvePlayerCollision = (
  p1: PlayerState,
  p2: PlayerState,
): void => {
  const dx = p1.x - p2.x;
  const dz = p1.position - p2.position;
  const distance = Math.sqrt(dx * dx + dz * dz);

  if (distance === 0) return;

  // Push players apart laterally
  const pushFactor = 0.15;
  const nx = dx / distance;

  // Push sideways (x direction)
  p1.x += nx * pushFactor;
  p2.x -= nx * pushFactor;

  // Speed collision effect - similar to traffic cars
  // If p1 is behind and faster, slow down
  if (dz > 0 && p1.speed > p2.speed) {
    // p1 is behind p2 and trying to overtake - slow p1 down
    p1.speed = p2.speed * 0.9;
  } else if (dz < 0 && p2.speed > p1.speed) {
    // p2 is behind p1 and trying to overtake - slow p2 down
    p2.speed = p1.speed * 0.9;
  }

  // Minimum speed reduction on any collision
  p1.speed = Math.max(0, p1.speed * 0.95);
  p2.speed = Math.max(0, p2.speed * 0.95);
};

export const checkAllPlayerCollisions = (
  players: PlayerState[],
  segmentLength: number = 200,
): PlayerCollision[] => {
  const collisions: PlayerCollision[] = [];

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const p1 = players[i];
      const p2 = players[j];
      if (!p1 || !p2) continue;

      if (checkPlayerCollision(p1, p2, segmentLength)) {
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

export const resolveAllPlayerCollisions = (
  players: PlayerState[],
  segmentLength: number = 200,
  onCollision?: (intensity: number) => void,
): void => {
  const collisions = checkAllPlayerCollisions(players, segmentLength);

  for (const collision of collisions) {
    const p1 = players[collision.p1];
    const p2 = players[collision.p2];
    if (p1 && p2) {
      resolvePlayerCollision(p1, p2);
      if (onCollision) {
        onCollision(0.8);
      }
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
