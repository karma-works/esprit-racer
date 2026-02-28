/**
 * RECS — Racing Environment Construction Set
 * Parametric track generator driven by the 9 sliders in the RECS builder screen.
 */

import {
    addStraight,
    addCurve,
    addHill,
    addRoad,
    addSprite,
    addDownhillToEnd,
    getLastY,
    setSegments,
    getSegments,
    findSegment,
    CHECKPOINTS_PER_LAP,
} from "./segments";
import { ROAD, COLORS, SPRITES, SPRITE_GROUPS } from "./constants";
import * as Util from "./utils/math";

export interface RecsParams {
    /** 0–100: frequency of curve segments */
    curves: number;
    /** 0–100: frequency/height of hill segments */
    hills: number;
    /** 0–100: roadside scenery density */
    scenery: number;
    /** 0–100: curve tightness (EASY → HARD) */
    sharpness: number;
    /** 0–100: hill steepness (LOW → HIGH) */
    steepness: number;
    /** 0–100: lateral scatter of scenery sprites */
    scatter: number;
    /** 0–100: total track length, mapped to segment count multiplier 6–20 */
    length: number;
    /** 0–100: difficulty (affects obstacle count) */
    difficulty: number;
    /** 0–100: obstacle density */
    obstacles: number;
    /** Selected theme id (e.g. "night") */
    themeId: string;
}

export const DEFAULT_RECS_PARAMS: RecsParams = {
    curves: 50,
    hills: 40,
    scenery: 60,
    sharpness: 30,
    steepness: 30,
    scatter: 50,
    length: 50,
    difficulty: 40,
    obstacles: 30,
    themeId: "night",
};

/** Encode RECS params as a short shareable seed string */
export const encodeRecsCode = (p: RecsParams): string => {
    const vals = [
        p.curves, p.hills, p.scenery, p.sharpness, p.steepness,
        p.scatter, p.length, p.difficulty, p.obstacles,
    ];
    const chars = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    return vals
        .map((v) => chars[Math.round((v / 100) * (chars.length - 1))] ?? "0")
        .join("") +
        "-" +
        p.themeId.slice(0, 3).toUpperCase();
};

/** Simple seeded PRNG (mulberry32) */
const seededRng = (seed: number) => {
    let s = seed | 0;
    return () => {
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 0xffffffff;
    };
};

/**
 * Main RECS road generator. Replaces `resetRoad`.
 * Returns the total track length.
 */
export const generateRecsTrack = (
    params: RecsParams,
    segmentLength: number,
    rumbleLength: number,
    playerZ: number,
): number => {
    // Derive a numeric seed from all slider values for repeatable generation
    const seed =
        params.curves * 100000 +
        params.hills * 10000 +
        params.sharpness * 1000 +
        params.steepness * 100 +
        params.length * 10 +
        params.obstacles;
    const rng = seededRng(seed);

    // Reset segments
    setSegments([]);

    // --- Map params to usable values ---
    // Track length: 400–1400 base segments (length 0→6 blocks, 100→20 blocks of SHORT=25)
    const blockMultiplier = 6 + Math.round((params.length / 100) * 14);
    const BLOCK = ROAD.LENGTH.SHORT; // 25 segments per block

    // Curve intensity: 0–100 → EASY..HARD (2..6)
    const curveIntensity =
        ROAD.CURVE.EASY + (params.sharpness / 100) * (ROAD.CURVE.HARD - ROAD.CURVE.EASY);

    // Hill height: 0–100 → LOW..HIGH (20..60)
    const hillHeight =
        ROAD.HILL.LOW + (params.steepness / 100) * (ROAD.HILL.HIGH - ROAD.HILL.LOW);

    // Curve frequency: 0–100 → 10%..80% of blocks are curved
    const curveProbability = 0.10 + (params.curves / 100) * 0.70;

    // Hill frequency: 0–100 → 10%..70%
    const hillProbability = 0.10 + (params.hills / 100) * 0.60;

    // --- Build track blocks ---
    addStraight(BLOCK, segmentLength, rumbleLength); // always start straight

    for (let block = 0; block < blockMultiplier - 2; block++) {
        const r = rng();
        const isCurve = r < curveProbability;
        const isHill = rng() < hillProbability;
        const curveDir = rng() > 0.5 ? 1 : -1;

        if (isCurve && isHill) {
            addRoad(
                BLOCK, BLOCK, BLOCK,
                curveDir * curveIntensity,
                isHill ? (rng() > 0.5 ? hillHeight : -hillHeight) : 0,
                segmentLength,
                rumbleLength,
            );
        } else if (isCurve) {
            addCurve(BLOCK, curveDir * curveIntensity, 0, segmentLength, rumbleLength);
        } else if (isHill) {
            addHill(BLOCK, rng() > 0.5 ? hillHeight : -hillHeight, segmentLength, rumbleLength);
        } else {
            addStraight(BLOCK, segmentLength, rumbleLength);
        }
    }

    addDownhillToEnd(segmentLength, rumbleLength); // smooth end

    const segments = getSegments();
    const totalSegments = segments.length;

    // --- Add scenery sprites ---
    const sceneryDensity = (params.scenery / 100); // 0–1
    const scatterFactor = 0.5 + (params.scatter / 100) * 4.5; // 0.5–5.0

    // Start banners
    addSprite(20, SPRITES.BILLBOARD07, -1);
    addSprite(40, SPRITES.BILLBOARD06, 1);

    // Scenery along the track
    const sceneryStep = Math.max(2, Math.round(5 / (sceneryDensity + 0.01)));
    for (let n = 50; n < totalSegments - 50; n += sceneryStep) {
        const side = rng() > 0.5 ? 1 : -1;
        const offset = side * (1 + rng() * scatterFactor);
        const sprite = Util.randomChoice(SPRITE_GROUPS.PLANTS);
        // Only add if rng passes density threshold (varies by segment)
        if (rng() < sceneryDensity) {
            addSprite(n, sprite, offset);
        }
    }

    // Billboards every N segments based on scenery density
    const billboardStep = Math.max(100, Math.round(500 / (sceneryDensity + 0.1)));
    for (let n = 100; n < totalSegments - 100; n += billboardStep) {
        const side = rng() > 0.5 ? 1 : -1;
        addSprite(n, Util.randomChoice(SPRITE_GROUPS.BILLBOARDS), -side);
    }

    // Obstacles (barriers, cones, etc.) based on difficulty + obstacles
    const obstacleDensity =
        ((params.difficulty / 100) * (params.obstacles / 100));
    const obstacleStep = Math.max(50, Math.round(1000 / (obstacleDensity * 10 + 0.1)));
    for (let n = 200; n < totalSegments - 100; n += obstacleStep) {
        if (rng() < obstacleDensity * 2) {
            const side = rng() > 0.5 ? 0.6 : -0.6;
            addSprite(n, SPRITES.BOULDER3, side);
        }
    }

    // --- Checkpoints ---
    const segmentsPerCheckpoint = Math.floor(totalSegments / (CHECKPOINTS_PER_LAP + 1));
    for (let i = 1; i <= CHECKPOINTS_PER_LAP; i++) {
        const idx = segmentsPerCheckpoint * i;
        if (idx < totalSegments - rumbleLength) {
            segments[idx]!.color = COLORS.CHECKPOINT;
            addSprite(idx, SPRITES.CHECKPOINT_BANNER, 0);
        }
    }

    // Start/finish markings
    const playerSeg = findSegment(playerZ, segmentLength);
    segments[playerSeg.index + 2]!.color = COLORS.START;
    segments[playerSeg.index + 3]!.color = COLORS.START;

    for (let n = 0; n < rumbleLength; n++) {
        segments[totalSegments - 1 - n]!.color = COLORS.FINISH;
    }
    addSprite(totalSegments - rumbleLength - 5, SPRITES.FINISH_BANNER, 0);

    return totalSegments * segmentLength;
};
