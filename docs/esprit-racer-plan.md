# Esprit Racer - Project Plan

> Open source of a Lotus Challenge 3 racer reimagined, as a retro-modern web-based racing game.

## Project Overview

| Aspect       | Decision                                       |
| ------------ | ---------------------------------------------- |
| **Name**     | Esprit Racer                                   |
| **Goal**     | Modern reimagining of Lotus Challenge 3        |
| **Platform** | Web (HTML5)                                    |
| **Engine**   | JavaScript Racer (migrated to TypeScript)      |
| **Fidelity** | Modern reimagining (same spirit, updated feel) |
| **Assets**   | All original, created from scratch             |

---

## Technical Stack

### Core Technologies

- **Language**: TypeScript (strict mode)
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **Testing**: Vitest (unit tests)

### Graphics

- **Format**: SVG templates loaded at runtime
- **Rendering**: Modified sprite renderer with Off-screen Canvas Caching
- **Approach**: Draw SVG once to hidden canvas, then blit to main game canvas

### Audio

- **Music**: Protracker.js for MOD file playback
- **Source**: MOD files from `sounds/` directory

---

## Project Structure

```
esprit-racer/
├── src/
│   ├── engine/          # Core game engine (migrated JS Racer)
│   │   ├── segments.ts
│   │   ├── camera.ts
│   │   ├── renderer/
│   │   │   ├── canvas.ts
│   │   │   ├── sprite.ts    # SVG-aware sprite renderer
│   │   │   └── background.ts
│   │   ├── physics/
│   │   │   └── car.ts
│   │   └── utils/
│   │       └── math.ts
│   ├── game/            # Game-specific logic
│   │   ├── tracks/
│   │   ├── cars/
│   │   └── modes/
│   │       └── time-trial.ts
│   ├── ui/              # UI components
│   │   ├── hud/
│   │   ├── menus/
│   │   └── controls/
│   ├── assets/          # Static assets
│   │   ├── svg/         # SVG templates
│   │   │   ├── cars/
│   │   │   ├── scenery/
│   │   │   └── ui/
│   │   └── mod/         # Music files
│   ├── audio/           # Audio system
│   │   └── mod-player.ts
│   ├── main.ts
│   └── vite-env.d.ts
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

### Phase 1: MVP (Time Trial)

**Goal**: Single car, one track, time trial mode

**Tasks**:

1. **Project Scaffold**
   - [ ] Initialize pnpm project
   - [ ] Configure Vite with TypeScript
   - [ ] Enable strict TypeScript mode (`strict: true`, `noImplicitAny`, etc.)
   - [ ] Set up Vitest
   - [ ] Create folder structure

2. **Engine Migration**
   - [ ] Clone JavaScript Racer source
   - [ ] Convert to TypeScript modules
   - [ ] Add type definitions throughout
   - [ ] Refactor to strict mode compliance
   - [ ] Add unit tests for core functions

3. **SVG Rendering System**
   - [ ] Create sprite renderer interface
   - [ ] Implement SVG loader
   - [ ] Build Off-screen Canvas caching system
   - [ ] Integrate with existing renderer

4. **Asset Creation**
   - [ ] Design car SVG (single car for MVP)
   - [ ] Create road/track SVG elements
   - [ ] Design basic scenery SVGs
   - [ ] Create HUD SVG elements (speedometer, timer)

5. **Audio Integration**
   - [ ] Integrate Protracker.js
   - [ ] Wire up MOD file from sounds/
   - [ ] Add basic volume/mute controls

6. **Game Mode**
   - [ ] Implement time trial logic
   - [ ] Add lap counter
   - [ ] Create start/finish sequence
   - [ ] Build results screen

7. **MVP Polish**
   - [ ] Basic menu system
   - [ ] Keyboard controls
   - [ ] Performance optimization
   - [ ] Cross-browser testing

**Deliverable**: Playable time trial mode with one car and one track

---

### Phase 2: Racing Expansion

**Goal**: Multiple tracks, single player races with opponents

**Planned Features**:

- Multiple track designs
- AI opponent cars
- Race mode (vs time trial)
- Enhanced scenery variety
- Weather effects
- Improved physics model
- Leaderboards (local storage)

---

### Phase 3: Full Feature Parity

**Goal**: Match original game's feature set

**Planned Features**:

- RECS (Racing Environment Construction Set) track builder
- 3 car choices with different handling characteristics
- 2-player split-screen or online multiplayer
- Championship mode
- Full soundtrack (generated via AI + OPL3 patches)
- Save/load system
- Achievements

---

## Technical Decisions Log

| Decision       | Choice               | Rationale                                     |
| -------------- | -------------------- | --------------------------------------------- |
| Build tool     | Vite                 | Fast HMR, modern, great DX                    |
| SVG approach   | Templates at runtime | Easy to modify, scalable, small footprint     |
| MOD player     | Protracker.js        | Mature, proven, matches original format       |
| Git workflow   | Main only            | Solo/small team, rapid iteration              |
| Canvas caching | Off-screen           | Performance: render SVG once, blit many times |

---

## References

- [JavaScript Racer](https://github.com/jakesgordon/javascript-racer) - Base engine
- Original game analysis in `analysis/` folder (for reference only, not for asset extraction)
- Sound files in `sounds/` directory for music

---

## Getting Started (After Plan Approval)

```bash
# Create project directory
mkdir esprit-racer && cd esprit-racer

# Initialize with pnpm
pnpm init

# Add dependencies
pnpm add -D typescript vite vitest @types/node

# Add audio
pnpm add protracker

# Start development
pnpm dev
```

---

_Plan created: 2026-02-24_
_Status: Draft - Pending Approval_
