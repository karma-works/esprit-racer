import type { CarType } from "./types";

export const CAR_TYPES = {
    esprit_road: {
        id: "esprit_road",
        name: "Reference Esprit (Road)",
        topSpeed: 0.95,     // 280 km/h baseline
        acceleration: 1.0,  // Medium
        handling: 1.0,      // High / Stable
        braking: 1.0,
        sprite: "car-esprit-road.svg",
        spriteLeft: "car-esprit-road-left.svg",
        spriteRight: "car-esprit-road-right.svg"
    } as CarType,
    esprit_s4: {
        id: "esprit_s4",
        name: "Reference Esprit S4",
        topSpeed: 1.0,      // 295 km/h
        acceleration: 1.1,  // High
        handling: 0.85,     // Medium
        braking: 1.05,
        sprite: "car-esprit-s4.svg",
        spriteLeft: "car-esprit-s4-left.svg",
        spriteRight: "car-esprit-s4-right.svg"
    } as CarType,
    m200: {
        id: "m200",
        name: "Reference M200",
        topSpeed: 1.1,      // 310 km/h
        acceleration: 0.85, // Low
        handling: 0.75,     // Low / Slippery
        braking: 0.9,
        sprite: "car-m200.svg",
        spriteLeft: "car-m200-left.svg",
        spriteRight: "car-m200-right.svg"
    } as CarType
};

export const DEFAULT_CAR: CarType = CAR_TYPES.esprit_road;
