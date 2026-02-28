import type { ChampionshipState } from "../../engine/types";

// Base points awarded for 1st down to 10th position
// As per standard retro racing rules or Lotus specs
export const CHAMPIONSHIP_POINTS = [
    20, // 1st
    15, // 2nd
    12, // 3rd
    10, // 4th
    8,  // 5th
    6,  // 6th
    4,  // 7th
    3,  // 8th
    2,  // 9th
    1   // 10th
];

// As per section 12.5 of the spec, the built-in track sequences
const DIFFICULTY_TRACK_SEQUENCES: Record<string, string[]> = {
    easy: [
        "future", "night", "desert", "snow",
        "marsh", "city", "lakes" // Usually 7 races for easy
    ],
    medium: [
        "future", "night", "desert", "snow",
        "marsh", "city", "lakes", "mountains", "fog", "roadworks" // 10 races
    ],
    hard: [
        "future", "night", "desert", "snow",
        "marsh", "city", "lakes", "mountains", "fog", "roadworks",
        "storm", "windy", "country" // 13 races
    ]
};

export const createChampionshipState = (difficulty: "easy" | "medium" | "hard"): ChampionshipState => {
    const trackSequence = DIFFICULTY_TRACK_SEQUENCES[difficulty] ?? DIFFICULTY_TRACK_SEQUENCES["easy"]!;
    return {
        difficulty,
        currentRace: 0,
        totalRaces: trackSequence.length,
        points: 0,
        positionHistory: [],
        gridPosition: 20, // Start last on grid in first race
        trackSequence,
        passwords: [],
        eliminated: false
    };
};

export const updateChampionshipStandings = (state: ChampionshipState, playerRacePosition: number): ChampionshipState => {
    const pointsEarned = playerRacePosition <= 10 && playerRacePosition > 0
        ? CHAMPIONSHIP_POINTS[playerRacePosition - 1]!
        : 0;

    // Grid position for next race is the inverse of your finishing position,
    // or last if you didn't finish well. 
    // Standard Reference 3 rule: if you finish 1st, you start last (20th). 
    // If you finish 20th, you start 1st.
    // Formula: Next Grid Pos = 21 - Finishing Pos.
    const nextGridPosition = Math.max(1, Math.min(20, 21 - playerRacePosition));

    return {
        ...state,
        points: state.points + pointsEarned,
        positionHistory: [...state.positionHistory, playerRacePosition],
        currentRace: state.currentRace + 1,
        gridPosition: nextGridPosition,
        // Eliminated if you place worse than 10th in a championship race
        eliminated: playerRacePosition > 10
    };
};

// Based on a simple deterministic hash for the retro password system
export const generatePassword = (state: ChampionshipState): string => {
    // We encode: difficulty, currentRace, points
    const diffChars = { easy: "E", medium: "M", hard: "H" };
    const d = diffChars[state.difficulty] || "E";
    const r = state.currentRace.toString(16).toUpperCase();
    const p = state.points.toString(16).padStart(3, "0").toUpperCase();

    // Calculate a simple checksum
    let checksum = 0;
    const rawStr = `${d}${r}${p}`;
    for (let i = 0; i < rawStr.length; i++) {
        checksum += rawStr.charCodeAt(i);
    }
    const c = (checksum % 16).toString(16).toUpperCase();

    return `${d}${r}-${p}-${c}`;
};

export const parsePassword = (password: string): Partial<ChampionshipState> | null => {
    const clean = password.replace(/-/g, "").toUpperCase();
    if (clean.length !== 6) return null;

    const dChar = clean[0]!;
    const rChar = clean[1]!;
    const pStr = clean.substr(2, 3);
    const cChar = clean[5]!;

    // Verify checksum
    let checksum = 0;
    const rawStr = clean.substring(0, 5);
    for (let i = 0; i < rawStr.length; i++) {
        checksum += rawStr.charCodeAt(i);
    }
    if ((checksum % 16).toString(16).toUpperCase() !== cChar) {
        return null; // Invalid password
    }

    const diffMap: Record<string, "easy" | "medium" | "hard"> = { E: "easy", M: "medium", H: "hard" };
    const difficulty = diffMap[dChar] || "easy";
    const currentRace = parseInt(rChar, 16);
    const points = parseInt(pStr, 16);

    const sequence = DIFFICULTY_TRACK_SEQUENCES[difficulty] ?? DIFFICULTY_TRACK_SEQUENCES["easy"]!;

    return {
        difficulty,
        currentRace,
        points,
        // Infer grid position roughly or default to 10
        gridPosition: 10,
        eliminated: false,
        trackSequence: sequence as string[],
        totalRaces: sequence.length
    };
};
