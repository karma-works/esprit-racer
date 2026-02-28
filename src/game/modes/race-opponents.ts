import type { RaceOpponent, WorldState } from "../../engine/world";
import * as Segments from "../../engine/segments";

const OPPONENT_CAR_SPRITES = [
    "car-esprit-road.svg",
    "car-esprit-s4.svg",
    "car-esprit-road.svg",
    "car-esprit-s4.svg",
    "car-esprit-road.svg",
    "car-esprit-s4.svg",
    "car-esprit-road.svg",
    "car-esprit-s4.svg",
    "car-esprit-road.svg",
    "car-esprit-s4.svg",
];

const OPPONENT_NAMES = [
    "HAMILTON", "SCHUMACHER", "SENNA", "PROST", "LAUDA",
    "VETTEL", "ALONSO", "VILLENEUVE", "MANSELL", "PIQUET",
];

/**
 * Initialize 10 race opponents. They start at the same position as the player
 * (position=0) but staggered slightly on the lateral axis so they aren't exactly
 * on top of each other. Skills vary 0.75–0.95 so they race at different speeds.
 */
export const initRaceOpponents = (world: WorldState): void => {
    const opponents: RaceOpponent[] = [];

    for (let i = 0; i < 10; i++) {
        // Alternate left/right offset: ..., -0.6, 0.6, -0.3, 0.3, 0, 0 ...
        const laneOffsets = [-0.6, 0.6, -0.3, 0.3, -0.8, 0.8, -0.1, 0.1, -0.5, 0.5];
        opponents.push({
            id: i,
            name: OPPONENT_NAMES[i] ?? `CPU ${i + 1}`,
            position: 0,   // same start as player
            x: laneOffsets[i] ?? 0,
            speed: 0,
            spriteName: OPPONENT_CAR_SPRITES[i] ?? "car-esprit-road.svg",
            skill: 0.75 + (i / 10) * 0.2,  // 0.75–0.95
        });
    }

    world.raceOpponents = opponents;
};

/**
 * Update race opponent positions & speeds each frame (dt in seconds).
 * Simple rubber-band AI: each opponent tries to maintain its target speed.
 */
export const updateRaceOpponents = (world: WorldState, dt: number): void => {
    const { maxSpeed } = world.config;

    for (const opp of world.raceOpponents) {
        const targetSpeed = maxSpeed * opp.skill;

        // Simple smooth acceleration toward target speed
        if (opp.speed < targetSpeed) {
            opp.speed += maxSpeed * 0.3 * dt;
        } else {
            opp.speed -= maxSpeed * 0.2 * dt;
        }
        opp.speed = Math.max(0, Math.min(opp.speed, maxSpeed * 1.05));

        // Rubber-band: if far behind the player, boost slightly
        const gap = world.player.position - opp.position;
        if (gap > 5000) {
            opp.speed *= 1.05;
        } else if (gap < -5000) {
            opp.speed *= 0.95;
        }

        opp.position += opp.speed * dt;

        // Wrap position within track length
        if (opp.position >= world.trackLength) {
            opp.position -= world.trackLength;
        }
    }
};

/**
 * Calculate the player's position rank among race opponents.
 * Returns 1-based rank (1 = leading).
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
 * Returns a sorted list of opponents visible to the player for rendering.
 * Only returns opponents within the draw distance ahead of the player.
 */
export const getVisibleOpponents = (
    world: WorldState,
    drawRange: number,
): RaceOpponent[] => {
    const { player, trackLength } = world;
    return world.raceOpponents.filter((opp) => {
        let relPos = opp.position - player.position;
        // Wrap-around: handle track looping
        if (relPos < -trackLength / 2) relPos += trackLength;
        if (relPos > trackLength / 2) relPos -= trackLength;
        return relPos > 0 && relPos < drawRange;
    }).sort((a, b) => b.position - a.position); // furthest first (draw back-to-front)
};
