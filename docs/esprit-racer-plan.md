# Esprit Racer - Project Plan

> Open source reimplementation of Lotus Challenge 3 as a modern web-based racing game.

## Project Overview

| Aspect       | Decision                                       |
| ------------ | ---------------------------------------------- |
| **Name**     | Esprit Racer                                   |
| **Goal**     | Modern reimagining of Lotus Challenge 3        |
| **Platform** | Web (HTML5)                                    |
| **Engine**   | JavaScript Racer (migrated to TypeScript)      |
| **Fidelity** | Modern reimagining (same spirit, updated feel) |
| **Assets**   | All original, created from scratch             |
| **Location** | Repository root                                |

---

## Technical Stack

### Core Technologies

- **Language**: TypeScript (strict mode)
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **Testing**: Vitest (unit tests, 80%+ coverage required)

### Graphics

- **Format**: SVG templates loaded at runtime
- **Rendering**: Modified sprite renderer with Off-screen Canvas Caching
- **Approach**: Draw SVG once to hidden canvas, then blit to main game canvas
- **Base Assets**: Use existing `sprites/` folder as foundation

### Audio

- **Music**: Protracker.js for MOD file playback
- **Source**: `sound/racing_kirby.mod`

---

## Existing Assets

### Sprites (`sprites/`)

| File                     | Description                   | Usage                                                   |
| ------------------------ | ----------------------------- | ------------------------------------------------------- |
| `main-menu.svg`          | Full main menu UI             | Player selection, game mode, controls, RECS placeholder |
| `retro-racing-car.svg`   | Rear-view sports car (purple) | Player car sprite                                       |
| `level-1-background.svg` | Road, mountains, sky, rocks   | Track background                                        |

### Sound (`sound/`)

| File               | Description            |
| ------------------ | ---------------------- |
| `racing_kirby.mod` | Background music track |

---

## Project Structure

```
/
├── src/
│   ├── engine/              # Core game engine (migrated JS Racer)
│   │   ├── segments.ts
│   │   ├── camera.ts
│   │   ├── world.ts
│   │   ├── renderer/
│   │   │   ├── canvas.ts
│   │   │   ├── sprite.ts      # SVG-aware sprite renderer
│   │   │   ├── background.ts
│   │   │   └── road.ts
│   │   ├── physics/
│   │   │   └── car.ts
│   │   └── utils/
│   │       └── math.ts
│   ├── game/                # Game-specific logic
│   │   ├── tracks/
│   │   │   └── track-1.ts
│   │   ├── cars/
│   │   │   └── player-car.ts
│   │   └── modes/
│   │       └── time-challenge.ts
│   ├── ui/                  # UI components
│   │   ├── screens/
│   │   │   ├── main-menu.ts
│   │   │   ├── music-select.ts
│   │   │   ├── car-select.ts
│   │   │   └── results.ts
│   │   ├── hud/
│   │   │   ├── speedometer.ts
│   │   │   ├── timer.ts
│   │   │   ├── lap-counter.ts
│   │   │   └── position.ts
│   │   └── controls/
│   │       └── input-handler.ts
│   ├── assets/              # Asset loaders
│   │   ├── svg-loader.ts
│   │   └── mod-loader.ts
│   ├── audio/               # Audio system
│   │   └── mod-player.ts
│   ├── main.ts
│   └── vite-env.d.ts
├── sprites/                 # Existing SVG assets
│   ├── main-menu.svg
│   ├── retro-racing-car.svg
│   └── level-1-background.svg
├── sound/                   # Audio files
│   └── racing_kirby.mod
├── tests/
│   └── unit/
├── public/
├── index.html
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## Development Phases

### Phase 1: Foundation & Time Challenge

**Goal**: Clone engine, migrate to TypeScript strict, implement Time Challenge mode

---

#### 1.1 Engine Setup & Migration

**Tasks**:

- [x] **Clone JavaScript Racer**
  - Clone https://github.com/jakesgordon/javascript-racer
  - Integrate source files into `src/engine/`
  - Set up initial project structure

- [x] **Project Scaffold**
  - Initialize pnpm project (`pnpm init`)
  - Configure Vite with TypeScript
  - Create `tsconfig.json` with strict mode:
    ```json
    {
      "compilerOptions": {
        "strict": true,
        "noImplicitAny": true,
        "noImplicitReturns": true,
        "noFallthroughCasesInSwitch": true,
        "noUncheckedIndexedAccess": true
      }
    }
    ```
  - Set up Vitest for testing
  - Create folder structure

- [x] **Test Coverage (Target: 80%+)**
  - Write fixture tests for existing engine functions
  - Run coverage: `vitest run --coverage`
  - Add tests until 80% threshold reached
  - Core areas to test:
    - Segment generation
    - Camera projection
    - Road rendering calculations
    - Physics/position updates

- [x] **TypeScript Migration**
  - Convert JS modules to TS
  - Add type definitions throughout
  - Refactor to satisfy strict mode
  - Ensure all tests still pass
  - Target: 100% strict mode compliance, 0 `any` types

---

#### 1.2 Visual Refinement

**Priority**: First priority after engine migration

**Tasks**:

- [x] **SVG Rendering System**
  - Create `SpriteRenderer` interface
  - Implement SVG loader (`src/assets/svg-loader.ts`)
  - Build Off-screen Canvas caching system
  - Modify `render.sprite()` to accept SVG sources
  - Cache rendered SVGs at multiple scales for performance

- [x] **Integrate Existing Sprites**
  - Load `sprites/level-1-background.svg` as track background
  - Load `sprites/retro-racing-car.svg` as player car
  - Integrate `sprites/main-menu.svg` for menu system
  - Ensure proper scaling and positioning

- [ ] **Generate Additional SVGs** (as needed)
  - HUD elements (speedometer, timer, lap counter)
  - Scenery sprites (trees, signs, obstacles)
  - UI buttons and overlays
  - Road markings, checkpoints

---

#### 1.3 Audio Integration

**Tasks**:

- [x] **MOD Player Setup**
  - Install @pinkkis/pasuuna-player: `pnpm add @pinkkis/pasuuna-player`
  - Create `src/audio/mod-player.ts`
  - Load `sound/racing_kirby.mod`
  - Implement play/pause/stop controls
  - Add volume/mute functionality

---

#### 1.4 Time Challenge Mode

Based on original game's Arcade mode (see manual reference below):

**Game Flow**:

```
Main Menu → Music Select → (Car Select - skip for MVP) → Race → Results
```

**Tasks**:

- [x] **Main Menu Screen**
  - Display `sprites/main-menu.svg`
  - Player name input
  - Game mode selection (Time Challenge only for MVP)
  - Start button → transitions to music select

- [ ] **Music Selection Screen**
  - Simple track selector (single track for MVP)
  - Preview playback
  - Confirm → transitions to race

- [x] **Race HUD**
  - **Timer**: Countdown clock (time limit per stage)
  - **Speed**: Current km/h
  - **Gear**: Current gear (1-5)
  - **Laps**: Remaining laps (visual stripes)
  - **Score**: Points accumulated
  - **Position**: Relative to track progress

- [x] **Time Challenge Logic**
  - Implement time limit system
  - Checkpoint bonuses (time extension)
  - Lap counter
  - Score calculation based on:
    - Time remaining
    - Speed maintained
    - Checkpoints passed

- [x] **Results Screen**
  - Final score display
  - Best time
  - Retry / Return to menu options

- [x] **Game Over**
  - Trigger when time reaches 0
  - Display results
  - Return to main menu

---

#### 1.5 Polish & Testing

- [x] **Controls**
  - Keyboard input (Arrow keys + Space)
  - Configurable controls
  - Smooth acceleration/braking

- [x] **Performance**
  - 60 FPS target
  - Canvas optimization
  - Sprite caching verification

- [ ] **Cross-browser Testing**
  - Chrome, Firefox, Safari
  - Mobile responsiveness (basic)

- [x] **Final MVP Verification**
  - All tests passing
  - Coverage ≥ 80% (engine modules)
  - No TypeScript errors
  - Lint clean

**Deliverable**: Playable Time Challenge mode with one car, one track, existing sprites

---

### Phase 2: Racing Expansion

**Goal**: Multiple tracks, AI opponents, enhanced features

**Planned Features**:

- Multiple track designs (new backgrounds)
- AI opponent cars with basic racing AI
- Race mode (head-to-head vs time trial)
- Enhanced scenery variety
- Weather effects (rain, fog, snow)
- Improved physics model (drift, grip)
- Local leaderboard (localStorage)
- Additional music tracks

---

### Phase 3: Full Feature Parity

**Goal**: Match original game's complete feature set

**Planned Features**:

- **RECS Track Builder**
  - Track parameter controls (curves, hills, difficulty)
  - Code generation/sharing
  - 13 scenario types
- **3 Car Choices**
  - Different handling characteristics
  - Speed/acceleration tradeoffs
- **2-Player Mode**
  - Split-screen or online multiplayer
- **Championship Mode**
  - Season progression
  - Pit stops and fuel management
  - Qualifying positions
- **Full Soundtrack**
  - AI-generated music via OPL3 patches
  - Multiple track selections
- **Save/Load System**
- **Achievements**

---

## Time Challenge Mode Reference

From original Lotus III manual (Arcade Mode):

| Element          | Description                                            |
| ---------------- | ------------------------------------------------------ |
| **Objective**    | Complete each stage within allotted time               |
| **Display**      | Clock icon represents time limit                       |
| **Scoring**      | Race for points - highest score wins                   |
| **Pit Stops**    | NOT required in Arcade mode                            |
| **Progression**  | Finish within time → advance to next stage             |
| **HUD Elements** | Speed, Gear, Score, Position, Laps remaining (stripes) |
| **Game Over**    | Fail to finish within time limit                       |

---

## Technical Decisions Log

| Decision         | Choice               | Rationale                                     |
| ---------------- | -------------------- | --------------------------------------------- |
| Project location | Repo root            | Simplicity, existing assets already in place  |
| Build tool       | Vite                 | Fast HMR, modern, great DX                    |
| Test coverage    | 80%+                 | Ensure engine stability before migration      |
| SVG approach     | Templates at runtime | Easy to modify, scalable, small footprint     |
| MOD player       | Protracker.js        | Mature, proven, matches original format       |
| Git workflow     | Main only            | Solo/small team, rapid iteration              |
| Canvas caching   | Off-screen           | Performance: render SVG once, blit many times |
| Existing sprites | Use as base          | Already created, good starting point          |

---

## Commands Reference

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Run tests
pnpm test

# Run tests with coverage
pnpm test --coverage

# Build for production
pnpm build

# Type check
pnpm tsc --noEmit
```

---

## References

- [JavaScript Racer](https://github.com/jakesgordon/javascript-racer) - Base engine
- `analysis/Lotus_III_-_Manual_-_PC.md` - Original game manual (for reference only)
- `analysis/wikipedia.md` - Game history and features
- `docs/sound.md` - Audio implementation notes
- `docs/generate-sound.md` - AI music generation approach

---

_Plan created: 2026-02-24_
_Last updated: 2026-02-25_
_Status: Phase 1 MVP Complete - Ready for Testing_
