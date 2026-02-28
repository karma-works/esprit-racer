import type { Car, Segment } from "../../engine/types";
import { SPRITE_GROUPS } from "../../engine/constants";
import * as Segments from "../../engine/segments";

export const initChampionshipAI = (trackLength: number, segmentLength: number): Car[] => {
    const TOTAL_AI = 19;
    const aiCars: Car[] = [];

    for (let i = 0; i < TOTAL_AI; i++) {
        // Pick a deterministic colored car sprite based on ID
        const spriteId = i % SPRITE_GROUPS.CARS.length;
        const sprite = SPRITE_GROUPS.CARS[spriteId]!;

        // Distribute cars ahead of the start line
        const z = (trackLength - (TOTAL_AI - i) * 600) % trackLength;
        const offset = i % 2 === 0 ? -0.4 : 0.4;

        // Skill ranges from 0.7 to 1.0 based on position (lead cars are better)
        const skill = 0.7 + (i / TOTAL_AI) * 0.3;
        const aggressiveness = Math.random();

        const car: Car = {
            offset,
            z,
            sprite,
            speed: 0, // AI cars start roughly grid parked
            ai: {
                carId: i,
                skill,
                aggressiveness,
                currentLine: "racing",
                targetSpeed: 0,
                mistakesRemaining: 0,
            },
        };

        const segment = Segments.findSegment(car.z, segmentLength);
        segment.cars.push(car);
        aiCars.push(car);
    }

    return aiCars;
};

export const updateRacingAI = (
    car: Car,
    segment: Segment,
    playerPosition: number,
    playerZ: number,
    dt: number,
    maxSpeed: number
): void => {
    const ai = car.ai;
    if (!ai) return;

    // Decrease mistake timer
    if (ai.mistakesRemaining > 0) {
        ai.mistakesRemaining -= dt * 60; // 60fps base
    }

    // Find AI's position relative to player
    let relativePos = car.z - playerZ;
    if (Math.abs(relativePos) > segment.curve * maxSpeed) { // Very rough normalization
        // Do nothing specifically for looping distance yet, handled by world logic
    }

    if (car.z < playerZ) {
        // AI is behind - Attempt to overtake
        ai.currentLine = "overtake";

        // Aggressive AI tries to go faster
        ai.targetSpeed = maxSpeed * ai.skill * (1.0 + (ai.aggressiveness * 0.1));
    } else {
        // AI is ahead - Defensive line
        ai.currentLine = "defensive";
        ai.targetSpeed = maxSpeed * ai.skill;
    }

    // Adjust for corners
    if (Math.abs(segment.curve) > 2) {
        ai.targetSpeed *= 0.8;
    }

    // Apply mistakes
    if (Math.random() < 0.001 * (1 - ai.skill) && ai.mistakesRemaining <= 0) {
        ai.mistakesRemaining = 60; // 1 second mistake
    }

    if (ai.mistakesRemaining > 0) {
        ai.targetSpeed *= 0.7; // Slow down during a mistake
        // Drift to outside of corner
        const drift = segment.curve > 0 ? -0.05 : 0.05;
        car.offset += drift * dt;
    } else {
        // Normal steering
        if (ai.currentLine === "defensive") {
            // Try to stay in middle roughly
            const targetOffset = 0;
            car.offset += (targetOffset - car.offset) * dt * 2;
        } else {
            // Try to stay off center
            const targetOffset = car.offset > 0 ? 0.6 : -0.6;
            car.offset += (targetOffset - car.offset) * dt * 2;
        }
    }

    // Smooth acceleration
    if (car.speed < ai.targetSpeed) {
        car.speed += (maxSpeed * 0.4 * dt); // Accel
    } else {
        car.speed -= (maxSpeed * 0.5 * dt); // Decel
    }

    // Limits
    car.speed = Math.max(0, Math.min(car.speed, maxSpeed * 1.2));
    car.offset = Math.max(-0.9, Math.min(car.offset, 0.9));
};
