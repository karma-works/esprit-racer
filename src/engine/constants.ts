import type {
  Sprite,
  BackgroundLayer,
  SegmentColor,
  KeyCode,
  LevelTheme,
} from "./types";

export const KEY = {
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  A: 65,
  D: 68,
  S: 83,
  W: 87,
  P: 80,
  F: 70,
  SPACE: 32,
} as const satisfies Record<string, KeyCode>;

export const COLORS = {
  SKY: "#72D7EE",
  TREE: "#005108",
  FOG: "#005108",
  LIGHT: {
    road: "#6B6B6B",
    grass: "#10AA10",
    rumble: "#555555",
    lane: "#CCCCCC",
  },
  DARK: { road: "#696969", grass: "#009A00", rumble: "#BBBBBB" },
  START: { road: "white", grass: "white", rumble: "white" },
  CHECKPOINT: { road: "#FFFF88", grass: "#FFFF88", rumble: "#FFFF88" },
  FINISH: { road: "black", grass: "black", rumble: "black" },
} as const satisfies Record<string, SegmentColor | string>;

export const BACKGROUND = {
  HILLS: { x: 5, y: 5, w: 1280, h: 480 },
  SKY: { x: 5, y: 495, w: 1280, h: 480 },
  TREES: { x: 5, y: 985, w: 1280, h: 480 },
} as const satisfies Record<string, BackgroundLayer>;

export const SPRITES = {
  CHECKPOINT_BANNER: { x: 5, y: 5, w: 400, h: 120 },
  FINISH_BANNER: { x: 410, y: 5, w: 400, h: 120 },
  PALM_TREE: { x: 5, y: 5, w: 215, h: 540 },
  BILLBOARD08: { x: 230, y: 5, w: 385, h: 265 },
  TREE1: { x: 625, y: 5, w: 360, h: 360 },
  DEAD_TREE1: { x: 5, y: 555, w: 135, h: 332 },
  BILLBOARD09: { x: 150, y: 555, w: 328, h: 282 },
  BOULDER3: { x: 230, y: 280, w: 320, h: 220 },
  COLUMN: { x: 995, y: 5, w: 200, h: 315 },
  BILLBOARD01: { x: 625, y: 375, w: 300, h: 170 },
  BILLBOARD06: { x: 488, y: 555, w: 298, h: 190 },
  BILLBOARD05: { x: 5, y: 897, w: 298, h: 190 },
  BILLBOARD07: { x: 313, y: 897, w: 298, h: 190 },
  BOULDER2: { x: 621, y: 897, w: 298, h: 140 },
  TREE2: { x: 1205, y: 5, w: 282, h: 295 },
  BILLBOARD04: { x: 1205, y: 310, w: 268, h: 170 },
  DEAD_TREE2: { x: 1205, y: 490, w: 150, h: 260 },
  BOULDER1: { x: 1205, y: 760, w: 168, h: 248 },
  BUSH1: { x: 5, y: 1097, w: 240, h: 155 },
  CACTUS: { x: 929, y: 897, w: 235, h: 118 },
  BUSH2: { x: 255, y: 1097, w: 232, h: 152 },
  BILLBOARD03: { x: 5, y: 1262, w: 230, h: 220 },
  BILLBOARD02: { x: 245, y: 1262, w: 215, h: 220 },
  STUMP: { x: 995, y: 330, w: 195, h: 140 },
  SEMI: { x: 1365, y: 490, w: 122, h: 144 },
  TRUCK: { x: 1365, y: 644, w: 100, h: 78 },
  CAR03: { x: 1383, y: 760, w: 88, h: 55 },
  CAR02: { x: 1383, y: 825, w: 80, h: 59 },
  CAR04: { x: 1383, y: 894, w: 80, h: 57 },
  CAR01: { x: 1205, y: 1018, w: 80, h: 56 },
  PLAYER_UPHILL_LEFT: { x: 1383, y: 961, w: 80, h: 45 },
  PLAYER_UPHILL_STRAIGHT: { x: 1295, y: 1018, w: 80, h: 45 },
  PLAYER_UPHILL_RIGHT: { x: 1385, y: 1018, w: 80, h: 45 },
  PLAYER_LEFT: { x: 995, y: 480, w: 80, h: 41 },
  PLAYER_STRAIGHT: { x: 1085, y: 480, w: 80, h: 41 },
  PLAYER_RIGHT: { x: 995, y: 531, w: 80, h: 41 },
} as const satisfies Record<string, Sprite>;

export const SPRITE_SCALE = 0.3 * (1 / SPRITES.PLAYER_STRAIGHT.w);

export const SPRITE_GROUPS = {
  BILLBOARDS: [
    SPRITES.BILLBOARD01,
    SPRITES.BILLBOARD02,
    SPRITES.BILLBOARD03,
    SPRITES.BILLBOARD04,
    SPRITES.BILLBOARD05,
    SPRITES.BILLBOARD06,
    SPRITES.BILLBOARD07,
    SPRITES.BILLBOARD08,
    SPRITES.BILLBOARD09,
  ] as const,
  PLANTS: [
    SPRITES.TREE1,
    SPRITES.TREE2,
    SPRITES.DEAD_TREE1,
    SPRITES.DEAD_TREE2,
    SPRITES.PALM_TREE,
    SPRITES.BUSH1,
    SPRITES.BUSH2,
    SPRITES.CACTUS,
    SPRITES.STUMP,
    SPRITES.BOULDER1,
    SPRITES.BOULDER2,
    SPRITES.BOULDER3,
  ] as const,
  CARS: [
    SPRITES.CAR01,
    SPRITES.CAR02,
    SPRITES.CAR03,
    SPRITES.CAR04,
    SPRITES.SEMI,
    SPRITES.TRUCK,
  ] as const,
} as const;

export const ROAD = {
  LENGTH: { NONE: 0, SHORT: 25, MEDIUM: 50, LONG: 100 },
  HILL: { NONE: 0, LOW: 20, MEDIUM: 40, HIGH: 60 },
  CURVE: { NONE: 0, EASY: 2, MEDIUM: 4, HARD: 6 },
} as const;

export const THEMES: Record<string, LevelTheme> = {
  night: {
    id: "night",
    name: "Night",
    description: "Moody and fast. Manhattan-style skyline with neon accents.",
    colors: {
      sky: "#0a0a1a",
      fog: "#001122",
      road: {
        road: "#1a1a2e",
        grass: "#0d1117",
        rumble: "#2d2d44",
        lane: "#ffdd00",
      },
    },
    effects: { fogDensity: 4, fogStart: 0.6 },
    physics: {
      grip: 1.0,
      offRoadGrip: 0.8,
      maxSpeed: 1.0,
      acceleration: 1.0,
      brakeForce: 1.0,
    },
    filters: {
      global: "brightness(0.7) saturate(0.9)",
      background: "brightness(0.5)",
      road: "",
    },
    background: "background-level-1.svg",
  },

  fog: {
    id: "fog",
    name: "Fog",
    description: "Tense and claustrophobic. Visibility severely reduced.",
    colors: {
      sky: "#9e9e9e",
      fog: "#7a8a7a",
      road: {
        road: "#5a5a5a",
        grass: "#4a5d4a",
        rumble: "#6a6a6a",
        lane: "#888888",
      },
    },
    effects: { fogDensity: 8, fogStart: 0.3 },
    physics: {
      grip: 1.0,
      offRoadGrip: 0.9,
      maxSpeed: 0.95,
      acceleration: 1.0,
      brakeForce: 1.0,
    },
    filters: {
      global: "blur(0.3px) contrast(0.9) brightness(0.9)",
      background: "",
      road: "",
    },
    background: "background-level-1.svg",
  },

  snow: {
    id: "snow",
    name: "Snow",
    description: "Slippery and bright. Car skids on ice patches.",
    colors: {
      sky: "#e8f4fc",
      fog: "#d0e8f0",
      road: {
        road: "#e8e8e8",
        grass: "#f5f5f5",
        rumble: "#cccccc",
        lane: "#333333",
      },
    },
    effects: {
      fogDensity: 3,
      fogStart: 0.7,
      snow: { density: 50, speed: 2, direction: 0.1, sprite: "snowflake.svg" },
    },
    physics: {
      grip: 0.6,
      offRoadGrip: 0.3,
      maxSpeed: 0.85,
      acceleration: 0.8,
      brakeForce: 0.5,
      slippery: true,
    },
    filters: {
      global: "saturate(0.7) brightness(1.05)",
      background: "",
      road: "",
    },
    background: "background-level-1.svg",
  },

  storm: {
    id: "storm",
    name: "Storm",
    description: "Intense and chaotic. Lightning and heavy rain.",
    colors: {
      sky: "#2d1b4e",
      fog: "#1a1a2e",
      road: {
        road: "#4a4a5a",
        grass: "#2a3a2a",
        rumble: "#5a5a6a",
        lane: "#8a8a9a",
      },
    },
    effects: {
      fogDensity: 6,
      fogStart: 0.5,
      rain: { density: 100, speed: 8, direction: 0.2, sprite: "raindrop.svg" },
      lightning: { interval: 8000, duration: 150, flashIntensity: 0.4 },
    },
    physics: {
      grip: 0.85,
      offRoadGrip: 0.6,
      maxSpeed: 0.9,
      acceleration: 0.95,
      brakeForce: 0.9,
      slippery: true,
    },
    filters: {
      global: "saturate(0.8) brightness(0.85) contrast(1.1)",
      background: "",
      road: "",
    },
    background: "background-level-1.svg",
  },

  desert: {
    id: "desert",
    name: "Desert",
    description: "Hot and hazardous. Sand slows you down.",
    colors: {
      sky: "#f4a460",
      fog: "#daa520",
      road: {
        road: "#d2691e",
        grass: "#f4a460",
        rumble: "#8b4513",
        lane: "#ffdead",
      },
    },
    effects: { fogDensity: 3, fogStart: 0.7, heatHaze: true },
    physics: {
      grip: 0.95,
      offRoadGrip: 0.4,
      maxSpeed: 1.0,
      acceleration: 0.9,
      brakeForce: 1.0,
    },
    filters: {
      global: "saturate(1.2) sepia(0.15) brightness(1.05)",
      background: "",
      road: "",
    },
    background: "background-level-1.svg",
  },

  future: {
    id: "future",
    name: "Future",
    description: "Sci-fi vibe. Turbo zones and laser obstacles.",
    colors: {
      sky: "#0d0d2a",
      fog: "#1a1a3e",
      road: {
        road: "#1a1a3e",
        grass: "#0d0d2a",
        rumble: "#00ffff",
        lane: "#ff00ff",
      },
    },
    effects: { fogDensity: 2, fogStart: 0.8 },
    physics: {
      grip: 1.0,
      offRoadGrip: 0.8,
      maxSpeed: 1.2,
      acceleration: 1.1,
      brakeForce: 1.0,
      turboZones: true,
    },
    filters: {
      global: "contrast(1.2) saturate(1.2) hue-rotate(10deg)",
      background: "",
      road: "",
    },
    background: "background-level-1.svg",
  },

  marsh: {
    id: "marsh",
    name: "Marsh",
    description: "Slippery and dirty. Oil and water make handling difficult.",
    colors: {
      sky: "#4a5d4a",
      fog: "#3d4d3d",
      road: {
        road: "#5d4037",
        grass: "#2e7d32",
        rumble: "#4a3a2a",
        lane: "#8a8a7a",
      },
    },
    effects: { fogDensity: 4, fogStart: 0.6 },
    physics: {
      grip: 0.7,
      offRoadGrip: 0.3,
      maxSpeed: 0.85,
      acceleration: 0.7,
      brakeForce: 0.8,
      slippery: true,
    },
    filters: {
      global: "saturate(0.8) brightness(0.9)",
      background: "",
      road: "",
    },
    background: "background-level-1.svg",
  },

  mountains: {
    id: "mountains",
    name: "Mountains",
    description: "Precarious. Narrow roads with sheer drops.",
    colors: {
      sky: "#87ceeb",
      fog: "#a0a0a0",
      road: {
        road: "#6b4423",
        grass: "#4a7c4a",
        rumble: "#808080",
        lane: "#cccccc",
      },
    },
    effects: { fogDensity: 4, fogStart: 0.5 },
    physics: {
      grip: 1.0,
      offRoadGrip: 0.5,
      maxSpeed: 0.9,
      acceleration: 0.95,
      brakeForce: 1.1,
    },
    filters: {
      global: "saturate(0.9) brightness(0.95)",
      background: "",
      road: "",
    },
    background: "background-level-1.svg",
  },

  lakes: {
    id: "lakes",
    name: "Lakes",
    description: "Scenic but tricky. Jump across rivers.",
    colors: {
      sky: "#87ceeb",
      fog: "#a0d0e0",
      road: {
        road: "#4a4a4a",
        grass: "#4caf50",
        rumble: "#3a8a3a",
        lane: "#ffffff",
      },
    },
    effects: { fogDensity: 2, fogStart: 0.8 },
    physics: {
      grip: 0.9,
      offRoadGrip: 0.6,
      maxSpeed: 1.0,
      acceleration: 1.0,
      brakeForce: 0.9,
      jumpZones: true,
    },
    filters: {
      global: "saturate(1.2) brightness(1.05)",
      background: "",
      road: "",
    },
    background: "background-level-1.svg",
  },

  country: {
    id: "country",
    name: "Country",
    description: "Relaxed but winding. Logs, rocks, and fords.",
    colors: {
      sky: "#87ceeb",
      fog: "#a0c0a0",
      road: {
        road: "#5a5a5a",
        grass: "#4caf50",
        rumble: "#8b4513",
        lane: "#ffffff",
      },
    },
    effects: { fogDensity: 2, fogStart: 0.8 },
    physics: {
      grip: 1.0,
      offRoadGrip: 0.7,
      maxSpeed: 1.0,
      acceleration: 1.0,
      brakeForce: 1.0,
    },
    filters: {
      global: "saturate(1.2) brightness(1.1)",
      background: "",
      road: "",
    },
    background: "background-level-1.svg",
  },

  city: {
    id: "city",
    name: "City",
    description: "Urban and busy. Wide motorway with oncoming traffic.",
    colors: {
      sky: "#4a6080",
      fog: "#3a4a5a",
      road: {
        road: "#4a4a4a",
        grass: "#2a2a2a",
        rumble: "#1a1a1a",
        lane: "#ffffff",
      },
    },
    effects: { fogDensity: 3, fogStart: 0.7 },
    physics: {
      grip: 1.0,
      offRoadGrip: 0.3,
      maxSpeed: 1.1,
      acceleration: 1.0,
      brakeForce: 1.0,
    },
    filters: {
      global: "saturate(0.9) brightness(0.95)",
      background: "",
      road: "",
    },
    background: "background-level-1.svg",
  },

  roadworks: {
    id: "roadworks",
    name: "Roadworks",
    description: "Frantic. Bollards and signs everywhere.",
    colors: {
      sky: "#708090",
      fog: "#5a6a7a",
      road: {
        road: "#4a4a4a",
        grass: "#3a3a3a",
        rumble: "#ff6600",
        lane: "#ffffff",
      },
    },
    effects: { fogDensity: 3, fogStart: 0.7 },
    physics: {
      grip: 1.0,
      offRoadGrip: 0.5,
      maxSpeed: 0.85,
      acceleration: 0.9,
      brakeForce: 1.2,
    },
    filters: { global: "", background: "", road: "" },
    background: "background-level-1.svg",
  },

  windy: {
    id: "windy",
    name: "Windy",
    description: "Open and quirky. Tumbleweeds and strong gusts.",
    colors: {
      sky: "#fffacd",
      fog: "#e8d8b8",
      road: {
        road: "#c4a06a",
        grass: "#d2b48c",
        rumble: "#8b7355",
        lane: "#ffffff",
      },
    },
    effects: {
      fogDensity: 2,
      fogStart: 0.8,
      wind: {
        baseForce: 0.1,
        gustInterval: 8000,
        gustDuration: 1500,
        maxGustForce: 0.2,
        direction: 0,
      },
    },
    physics: {
      grip: 0.95,
      offRoadGrip: 0.7,
      maxSpeed: 1.0,
      acceleration: 1.0,
      brakeForce: 1.0,
      windForce: 0.3,
    },
    filters: { global: "sepia(0.1) saturate(0.9)", background: "", road: "" },
    background: "background-level-1.svg",
    spriteOverrides: {
      PALM_TREE: "CACTUS",
      TREE1: "DEAD_TREE1",
      TREE2: "DEAD_TREE2",
    },
  },
};

export const THEME_ORDER = [
  "night",
  "fog",
  "snow",
  "storm",
  "desert",
  "future",
  "marsh",
  "mountains",
  "lakes",
  "country",
  "city",
  "roadworks",
  "windy",
] as const;
