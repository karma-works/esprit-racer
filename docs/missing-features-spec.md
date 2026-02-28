# Missing Features Specification

## Overview

This document specifies features from Lotus III: The Ultimate Challenge that are missing from current implementation. Priority order: Championship Mode, Car Selection, RECS Code System, Fuel/Pit Stops, Gear System.

---

## 1. Car Selection System

### 1.1 Cars

Three selectable cars with distinct attributes:

| Car                 | Top Speed | Acceleration | Handling | Characteristic    |
| ------------------- | --------- | ------------ | -------- | ----------------- |
| Lotus Esprit (Road) | 280 km/h  | Medium       | High     | Stable, forgiving |
| Lotus Esprit S4     | 295 km/h  | High         | Medium   | Balanced          |
| Lotus M200          | 310 km/h  | Low          | Low      | Fast but slippery |

### 1.2 Car Attributes Structure

```typescript
interface CarType {
  id: string;
  name: string;
  topSpeed: number; // multiplier: 0.85 - 1.1
  acceleration: number; // multiplier: 0.8 - 1.2
  handling: number; // grip multiplier: 0.7 - 1.0
  braking: number; // multiplier: 0.8 - 1.1
  sprite: string; // SVG sprite name
}
```

### 1.3 Car Selection Screen

- Display after main menu, before track selection
- Show all three cars side by side
- Cycle through with LEFT/RIGHT arrows
- Display stats as bars (speed, accel, handling)
- Confirm with SPACE/ENTER
- 2-player mode: each player selects independently

### 1.4 Implementation Points

- Add `selectedCar: CarType` to PlayerState
- Modify `applyThemePhysics` to also apply car modifiers
- Create car selection UI screen
- Store car choice per player in multiplayer

---

## 2. Gear System

### 2.1 Transmission Modes

| Mode      | Description                                  |
| --------- | -------------------------------------------- |
| Automatic | Game shifts gears automatically based on RPM |
| Manual    | Player shifts with Z (up) and X (down) keys  |

### 2.2 Gear Mechanics

```typescript
interface GearState {
  currentGear: number; // 1-5 or 1-6 depending on car
  rpm: number; // 0-8000 range
  autoShiftUp: number; // RPM threshold for auto upshift
  autoShiftDown: number; // RPM threshold for auto downshift
}
```

### 2.3 Physics Per Gear

| Gear | Max Speed     | Torque  |
| ---- | ------------- | ------- |
| 1    | 0-60 km/h     | Highest |
| 2    | 60-100 km/h   | High    |
| 3    | 100-150 km/h  | Medium  |
| 4    | 150-220 km/h  | Low     |
| 5    | 220-300+ km/h | Lowest  |

### 2.4 RPM Behavior

- RPM rises with throttle, falls when off throttle
- Shift up: RPM drops, speed cap increases
- Shift down: RPM jumps, more torque for acceleration
- Low RPM in high gear = sluggish acceleration
- Over-rev (>7500 RPM) = speed limiter kicks in
- Stall condition: RPM < 500 in gear = engine stall, speed drops rapidly

### 2.5 HUD Elements

- Gear indicator: large number "1" through "5" or "6"
- RPM bar: horizontal bar with redline zone (6500-8000)
- Optional: tachometer arc display

### 2.6 Input Mapping (Manual Mode)

- Z key: shift up
- X key: shift down
- Display current gear in HUD

---

## 3. Championship Mode

### 3.1 Structure

| Difficulty | Tracks | Required Finish |
| ---------- | ------ | --------------- |
| Easy       | 7      | Top 10          |
| Medium     | 10     | Top 10          |
| Hard       | 15     | Top 10          |

### 3.2 Championship State

```typescript
interface ChampionshipState {
  difficulty: "easy" | "medium" | "hard";
  currentRace: number;
  totalRaces: number;
  points: number;
  positionHistory: number[];
  gridPosition: number;
  trackSequence: string[]; // theme IDs
  passwords: string[];
  eliminated: boolean;
}
```

### 3.3 Points System

| Position | Points |
| -------- | ------ |
| 1st      | 10     |
| 2nd      | 8      |
| 3rd      | 6      |
| 4th      | 5      |
| 5th      | 4      |
| 6th      | 3      |
| 7th      | 2      |
| 8th      | 1      |
| 9th-20th | 0      |

### 3.4 Progression Rules

1. Must finish in top 10 to advance
2. Finish position determines next race grid position
   - 1st place finish → start last (20th)
   - 2nd place finish → start 19th
   - etc.
3. 11th-20th = elimination, game over
4. After each race: show standings table
5. After final race: show champion screen

### 3.5 Grid Positions

```typescript
interface GridPosition {
  carId: number;
  startPosition: number; // 1-20
  isPlayer: boolean;
}

// Starting order calculation
const calculateGridPosition = (previousFinish: number): number => {
  if (previousFinish === 0) return Math.floor(Math.random() * 10) + 1;
  return 21 - previousFinish; // Reverse order
};
```

### 3.6 Password System

- After each race: generate 12-character password
- Password encodes: difficulty, current race, points, car selection
- Password entry screen accessible from main menu
- Allow continuing championship from any point

### 3.7 Championship Menu Flow

```
Main Menu → Championship → Select Difficulty → Car Selection → Race 1
                                                          ↓
                                         Race Complete → Top 10?
                                                ↓           ↓
                                               Yes          No → Game Over
                                                ↓
                                      Show Standings → More Races?
                                                ↓           ↓
                                               Yes          No → Champion!
                                                ↓
                                      Next Race (with new grid position)
```

---

## 4. Arcade Mode (Stage-Based)

### 4.1 Structure

| Difficulty | Stages | Time Limit Behavior |
| ---------- | ------ | ------------------- |
| Easy       | 7      | Generous            |
| Medium     | 10     | Moderate            |
| Hard       | 15     | Tight               |

### 4.2 Arcade State

```typescript
interface ArcadeState {
  difficulty: "easy" | "medium" | "hard";
  currentStage: number;
  totalStages: number;
  score: number;
  timeLimit: number;
  stageSequence: ArcadeStage[];
  password: string;
}

interface ArcadeStage {
  themeId: string;
  timeLimit: number; // seconds
  trackLength: number; // derived from RECS params
  parTime: number; // target time for bonus
}
```

### 4.3 Time Limits

Time limits calculated per stage based on track parameters:

```typescript
const calculateTimeLimit = (
  trackLength: number,
  difficulty: "easy" | "medium" | "hard",
  curves: number,
  obstacles: number,
): number => {
  const baseTime = trackLength / AVERAGE_SPEED;
  const difficultyMultiplier = {
    easy: 1.3,
    medium: 1.0,
    hard: 0.75,
  };
  const curvesPenalty = curves * 0.5;
  const obstaclesPenalty = obstacles * 0.3;

  return Math.floor(
    baseTime * difficultyMultiplier[difficulty] +
      curvesPenalty +
      obstaclesPenalty,
  );
};
```

### 4.4 Scoring

| Action                    | Points    |
| ------------------------- | --------- |
| Finish in time            | 100       |
| Under par time            | +50 bonus |
| Per checkpoint passed     | +25       |
| Per second remaining      | +2        |
| Clean lap (no collisions) | +100      |

### 4.5 Stage Progression

- Must finish within time limit to advance
- Game over if time runs out
- Show stage results with score breakdown
- Password after each stage for continuation

---

## 5. RECS Code System

### 5.1 Code Format

12-character alphanumeric code: `XXXXXXXXXX-YY`

- First 9 characters: letters A-Z (base-26 encoded parameters)
- Last 2 characters: digits 0-9 (checksum + version)

### 5.2 Parameters Encoded

| Parameter              | Range | Bits |
| ---------------------- | ----- | ---- |
| Curves                 | 0-100 | 7    |
| Sharpness              | 0-100 | 7    |
| Hills                  | 0-100 | 7    |
| Steepness              | 0-100 | 7    |
| Obstacles              | 0-100 | 7    |
| Scenery/Theme          | 0-12  | 4    |
| Race Type (laps/stage) | 0-1   | 1    |
| Difficulty             | 0-2   | 2    |
| Length                 | 0-100 | 7    |

Total: 49 bits → fits in 9 base-26 characters

### 5.3 Code Generation

```typescript
const generateRECSCode = (config: RECSConfig): string => {
  // Pack parameters into bit array
  let bits = 0n;
  bits = (bits << 7n) | BigInt(config.curves);
  bits = (bits << 7n) | BigInt(config.sharpness);
  bits = (bits << 7n) | BigInt(config.hills);
  bits = (bits << 7n) | BigInt(config.steepness);
  bits = (bits << 7n) | BigInt(config.obstacles);
  bits = (bits << 4n) | BigInt(THEME_ORDER.indexOf(config.themeId));
  bits = (bits << 1n) | BigInt(config.raceType === "laps" ? 0 : 1);
  bits =
    (bits << 2n) |
    BigInt(["easy", "medium", "hard"].indexOf(config.difficulty));
  bits = (bits << 7n) | BigInt(config.length);

  // Convert to base-26
  let code = "";
  for (let i = 0; i < 9; i++) {
    code = ALPHABET[Number(bits % 26n)] + code;
    bits /= 26n;
  }

  // Calculate checksum
  const checksum = calculateChecksum(code);
  return `${code}-${checksum.toString().padStart(2, "0")}`;
};
```

### 5.4 Code Decoding

```typescript
const decodeRECSCode = (code: string): RECSConfig | null => {
  const match = code.match(/^([A-Z]{9})-(\d{2})$/);
  if (!match) return null;

  const [_, letters, checksumStr] = match;

  // Verify checksum
  if (parseInt(checksumStr) !== calculateChecksum(letters)) {
    return null;
  }

  // Convert from base-26
  let bits = 0n;
  for (const char of letters) {
    bits = bits * 26n + BigInt(ALPHABET.indexOf(char));
  }

  // Extract parameters (reverse order)
  const length = Number(bits & 0x7fn);
  bits >>= 7n;
  const difficulty = Number(bits & 0x3n);
  bits >>= 2n;
  const raceType = Number(bits & 0x1n);
  bits >>= 1n;
  const themeIndex = Number(bits & 0xfn);
  bits >>= 4n;
  const obstacles = Number(bits & 0x7fn);
  bits >>= 7n;
  const steepness = Number(bits & 0x7fn);
  bits >>= 7n;
  const hills = Number(bits & 0x7fn);
  bits >>= 7n;
  const sharpness = Number(bits & 0x7fn);
  bits >>= 7n;
  const curves = Number(bits & 0x7fn);

  return {
    curves,
    sharpness,
    hills,
    steepness,
    obstacles,
    length,
    themeId: THEME_ORDER[themeIndex] ?? "night",
    raceType: raceType === 0 ? "laps" : "stage",
    difficulty: ["easy", "medium", "hard"][difficulty] ?? "medium",
    scenery: 50,
    scatter: 50,
  };
};
```

### 5.5 UI Integration

- Display code field on RECS screen
- Real-time code update as sliders change
- Text input for entering codes
- "Load Code" button
- "Share Code" button (copy to clipboard)

---

## 6. Fuel System & Pit Stops

### 6.1 Fuel Mechanics

```typescript
interface FuelState {
  currentFuel: number; // 0-100 percentage
  consumptionRate: number; // % per segment
  pitStopRequired: boolean;
  pitStopTaken: boolean;
}
```

### 6.2 Fuel Consumption

```typescript
const FUEL_CONSUMPTION = {
  base: 0.001, // % per segment at cruise
  throttle: 0.002, // additional when accelerating
  highRPM: 0.001, // additional above 6000 RPM
};

const updateFuel = (state: FuelState, input: InputState, rpm: number): void => {
  let consumption = FUEL_CONSUMPTION.base;
  if (input.faster) consumption += FUEL_CONSUMPTION.throttle;
  if (rpm > 6000) consumption += FUEL_CONSUMPTION.highRPM;

  state.currentFuel = Math.max(0, state.currentFuel - consumption);

  if (state.currentFuel <= 0) {
    // Engine cuts out, max speed limited to 50%
  }
};
```

### 6.3 Pit Stop Zone

- Located after start/finish line
- Marked with "PIT" signage on track
- Entering pit lane:
  - Speed automatically limited to 80 km/h
  - Fuel refilled to 100%
  - Time penalty: ~3 seconds

### 6.4 Pit Stop UI

- Fuel gauge bar in HUD (green → yellow → red)
- Low fuel warning (flash when < 20%)
- "PIT" indicator when approaching pit zone
- Pit lane entry visual markers

### 6.5 Championship Fuel Strategy

- Longer races require 1-2 pit stops
- Fuel load affects acceleration (lighter = faster)
- AI also pits, creating strategic opportunities

---

## 7. Turbo Zones

### 7.1 Zone Definition

```typescript
interface TurboZone {
  startSegment: number;
  endSegment: number;
  speedMultiplier: number; // 1.3-1.5
  visualEffect: "chequered" | "neon" | "electric";
}
```

### 7.2 Behavior

- Player enters zone: maxSpeed temporarily increased
- Speed multiplier: 1.3x - 1.5x
- Visual: road texture changes to futuristic pattern
- Audio: engine pitch rises, whoosh sound
- Exit zone: speed gradually returns to normal

### 7.3 Implementation

```typescript
const updateTurboZone = (
  player: PlayerState,
  segment: Segment,
  config: GameConfig,
): GameConfig => {
  const turboZone = segment.turboZone;
  if (turboZone) {
    return {
      ...config,
      maxSpeed: config.maxSpeed * turboZone.speedMultiplier,
    };
  }
  return config;
};
```

### 7.4 Future Theme Integration

- 2-3 turbo zones per Future theme track
- Marked with cyan/magenta lane markings
- Shock tower obstacles nearby for risk/reward

---

## 8. Jump Zones

### 8.1 Zone Definition

```typescript
interface JumpZone {
  startSegment: number;
  length: number; // segments
  peakHeight: number; // visual jump height
  landingSegment: number;
}
```

### 8.2 Behavior

- Car launches into air at ramp
- Camera follows arc trajectory
- Landing: brief speed reduction, bounce effect
- Mid-air: reduced steering control
- Water splash effect on landing (Lakes theme)

### 8.3 Partially Implemented

Current code has `JumpState` and `updateJump` in world.ts but not fully integrated with track segments.

### 8.4 Required Additions

- Add JumpZone data to track segments
- Visual ramp sprites
- Landing impact sound
- Suspension compression animation

---

## 9. Additional Obstacles

### 9.1 Shock Towers (Future Theme)

```typescript
interface ShockTower {
  segment: number;
  offset: number; // lateral position
  active: boolean;
  damageOnHit: number;
}
```

- Tall electrical pylons beside road
- Contact causes: speed reduction, screen flash, control wobble
- Placed near turbo zones for risk/reward

### 9.2 Oil Slicks (Marsh/Lakes)

```typescript
interface OilSlick {
  segment: number;
  offset: number;
  width: number;
}
```

- Dark patches on road surface
- Contact: reduced grip for 2 seconds
- Visual: rainbow sheen effect
- Sound: splatter noise

### 9.3 Implementation

```typescript
const checkObstacleCollision = (
  player: PlayerState,
  segment: Segment,
): CollisionResult => {
  // Check shock towers
  for (const tower of segment.shockTowers) {
    if (Math.abs(player.x - tower.offset) < COLLISION_THRESHOLD) {
      return { type: "shock", speedReduction: 0.3, duration: 0.5 };
    }
  }

  // Check oil slicks
  for (const slick of segment.oilSlicks) {
    if (Math.abs(player.x - slick.offset) < slick.width / 2) {
      return { type: "oil", gripReduction: 0.3, duration: 2.0 };
    }
  }

  return { type: "none" };
};
```

---

## 10. HUD Enhancements

### 10.1 Missing Elements

| Element       | Description                               | Mode         |
| ------------- | ----------------------------------------- | ------------ |
| Gear          | Current gear number (1-5)                 | All          |
| RPM           | Rev counter bar/tacho                     | All          |
| Fuel          | Fuel level bar                            | Championship |
| Position Band | Left/right bars showing relative position | Championship |
| Lap Bar       | Segmented bar showing laps completed      | All          |

### 10.2 Position Band Implementation

```
Player at center (|)
[Ahead cars shown left] | [Behind cars shown right]

Example (player in 3rd):
[1][2] | [4][5][6][7][8]
```

### 10.3 Enhanced HUD State

```typescript
interface EnhancedHudState {
  // Existing
  speed: number;
  position: number;
  lap: number;
  totalLaps: number;

  // New
  gear: number;
  rpm: number;
  maxRpm: number;
  fuel: number;
  carsAhead: number;
  carsBehind: number;
  positionBand: PositionBandCar[];
}

interface PositionBandCar {
  relativePosition: number; // -1 to 1
  color: string;
}
```

---

## 11. Collision & Spin Effects

### 11.1 Collision Types

| Collision    | Effect                                 |
| ------------ | -------------------------------------- |
| Light tap    | Brief wobble, no speed loss            |
| Medium hit   | Speed reduction 10%, control loss 0.5s |
| Heavy crash  | Speed reduction 50%, spin effect       |
| Wall/barrier | Bounce back, speed reduction           |

### 11.2 Spin Effect

```typescript
interface SpinState {
  active: boolean;
  direction: -1 | 1;
  duration: number;
  intensity: number;
}

const updateSpin = (player: PlayerState, spin: SpinState, dt: number): void => {
  if (!spin.active) return;

  spin.duration -= dt;
  if (spin.duration <= 0) {
    spin.active = false;
    return;
  }

  // Rotate car view
  player.spinAngle =
    spin.direction * spin.intensity * (spin.duration / SPIN_DURATION);

  // Reduce speed during spin
  player.speed *= 0.95;
};
```

### 11.3 Visual Feedback

- Screen shake on collision
- Car sprite rotation during spin
- Sparks/debris particles
- Sound: crash, screech, thud based on intensity

---

## 12. Level Sequences & Scenarios

### 12.1 Overall Structure

**Six predefined level sequences** built from **64 fixed circuits** using **13 distinct scenarios**:

| Mode         | Easy   | Medium | Hard   | Total  |
| ------------ | ------ | ------ | ------ | ------ |
| Arcade       | 7      | 10     | 15     | 32     |
| Championship | 7      | 10     | 15     | 32     |
| **Total**    | **14** | **20** | **30** | **64** |

### 12.2 Level Sequence Definition

```typescript
interface LevelSequence {
  id: string;
  mode: "arcade" | "championship";
  difficulty: "easy" | "medium" | "hard";
  tracks: BuiltInTrack[];
  totalTime: number; // for arcade mode
}

interface BuiltInTrack {
  id: string;
  name: string;
  scenario: ScenarioType;
  laps: number;
  theme: LevelTheme;
  obstacles: ObstacleConfig;
  features: TrackFeature[];
}

type ScenarioType =
  | "rally"
  | "futuristic"
  | "night"
  | "marsh"
  | "mountains"
  | "snow"
  | "roadworks"
  | "storm"
  | "desert"
  | "fog"
  | "motorway"
  | "wind"
  | "forest";
```

### 12.3 Scenario Definitions

#### Rally

| Attribute      | Value                                   |
| -------------- | --------------------------------------- |
| Track Style    | Off-road/dirt, mud pools, water puddles |
| Surface        | Unpaved, ruts, bumps                    |
| Grip           | Very low (0.4-0.6)                      |
| Visual Cues    | Brown/orange terrain, splash effects    |
| Dynamic Effect | Slides easily, braking must be gentle   |
| Speed Feel     | Lower top speed, struggles for momentum |
| Easy Variant   | Fewer mud patches, clearer lines        |
| Hard Variant   | Dense mud, tight off-road sections      |

```typescript
const RALLY_THEME: LevelTheme = {
  id: "rally",
  name: "Rally",
  colors: {
    sky: "#8B7355",
    fog: "#6B5344",
    road: { road: "#8B4513", grass: "#A0522D", rumble: "#654321" },
  },
  effects: { fogDensity: 3, fogStart: 0.7 },
  physics: {
    grip: 0.5,
    offRoadGrip: 0.3,
    maxSpeed: 0.85,
    acceleration: 0.8,
    brakeForce: 0.6,
    slippery: true,
  },
  obstacles: ["mud_pool", "water_puddle", "rut", "rock"],
};
```

#### Futuristic (Futureworld / Turbo-style)

| Attribute      | Value                                          |
| -------------- | ---------------------------------------------- |
| Track Style    | Urban-futuristic, tiled chequered patterns     |
| Features       | Shock towers, turbo zones, tall structures     |
| Grip           | Normal to high (0.9-1.0)                       |
| Max Speed      | Highest in game (280-290+ km/h)                |
| Visual Cues    | Neon lanes, chrome surfaces, electric effects  |
| Dynamic Effect | Turbo zones raise speed cap temporarily        |
| Easy Variant   | Fewer shock towers, wider safe lines           |
| Hard Variant   | Dense obstacles, tighter turns, narrower lanes |

```typescript
const FUTURISTIC_THEME: LevelTheme = {
  id: "futuristic",
  name: "Futuristic",
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
  obstacles: ["shock_tower", "laser_barrier", "energy_field"],
  specialFeatures: ["turbo_zones", "high_speed_sections"],
};
```

#### Night

| Attribute      | Value                                         |
| -------------- | --------------------------------------------- |
| Track Style    | Classic night-time circuit                    |
| Visibility     | Reduced, road marked but background dark      |
| Grip           | Normal (1.0)                                  |
| Visual Cues    | Dark sky, neon accents, Manhattan skyline     |
| Dynamic Effect | Must anticipate turns earlier, nerve-wracking |
| Easy Variant   | Gentler radius, longer straights              |
| Hard Variant   | Dense curves, aggressive AI                   |

```typescript
const NIGHT_THEME: LevelTheme = {
  id: "night",
  name: "Night",
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
  },
};
```

#### Marsh

| Attribute      | Value                                            |
| -------------- | ------------------------------------------------ |
| Track Style    | Low-lying, oily, muddy, submerged water sections |
| Surface        | Shallow water, slick mud, narrow dry strips      |
| Grip           | Very low (0.5-0.7)                               |
| Visual Cues    | Brown/green murky colors, oil sheen              |
| Dynamic Effect | Car feels heavy, slow recovery from slides       |
| Easy Variant   | Fewer water sections, clearer dry paths          |
| Hard Variant   | Random patches, fewer safe lanes                 |

```typescript
const MARSH_THEME: LevelTheme = {
  id: "marsh",
  name: "Marsh",
  colors: {
    sky: "#4a5d4a",
    fog: "#3d4d3d",
    road: { road: "#5d4037", grass: "#2e7d32", rumble: "#4a3a2a" },
  },
  effects: { fogDensity: 4, fogStart: 0.6 },
  physics: {
    grip: 0.6,
    offRoadGrip: 0.25,
    maxSpeed: 0.85,
    acceleration: 0.7,
    brakeForce: 0.8,
    slippery: true,
  },
  obstacles: ["oil_slick", "water_section", "mud_patch"],
};
```

#### Mountains

| Attribute      | Value                                            |
| -------------- | ------------------------------------------------ |
| Track Style    | Narrow cliff-side road, sheer drops              |
| Layout         | Ridge roads, mountain on one side, drop on other |
| Grip           | Normal (1.0)                                     |
| Visual Cues    | Earth tones, stone grey, elevation changes       |
| Dynamic Effect | No room to drift, high-speed sweeping turns      |
| Easy Variant   | Gentler gradients, wider road appearance         |
| Hard Variant   | Steeper gradients, tight hairpins, AI blocking   |

```typescript
const MOUNTAINS_THEME: LevelTheme = {
  id: "mountains",
  name: "Mountains",
  colors: {
    sky: "#87ceeb",
    fog: "#a0a0a0",
    road: { road: "#6b4423", grass: "#4a7c4a", rumble: "#808080" },
  },
  effects: { fogDensity: 4, fogStart: 0.5 },
  physics: {
    grip: 1.0,
    offRoadGrip: 0.5,
    maxSpeed: 0.9,
    acceleration: 0.95,
    brakeForce: 1.1,
  },
  specialFeatures: ["cliff_edges", "elevation_changes", "narrow_roads"],
};
```

#### Snow

| Attribute      | Value                                          |
| -------------- | ---------------------------------------------- |
| Track Style    | Frozen road, ice patches, soft snow banks      |
| Surface        | White with off-road snow, visible ice          |
| Grip           | Very low (0.5-0.7)                             |
| Visual Cues    | Crisp white, pale blue, snow particles         |
| Dynamic Effect | Long braking distances, delayed steering       |
| Easy Variant   | Shorter snowy sections, clearer lines          |
| Hard Variant   | More slip-zones per turn, conservative braking |

```typescript
const SNOW_THEME: LevelTheme = {
  id: "snow",
  name: "Snow",
  colors: {
    sky: "#e8f4fc",
    fog: "#d0e8f0",
    road: { road: "#e8e8e8", grass: "#f5f5f5", rumble: "#cccccc" },
  },
  effects: {
    fogDensity: 3,
    fogStart: 0.7,
    snow: { density: 50, speed: 2, direction: 0.1 },
  },
  physics: {
    grip: 0.55,
    offRoadGrip: 0.3,
    maxSpeed: 0.85,
    acceleration: 0.8,
    brakeForce: 0.5,
    slippery: true,
  },
};
```

#### Roadworks / Roadwerx

| Attribute      | Value                                          |
| -------------- | ---------------------------------------------- |
| Track Style    | Construction zones, cones, barriers, plates    |
| Layout         | Straight-ish but littered with obstacles       |
| Grip           | Normal (1.0)                                   |
| Visual Cues    | Safety orange, black/white stripes, bollards   |
| Dynamic Effect | Must dance between obstacles, memorize pattern |
| Easy Variant   | Fewer plates, wider gaps                       |
| Hard Variant   | Denser obstacles, combined with sharper turns  |

```typescript
const ROADWORKS_THEME: LevelTheme = {
  id: "roadworks",
  name: "Roadworks",
  colors: {
    sky: "#708090",
    fog: "#5a6a7a",
    road: { road: "#4a4a4a", grass: "#3a3a3a", rumble: "#ff6600" },
  },
  effects: { fogDensity: 3, fogStart: 0.7 },
  physics: {
    grip: 1.0,
    offRoadGrip: 0.5,
    maxSpeed: 0.85,
    acceleration: 0.9,
    brakeForce: 1.2,
  },
  obstacles: ["cone", "barrier", "road_plate", "bollard", "sign"],
};
```

#### Storm

| Attribute      | Value                                          |
| -------------- | ---------------------------------------------- |
| Track Style    | Rain-soaked, dark overcast, heavy rain effects |
| Visibility     | Wet and slick, slight fog-like reduction       |
| Grip           | Reduced (0.8-0.9)                              |
| Visual Cues    | Dark purple, slate grey, lightning flashes     |
| Dynamic Effect | Smoother braking/steering required             |
| Easy Variant   | Mildly wet, simple turns                       |
| Hard Variant   | Complex curves, longer track, high-risk        |

```typescript
const STORM_THEME: LevelTheme = {
  id: "storm",
  name: "Storm",
  colors: {
    sky: "#2d1b4e",
    fog: "#1a1a2e",
    road: { road: "#4a4a5a", grass: "#2a3a2a", rumble: "#5a5a6a" },
  },
  effects: {
    fogDensity: 6,
    fogStart: 0.5,
    rain: { density: 100, speed: 8, direction: 0.2 },
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
};
```

#### Desert

| Attribute      | Value                                      |
| -------------- | ------------------------------------------ |
| Track Style    | Open dusty road, sand dunes, flat expanses |
| Layout         | Flat, fast-friendly, winding through dunes |
| Grip           | Normal on road, very low off-road          |
| Visual Cues    | Orange, tan, bright yellow, heat haze      |
| Dynamic Effect | Stay near top-speed on road, avoid sand    |
| Easy Variant   | Straightforward, long straights            |
| Hard Variant   | More S-curves, off-road pitfalls           |

```typescript
const DESERT_THEME: LevelTheme = {
  id: "desert",
  name: "Desert",
  colors: {
    sky: "#f4a460",
    fog: "#daa520",
    road: { road: "#d2691e", grass: "#f4a460", rumble: "#8b4513" },
  },
  effects: { fogDensity: 3, fogStart: 0.7, heatHaze: true },
  physics: {
    grip: 0.95,
    offRoadGrip: 0.35,
    maxSpeed: 1.0,
    acceleration: 0.9,
    brakeForce: 1.0,
  },
};
```

#### Fog

| Attribute      | Value                                      |
| -------------- | ------------------------------------------ |
| Track Style    | Thick fog, most visually restricted        |
| Visibility     | Only closest section visible, split-second |
| Grip           | Normal (1.0)                               |
| Visual Cues    | Grey, muted green, white wash              |
| Dynamic Effect | Rely on pre-brake markers and memory       |
| Cognitive Load | High - one of hardest levels               |
| Easy Variant   | Sparser corners, shorter stretches         |
| Hard Variant   | Tight frequent bends, few landmarks        |

```typescript
const FOG_THEME: LevelTheme = {
  id: "fog",
  name: "Fog",
  colors: {
    sky: "#9e9e9e",
    fog: "#7a8a7a",
    road: { road: "#5a5a5a", grass: "#4a5d4a", rumble: "#6a6a6a" },
  },
  effects: { fogDensity: 10, fogStart: 0.2 },
  physics: {
    grip: 1.0,
    offRoadGrip: 0.9,
    maxSpeed: 0.95,
    acceleration: 1.0,
    brakeForce: 1.0,
  },
};
```

#### Motorway

| Attribute      | Value                                       |
| -------------- | ------------------------------------------- |
| Track Style    | Classic dual-carriageway, oncoming traffic  |
| Layout         | High-speed, long straights, lane management |
| Grip           | Normal (1.0)                                |
| Visual Cues    | Grey asphalt, red/yellow lights, barriers   |
| Dynamic Effect | Manage lanes and opponents, less braking    |
| Easy Variant   | Classic feel-good track                     |
| Hard Variant   | More AI, tighter weaving, dense traffic     |

```typescript
const MOTORWAY_THEME: LevelTheme = {
  id: "motorway",
  name: "Motorway",
  colors: {
    sky: "#4a6080",
    fog: "#3a4a5a",
    road: { road: "#4a4a4a", grass: "#2a2a2a", rumble: "#1a1a1a" },
  },
  effects: { fogDensity: 3, fogStart: 0.7 },
  physics: {
    grip: 1.0,
    offRoadGrip: 0.3,
    maxSpeed: 1.1,
    acceleration: 1.0,
    brakeForce: 1.0,
  },
  specialFeatures: ["oncoming_traffic", "multi_lane"],
};
```

#### Wind

| Attribute      | Value                                           |
| -------------- | ----------------------------------------------- |
| Track Style    | Open wind-blown plain, coastal road             |
| Layout         | Long-exposure straights with cross-wind         |
| Grip           | Normal but affected by wind                     |
| Visual Cues    | Dusty brown, pale yellow, tumbleweeds           |
| Dynamic Effect | Car pushed sideways, constant corrections       |
| Difficulty     | One of most technically demanding               |
| Easy Variant   | Moderate wind, manageable                       |
| Hard Variant   | High-precision dance, over-corrections punished |

```typescript
const WIND_THEME: LevelTheme = {
  id: "windy",
  name: "Windy",
  colors: {
    sky: "#fffacd",
    fog: "#e8d8b8",
    road: { road: "#c4a06a", grass: "#d2b48c", rumble: "#8b7355" },
  },
  effects: {
    fogDensity: 2,
    fogStart: 0.8,
    wind: {
      baseForce: 0.15,
      gustInterval: 6000,
      gustDuration: 2000,
      maxGustForce: 0.25,
      direction: 0,
    },
  },
  physics: {
    grip: 0.95,
    offRoadGrip: 0.7,
    maxSpeed: 1.0,
    acceleration: 1.0,
    brakeForce: 1.0,
    windForce: 0.4,
  },
  obstacles: ["tumbleweed"],
};
```

#### Forest

| Attribute      | Value                                       |
| -------------- | ------------------------------------------- |
| Track Style    | Tree-lined, dense forest, narrow sightlines |
| Layout         | Twisty, elevation-varied, dips and rises    |
| Grip           | Normal (1.0)                                |
| Visual Cues    | Lush green, brown, sky blue through trees   |
| Dynamic Effect | Trees block view, anticipate turns early    |
| Easy Variant   | Manageable woodland                         |
| Hard Variant   | Blind-corner sequences, tighter tree-lanes  |

```typescript
const FOREST_THEME: LevelTheme = {
  id: "forest",
  name: "Forest",
  colors: {
    sky: "#87ceeb",
    fog: "#a0c0a0",
    road: { road: "#5a5a5a", grass: "#228b22", rumble: "#654321" },
  },
  effects: { fogDensity: 3, fogStart: 0.6 },
  physics: {
    grip: 1.0,
    offRoadGrip: 0.6,
    maxSpeed: 0.95,
    acceleration: 1.0,
    brakeForce: 1.0,
  },
  obstacles: ["tree", "log", "rock"],
  specialFeatures: ["blind_corners", "elevation_dips"],
};
```

### 12.4 Difficulty Scaling Matrix

| Aspect         | Easy (7-track)             | Medium (10-track)              | Hard (15-track)                       |
| -------------- | -------------------------- | ------------------------------ | ------------------------------------- |
| Curves & Hills | Gentler, fewer tight turns | More curves, steeper hills     | Very dense, tight, multiple hazards   |
| Obstacles      | Light or none              | Moderate density               | High density, combined with weather   |
| AI Aggression  | Slower, easier to overtake | More aggressive, more blocking | Very aggressive, form wall-like lines |
| Time Window    | Generous time limits       | Tighter, closer to par         | Very tight; one mistake = failure     |
| Fuel Stop      | Rare or not needed         | Some courses need 1 pit        | Longer tracks demand precise timing   |
| Turbo Zones    | Single, well-spaced        | 2-3 per track                  | Multiple with shock towers nearby     |
| Visibility     | Full or light fog          | Moderate restrictions          | Severe (fog, night, storm combined)   |

### 12.5 Built-in Track Definitions

```typescript
const BUILT_IN_TRACKS: BuiltInTrack[] = [
  // Easy Sequence (7 tracks)
  {
    id: "easy_1",
    name: "Motorway",
    scenario: "motorway",
    laps: 3,
    difficulty: "easy",
  },
  {
    id: "easy_2",
    name: "Country",
    scenario: "forest",
    laps: 3,
    difficulty: "easy",
  },
  {
    id: "easy_3",
    name: "Night Run",
    scenario: "night",
    laps: 3,
    difficulty: "easy",
  },
  {
    id: "easy_4",
    name: "Desert Sprint",
    scenario: "desert",
    laps: 3,
    difficulty: "easy",
  },
  {
    id: "easy_5",
    name: "Lakeside",
    scenario: "marsh",
    laps: 3,
    difficulty: "easy",
  },
  {
    id: "easy_6",
    name: "Hill Climb",
    scenario: "mountains",
    laps: 3,
    difficulty: "easy",
  },
  {
    id: "easy_7",
    name: "City Circuit",
    scenario: "futuristic",
    laps: 3,
    difficulty: "easy",
  },

  // Medium Sequence (10 tracks)
  {
    id: "med_1",
    name: "Windyroads",
    scenario: "wind",
    laps: 4,
    difficulty: "medium",
  },
  {
    id: "med_2",
    name: "Fog Maze",
    scenario: "fog",
    laps: 4,
    difficulty: "medium",
  },
  {
    id: "med_3",
    name: "Storm Circuit",
    scenario: "storm",
    laps: 5,
    difficulty: "medium",
  },
  {
    id: "med_4",
    name: "Rally Cross",
    scenario: "rally",
    laps: 4,
    difficulty: "medium",
  },
  {
    id: "med_5",
    name: "Snow Pass",
    scenario: "snow",
    laps: 4,
    difficulty: "medium",
  },
  {
    id: "med_6",
    name: "Roadwerx",
    scenario: "roadworks",
    laps: 5,
    difficulty: "medium",
  },
  {
    id: "med_7",
    name: "Metropolis",
    scenario: "motorway",
    laps: 5,
    difficulty: "medium",
  },
  {
    id: "med_8",
    name: "Forest Trail",
    scenario: "forest",
    laps: 4,
    difficulty: "medium",
  },
  {
    id: "med_9",
    name: "Marshland",
    scenario: "marsh",
    laps: 4,
    difficulty: "medium",
  },
  {
    id: "med_10",
    name: "Turbo Intro",
    scenario: "futuristic",
    laps: 5,
    difficulty: "medium",
  },

  // Hard Sequence (15 tracks)
  {
    id: "hard_1",
    name: "Turbo",
    scenario: "futuristic",
    laps: 7,
    difficulty: "hard",
  },
  {
    id: "hard_2",
    name: "Mountain Extreme",
    scenario: "mountains",
    laps: 6,
    difficulty: "hard",
  },
  {
    id: "hard_3",
    name: "Dirty Rally",
    scenario: "rally",
    laps: 6,
    difficulty: "hard",
  },
  {
    id: "hard_4",
    name: "Blizzard",
    scenario: "snow",
    laps: 6,
    difficulty: "hard",
  },
  {
    id: "hard_5",
    name: "Dense Fog",
    scenario: "fog",
    laps: 6,
    difficulty: "hard",
  },
  {
    id: "hard_6",
    name: "Hurricane",
    scenario: "storm",
    laps: 7,
    difficulty: "hard",
  },
  {
    id: "hard_7",
    name: "Roadworks Chaos",
    scenario: "roadworks",
    laps: 7,
    difficulty: "hard",
  },
  {
    id: "hard_8",
    name: "Gale Force",
    scenario: "wind",
    laps: 6,
    difficulty: "hard",
  },
  {
    id: "hard_9",
    name: "Deep Marsh",
    scenario: "marsh",
    laps: 6,
    difficulty: "hard",
  },
  {
    id: "hard_10",
    name: "Nightmare",
    scenario: "night",
    laps: 7,
    difficulty: "hard",
  },
  {
    id: "hard_11",
    name: "Desert Storm",
    scenario: "desert",
    laps: 6,
    difficulty: "hard",
  },
  {
    id: "hard_12",
    name: "Dark Forest",
    scenario: "forest",
    laps: 6,
    difficulty: "hard",
  },
  {
    id: "hard_13",
    name: "Autobahn",
    scenario: "motorway",
    laps: 7,
    difficulty: "hard",
  },
  {
    id: "hard_14",
    name: "Final Turbo",
    scenario: "futuristic",
    laps: 8,
    difficulty: "hard",
  },
  {
    id: "hard_15",
    name: "Ultimate Challenge",
    scenario: "night",
    laps: 10,
    difficulty: "hard",
  },
];
```

### 12.6 Sequence Selection UI

- Main Menu → Course Selection
- Options:
  - Single Race (choose track from library)
  - Championship (Easy/Medium/Hard sequence)
  - Arcade (Easy/Medium/Hard sequence)
  - RECS Custom (single track)
  - RECS Sequence (up to 9 custom tracks)

---

## 13. AI Improvements

### 13.1 Racing AI vs Traffic

Current: Traffic cars drive predictably, don't race.

Required: 19 AI opponents that:

- Compete for position
- Make overtaking maneuvers
- React to player position
- Have varying skill levels
- Make mistakes (overshoot corners)

### 13.2 AI State

```typescript
interface RacingAI {
  carId: number;
  skill: number; // 0.5-1.0
  aggressiveness: number; // 0.0-1.0
  currentLine: "racing" | "defensive" | "overtake";
  targetSpeed: number;
  mistakesRemaining: number;
}
```

### 13.3 AI Behavior

```typescript
const updateRacingAI = (
  ai: RacingAI,
  segment: Segment,
  playerPosition: number,
  aiPosition: number,
): void => {
  // Determine if attacking or defending
  if (aiPosition < playerPosition) {
    // AI ahead - defensive line
    ai.currentLine = "defensive";
    ai.targetSpeed = segment.optimalSpeed * ai.skill;
  } else {
    // AI behind - attempt overtake
    ai.currentLine = "overtake";
    ai.targetSpeed = segment.optimalSpeed * ai.skill * 1.1;
  }

  // Random mistakes
  if (Math.random() < 0.001 * (1 - ai.skill)) {
    ai.mistakesRemaining = 60; // frames
  }
};
```

---

## 14. Audio Enhancements

### 14.1 Missing Sounds

| Sound                  | Trigger                |
| ---------------------- | ---------------------- |
| Gear shift             | Manual gear change     |
| Engine rev             | High RPM               |
| Tire screech           | Hard cornering/braking |
| Collision              | Impact with object/car |
| Turbo engage           | Enter turbo zone       |
| Pit lane speed limiter | Enter pit lane         |
| Crowd cheer            | Cross finish line 1st  |
| Countdown beep         | 3-2-1 countdown        |
| Go signal              | Race start             |

### 14.2 Dynamic Engine Sound

```typescript
const updateEngineAudio = (rpm: number, throttle: boolean): void => {
  const pitch = 0.5 + (rpm / 8000) * 1.5;
  const volume = throttle ? 1.0 : 0.6;

  engineSound.setPitch(pitch);
  engineSound.setVolume(volume);
};
```

---

## 15. Save/Load System

### 15.1 Data to Persist

- Best times per track
- High scores per mode
- Championship progress (with passwords)
- Unlocked tracks
- Control configurations
- Sound settings

### 15.2 Storage Structure

```typescript
interface SaveData {
  version: number;
  bestTimes: Record<string, number>;
  highScores: {
    arcade: { easy: number; medium: number; hard: number };
    championship: { easy: number; medium: number; hard: number };
  };
  unlockedTracks: string[];
  settings: {
    soundEnabled: boolean;
    musicVolume: number;
    sfxVolume: number;
    controls: InputMapping[];
  };
}
```

### 15.3 LocalStorage Implementation

```typescript
const saveGame = (data: SaveData): void => {
  localStorage.setItem("lotus3_save", JSON.stringify(data));
};

const loadGame = (): SaveData | null => {
  const saved = localStorage.getItem("lotus3_save");
  return saved ? JSON.parse(saved) : null;
};
```

---

## 16. Menu Flow Updates

### 16.1 Updated Main Menu

```
┌─────────────────────────────────────────┐
│           LOTUS III                     │
│      The Ultimate Challenge             │
├─────────────────────────────────────────┤
│  [1 PLAYER]     [2 PLAYERS]             │
├─────────────────────────────────────────┤
│  CHAMPIONSHIP                           │
│  ARCADE                                 │
│  SINGLE RACE                            │
│  CONSTRUCTOR (RECS)                     │
│  OPTIONS                                │
│  ENTER PASSWORD                         │
└─────────────────────────────────────────┘
```

### 16.2 Complete Flow

```
Main Menu
├── 1 Player / 2 Players
├── Game Mode
│   ├── Championship → Difficulty → Car Select → Track 1
│   ├── Arcade → Difficulty → Car Select → Stage 1
│   ├── Single Race → Track Select → Car Select → Race
│   └── Constructor → RECS Screen
├── Options
│   ├── Controls
│   ├── Sound
│   └── Display
└── Enter Password → Validate → Resume Progress
```

---

## Implementation Priority

| Priority | Feature              | Complexity | Impact   |
| -------- | -------------------- | ---------- | -------- |
| 1        | Car Selection        | Low        | High     |
| 2        | Gear System          | Medium     | High     |
| 3        | RECS Code Generation | Medium     | High     |
| 4        | Championship Mode    | High       | Critical |
| 5        | Level Sequences      | Medium     | Critical |
| 6        | Scenario Themes      | Medium     | High     |
| 7        | Fuel/Pit Stops       | Medium     | Medium   |
| 8        | Turbo Zones          | Low        | Medium   |
| 9        | Jump Zones           | Medium     | Medium   |
| 10       | Additional Obstacles | Medium     | Medium   |
| 11       | HUD Enhancements     | Low        | High     |
| 12       | Collision Effects    | Medium     | Medium   |
| 13       | Racing AI            | High       | High     |
| 14       | Audio Enhancements   | Low        | Medium   |
| 15       | Save/Load            | Low        | Medium   |

---

## File Structure for Implementation

```
src/
├── game/
│   ├── modes/
│   │   ├── championship.ts    (new)
│   │   ├── arcade.ts          (new)
│   │   └── time-challenge.ts  (existing)
│   ├── car-selection.ts       (new)
│   ├── gear-system.ts         (new)
│   └── level-sequences.ts     (new)
├── engine/
│   ├── recs/
│   │   ├── code-generator.ts  (new)
│   │   └── track-builder.ts   (new)
│   ├── themes/
│   │   ├── rally.ts           (new)
│   │   ├── forest.ts          (new)
│   │   └── index.ts           (update)
│   ├── fuel-system.ts         (new)
│   ├── obstacles.ts           (new)
│   └── ai-racing.ts           (new)
├── ui/
│   ├── screens/
│   │   ├── car-select.ts      (new)
│   │   ├── password-entry.ts  (new)
│   │   ├── track-select.ts    (new)
│   │   └── championship.ts    (new)
│   └── hud/
│       └── enhanced-hud.ts    (update)
└── audio/
    └── game-sounds.ts         (new)
```
