# Split-Screen Two-Player Mode Implementation Plan

## Overview

Implement a vertical split-screen mode (left/right) for two players racing simultaneously in the same world. Players share the same track, can collide with each other, and compete in a race mode where the first to finish wins.

## Requirements Summary

| Requirement      | Decision                                        |
| ---------------- | ----------------------------------------------- |
| Layout           | Vertical (left/right split)                     |
| World            | Shared track and traffic                        |
| Camera           | Same as current single-player view              |
| Input            | P1: WASD, P2: Arrow keys (configurable in menu) |
| Activation       | Main menu option                                |
| Player Collision | Yes, players can collide                        |
| Game Mode        | Race mode (first to complete laps wins)         |
| Scope            | Full implementation                             |

## Architecture Changes

### 1. New Types and Interfaces

**File: `src/engine/types.ts`**

```typescript
export interface PlayerConfig {
  id: number;
  name: string;
  inputMapping: InputMapping;
  color: string;
}

export interface InputMapping {
  left: number[];
  right: number[];
  faster: number[];
  slower: number[];
}

export interface MultiPlayerState {
  players: PlayerState[];
  inputs: InputState[];
  configs: PlayerConfig[];
}
```

### 2. Input System Refactor

**File: `src/engine/input.ts` (new)**

Create a configurable input system:

```typescript
export const DEFAULT_P1_INPUT: InputMapping = {
  left: [KEY.A, KEY.LEFT],
  right: [KEY.D, KEY.RIGHT],
  faster: [KEY.W, KEY.UP],
  slower: [KEY.S, KEY.DOWN],
};

export const DEFAULT_P2_INPUT: InputMapping = {
  left: [KEY.J], // or numpad
  right: [KEY.L],
  faster: [KEY.I],
  slower: [KEY.K],
};

// Actually, user specified:
// P1: A/S/D/W -> left/slower/right/faster
// P2: Cursor keys -> left/down/right/up
```

**Corrected default mappings:**

```typescript
export const DEFAULT_P1_INPUT: InputMapping = {
  left: [KEY.A],
  right: [KEY.D],
  faster: [KEY.W],
  slower: [KEY.S],
};

export const DEFAULT_P2_INPUT: InputMapping = {
  left: [KEY.LEFT],
  right: [KEY.RIGHT],
  faster: [KEY.UP],
  slower: [KEY.DOWN],
};
```

### 3. World State Changes

**File: `src/engine/world.ts`**

Transform from single-player to multi-player:

```typescript
export interface MultiPlayerWorldState {
  config: GameConfig;
  baseConfig: GameConfig;
  players: PlayerState[]; // Array of player states
  inputs: InputState[]; // Array of input states
  playerConfigs: PlayerConfig[];
  cars: Car[];
  segments: Segment[];
  // ... shared state (track, theme, etc.)
}
```

Key functions to modify:

- `createWorld()` -> `createWorld(playerCount: number)`
- `update()` -> handle multiple players
- `handleKeyDown/Up()` -> route to correct player based on key

### 4. Player-Player Collision

**File: `src/engine/collision.ts` (new)**

```typescript
export const checkPlayerCollision = (
  p1: PlayerState,
  p2: PlayerState,
  collisionRadius: number,
): boolean => {
  const dx = p1.x - p2.x;
  const dz = p1.position - p2.position;
  const distance = Math.sqrt(dx * dx + dz * dz);
  return distance < collisionRadius;
};

export const resolvePlayerCollision = (
  p1: PlayerState,
  p2: PlayerState,
): void => {
  // Exchange velocities, push apart, etc.
};
```

### 5. Renderer Split-Screen Support

**File: `src/engine/renderer/canvas.ts`**

Add viewport rendering:

```typescript
export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const renderViewport = (
  ctx: CanvasRenderingContext2D,
  world: WorldState,
  playerIndex: number,
  viewport: Viewport,
): void => {
  ctx.save();
  ctx.beginPath();
  ctx.rect(viewport.x, viewport.y, viewport.width, viewport.height);
  ctx.clip();

  // Render world from this player's perspective
  renderRacingForPlayer(ctx, world, playerIndex, viewport);

  ctx.restore();
};
```

### 6. HUD Per-Player

**File: `src/ui/hud/hud.ts`**

Modify HUD to render within viewports:

```typescript
export const renderSplitScreenHud = (
  ctx: CanvasRenderingContext2D,
  state: GameState,
  viewports: Viewport[],
  playerHudStates: HudState[],
): void => {
  for (let i = 0; i < viewports.length; i++) {
    renderHud(ctx, state, viewports[i], playerHudStates[i], i);
  }
};
```

### 7. Game Mode: Race

**File: `src/game/modes/race.ts` (new)**

```typescript
export interface RaceState {
  screen: GameScreen;
  playerStates: PlayerRaceState[];
  winner: number | null;
  isPaused: boolean;
  countdown: number;
}

export interface PlayerRaceState {
  position: number;
  lap: number;
  lastLapTime: number | null;
  finished: boolean;
  finishTime: number | null;
}

export const checkRaceComplete = (
  state: RaceState,
  totalLaps: number,
): number | null => {
  // Return winning player index or null
};
```

### 8. Menu System Updates

**File: `src/ui/screens/screens.ts`**

Add player count selection and input configuration:

```typescript
// Add to main menu zones
{ action: "player-count", label: "1P / 2P" }

// New screen for input configuration
export class InputConfigScreen implements UIScreen {
  // Configure P1 and P2 inputs
}
```

## Implementation Phases

### Phase 1: Core Multi-Player Infrastructure

1. **Types** (`types.ts`)
   - Add `PlayerConfig`, `InputMapping`, `MultiPlayerState`
   - Extend `WorldState` for multiple players

2. **Input System** (`input.ts` - new)
   - Create `InputManager` class
   - Support configurable key mappings
   - Route key events to correct player

3. **World State** (`world.ts`)
   - Refactor to support array of players
   - Update `createWorld()` to accept player count
   - Modify `update()` for multiple players

### Phase 2: Rendering

4. **Viewport Renderer** (`renderer/canvas.ts`)
   - Add `Viewport` interface
   - Create `renderViewport()` function
   - Modify main render loop for split-screen

5. **HUD** (`hud.ts`)
   - Scale HUD for smaller viewports
   - Render per-player HUD in correct viewport

### Phase 3: Game Mechanics

6. **Player Collision** (`collision.ts` - new)
   - Detect player-player collisions
   - Resolve collisions (momentum transfer)

7. **Race Mode** (`modes/race.ts` - new)
   - Track lap counts per player
   - Determine winner
   - Handle race end state

### Phase 4: Menu & UI

8. **Menu Updates** (`screens.ts`)
   - Add player count selector
   - Add input configuration screen
   - Update navigation for new options

9. **Results Screen**
   - Show both players' results
   - Highlight winner

### Phase 5: Polish

10. **Audio**
    - Handle shared/routed audio
    - Victory/defeat sounds

11. **Visual Polish**
    - Split-screen divider styling
    - Player indicators/colors
    - Minimap showing both players

## File Changes Summary

| File                            | Action | Changes                     |
| ------------------------------- | ------ | --------------------------- |
| `src/engine/types.ts`           | Modify | Add multiplayer types       |
| `src/engine/input.ts`           | Create | New input management system |
| `src/engine/world.ts`           | Modify | Support multiple players    |
| `src/engine/collision.ts`       | Create | Player collision detection  |
| `src/engine/renderer/canvas.ts` | Modify | Viewport rendering          |
| `src/ui/hud/hud.ts`             | Modify | Per-player HUD              |
| `src/game/modes/race.ts`        | Create | Race mode logic             |
| `src/ui/screens/screens.ts`     | Modify | Menu options                |
| `src/main.ts`                   | Modify | Game loop for split-screen  |

## Technical Considerations

### Performance

- Two viewports = 2x rendering calls
- Consider reducing draw distance for split-screen
- Profile and optimize render loop

### Input Handling

```typescript
document.addEventListener("keydown", (ev) => {
  // Find which player this key belongs to
  const playerIndex = inputManager.getPlayerForKey(ev.keyCode);
  if (playerIndex >= 0) {
    handleKeyDown(worlds[playerIndex], ev.keyCode, playerIndex);
  }
});
```

### Viewport Layout

```
┌─────────────────┬─────────────────┐
│                 │                 │
│    PLAYER 1     │    PLAYER 2     │
│                 │                 │
│     (P1 HUD)    │     (P2 HUD)    │
│                 │                 │
└─────────────────┴─────────────────┘
         ↑ Divider line ↑
```

### Shared State

- Track segments (same for both)
- Traffic cars (same positions, different relative views)
- Theme/effects (shared)
- Particles (shared spawn, per-viewport render)

### Player State (Separate)

- Position on track
- Speed
- Input state
- Lap count
- Finish time

## Testing Strategy

1. **Unit Tests**
   - Input mapping functions
   - Collision detection
   - Race completion logic

2. **Integration Tests**
   - Full split-screen render
   - Multi-player update loop
   - Input routing

3. **Manual Testing**
   - Two players on single keyboard
   - Collision interactions
   - Race completion scenarios

## Estimated Effort

| Phase                   | Effort    |
| ----------------------- | --------- |
| Phase 1: Infrastructure | Medium    |
| Phase 2: Rendering      | High      |
| Phase 3: Mechanics      | Medium    |
| Phase 4: Menu/UI        | Medium    |
| Phase 5: Polish         | Low       |
| **Total**               | ~2-3 days |

## Open Questions

1. ~~Vertical or horizontal split?~~ → Vertical (left/right)
2. ~~Players can collide?~~ → Yes
3. ~~Scoring mode?~~ → Race mode
4. Should there be a minimap showing both player positions?
5. How to handle when one player finishes before the other?
6. Should there be catch-up mechanics for trailing player?
