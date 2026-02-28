import type { RaceOpponent, WorldState } from "../../engine/world";

// The 10 opponent car sprites — alternating Esprit variants for variety
const OPPONENT_CAR_SPRITES = [
    "car-esprit-road.svg",
    "car-esprit-s4.svg",
    "car-esprit-s4.svg",
    "car-esprit-road.svg",
    "car-esprit-s4.svg",
    "car-esprit-road.svg",
    "car-esprit-s4.svg",
    "car-esprit-road.svg",
    "car-esprit-s4.svg",
    "car-esprit-road.svg",
];

const OPPONENT_NAMES = [
    "HAMILTON", "SCHUMACHER", "SENNA", "PROST", "LAUDA",
    "VETTEL", "ALONSO", "VILLENEUVE", "MANSELL", "PIQUET",
];

/**
 * Initialize 10 race opponents. They start staggered behind the player
 * on a race grid (every 600 units apart), alternating left/right of centre.
 * skill varies 0.75–0.95 so each drives at a different peak speed.
 */
export const initRaceOpponents = (world: WorldState): void => {
    const opponents: RaceOpponent[] = [];
    const GRID_SPACING = 600; // track units between grid rows
    // Lateral lane layout: alternating slight offsets so cars line up on the grid
    const laneOffsets = [-0.35, 0.35, -0.35, 0.35, -0.35, 0.35, -0.35, 0.35, -0.35, 0.35];

    for (let i = 0; i < 10; i++) {
        opponents.push({
            id: i,
            name: OPPONENT_NAMES[i] ?? `CPU ${i + 1}`,
            // Start further back for each grid position (i=0 is just behind player, i=9 is last)
            position: -((i + 1) * GRID_SPACING),
            x: laneOffsets[i] ?? 0,
            speed: 0,
            spriteName: OPPONENT_CAR_SPRITES[i] ?? "car-esprit-road.svg",
            skill: 0.75 + (i / 10) * 0.2,  // 0.75 (slowest) – 0.95 (fastest)
        });
    }

    world.raceOpponents = opponents;
};

const COLLISION_THRESHOLD = 0.25; // lateral distance within which collision triggers
const COLLISION_SPEED_LOSS = 0.4;  // 40% speed reduction on collision for player
const COLLISION_OPP_SPEED_LOSS = 0.25;

/**
 * Check and apply collision between the player and nearby race opponents.
 * Call this once per frame from the game update loop.
 */
export const checkOpponentCollision = (world: WorldState, dt: number): void => {
    const player = world.player;
    const { segmentLength } = world.config;
    const trackLength = world.trackLength;

    const playerSegIndex =
        Math.floor((player.position % trackLength) / segmentLength) %
        world.segments.length;

    for (const opp of world.raceOpponents) {
        const oppAbsZ = opp.position < 0
            ? opp.position % trackLength + trackLength
            : opp.position % trackLength;
        const oppSegIndex =
            Math.floor(oppAbsZ / segmentLength) % world.segments.length;

        // Only collide if same or adjacent segment
        const segDiff = Math.abs(playerSegIndex - oppSegIndex);
        if (segDiff > 1 && segDiff < world.segments.length - 1) continue;

        // Check lateral proximity
        const latDist = Math.abs(player.x - opp.x);
        if (latDist < COLLISION_THRESHOLD) {
            // Apply speed reduction to both
            player.speed *= (1 - COLLISION_SPEED_LOSS * dt * 8);
            opp.speed *= (1 - COLLISION_OPP_SPEED_LOSS * dt * 8);

            // Lateral bounce: push player away from the opponent
            const pushDir = player.x < opp.x ? -1 : 1;
            player.x += pushDir * 0.05;

            // Trigger camera shake via onCollision callback
            if (world.onCollision) {
                world.onCollision(0.5);
            }
        }
    }
};

/**
 * Update race opponent positions & speeds each frame (dt in seconds).
 * Simple speed-matching AI with rubber-banding.
 */
export const updateRaceOpponents = (world: WorldState, dt: number): void => {
    const { maxSpeed } = world.config;

    for (const opp of world.raceOpponents) {
        const targetSpeed = maxSpeed * opp.skill;

        if (opp.speed < targetSpeed) {
            opp.speed += maxSpeed * 0.3 * dt;
        } else {
            opp.speed -= maxSpeed * 0.2 * dt;
        }
        opp.speed = Math.max(0, Math.min(opp.speed, maxSpeed * 1.05));

        // Rubber-band: if far behind the player, gently boost
        const gap = world.player.position - opp.position;
        if (gap > 5000) {
            opp.speed *= 1.04;
        } else if (gap < -5000) {
            opp.speed *= 0.96;
        }

        opp.position += opp.speed * dt;

        // Wrap position—track is a loop
        if (opp.position >= world.trackLength) {
            opp.position -= world.trackLength;
        }
    }
};

/**
 * Calculate the player's 1-based position rank among race opponents.
 */
export const getRacePosition = (world: WorldState): number => {
    let rank = 1;
    for (const opp of world.raceOpponents) {
        if (opp.position > world.player.position) {
            rank++;
        }
    }
    return rank;
};

/**
 * Returns opponents within draw range ahead of the player for rendering.
 */
export const getVisibleOpponents = (
    world: WorldState,
    drawRange: number,
): RaceOpponent[] => {
    const { player, trackLength } = world;
    return world.raceOpponents
        .filter((opp) => {
            let relPos = opp.position - player.position;
            if (relPos < -trackLength / 2) relPos += trackLength;
            if (relPos > trackLength / 2) relPos -= trackLength;
            return relPos > -2000 && relPos < drawRange; // also show cars slightly behind
        })
        .sort((a, b) => b.position - a.position);
};
