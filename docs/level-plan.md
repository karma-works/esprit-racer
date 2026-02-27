# Level Implementation Plan

## Overview

This document outlines a minimal-effort approach to implementing the 13 distinct environments from Lotus III (as documented in `analysis/levels.md`) using the existing 2.5D canvas-based rendering engine with strategic use of SVG filters, CSS filters, and physics modifiers.

## Architecture Summary

The current engine uses:

- Canvas 2D rendering (`src/engine/renderer/canvas.ts`)
- SVG sprites loaded via `src/assets/svg-loader.ts`)
- Color theming via `COLORS` constant in `src/engine/constants.ts`)
- Single background SVG (`background-level-1.svg`)
- Physics via `GameConfig` in `src/engine/types.ts`)

## Core Strategy: Theme System

### 1. Level Theme Definition

Create a `LevelTheme` interface with visual AND physics modifiers:

```typescript
interface LevelTheme {
  id: string;
  name: string;
  colors: {
    sky: string;
    fog: string;
    road: SegmentColor;
  };
  effects: {
    fogDensity: number;
    fogStart: number;
    lightning?: LightningConfig;
    rain?: ParticleConfig;
    snow?: ParticleConfig;
    heatHaze?: boolean;
    wind?: WindConfig;
  };
  physics: {
    grip: number; // 0-1, multiplier for centrifugal force resistance
    offRoadGrip: number; // 0-1, multiplier for off-road handling
    maxSpeed: number; // 0-1, multiplier for max speed
    acceleration: number; // 0-1, multiplier for acceleration
    brakeForce: number; // 0-1, multiplier for braking
    windForce?: number; // Lateral force applied to player
    windDirection?: number; // -1 (left) to 1 (right)
    jumpZones?: boolean; // Enable jump mechanics
    turboZones?: boolean; // Enable speed boost segments
    slippery?: boolean; // Oil/ice physics
  };
  filters: {
    global: string;
    background: string;
    road: string;
  };
  background: string;
  sprites: Partial<typeof SPRITE_SVG_MAP>;
}

interface WindConfig {
  baseForce: number;
  gustInterval: number;
  gustDuration: number;
  maxGustForce: number;
  direction: number;
}

interface ParticleConfig {
  density: number;
  speed: number;
  direction: number;
  sprite?: string;
}

interface LightningConfig {
  interval: number;
  duration: number;
  flashIntensity: number;
}
```

### 2. Engine Changes Required

| File            | Change                                                       |
| --------------- | ------------------------------------------------------------ |
| `constants.ts`  | Add `THEMES` registry                                        |
| `types.ts`      | Add `LevelTheme`, `WindConfig`, `ParticleConfig` interfaces  |
| `world.ts`      | Add `currentTheme`, `windState`, `jumpState` to `WorldState` |
| `canvas.ts`     | Apply theme colors, render particles/effects                 |
| `sprite.ts`     | Apply theme filter to background, render weather overlays    |
| `svg-loader.ts` | Support theme-specific sprite overrides                      |
| `main.ts`       | Theme switching, physics application, jump animation         |

---

## New SVG Sprites Created

| Sprite         | File               | Used In                |
| -------------- | ------------------ | ---------------------- |
| Tumbleweed     | `tumbleweed.svg`   | Windy, Desert          |
| Traffic Cone   | `traffic-cone.svg` | Roadworks              |
| Barrier        | `barrier.svg`      | Roadworks              |
| Snowflake      | `snowflake.svg`    | Snow                   |
| Raindrop       | `raindrop.svg`     | Storm                  |
| Lightning Bolt | `lightning.svg`    | Storm                  |
| Oil Slick      | `oil-slick.svg`    | Marsh, Lakes           |
| Water Splash   | `water-splash.svg` | Lakes                  |
| Turbo Zone     | `turbo-zone.svg`   | Future                 |
| Laser Beam     | `laser-beam.svg`   | Future                 |
| Car Jump Pose  | `car-jump.svg`     | Lakes (jump animation) |

---

## Implementation by Level

### 1. Night

**Visual:**

- **Colors:** `#0a0a1a` sky, `#001122` fog, `#1a1a2e` road, `#ffdd00` neon lane markers
- **Filter:** `brightness(0.7) saturate(0.9)`
- **Background:** Dark variant with neon Manhattan-style skyline overlay

**Physics:**

```typescript
physics: {
  grip: 1.0,           // Normal grip
  offRoadGrip: 0.8,    // Normal off-road
  maxSpeed: 1.0,       // Normal speed
  acceleration: 1.0,
  brakeForce: 1.0
}
```

**Gameplay:** No physics changes. Atmospheric challenge comes from reduced visibility and visual tension.

---

### 2. Fog

**Visual:**

- **Colors:** `#9e9e9e` sky, `#4a5d4a` muted green grass
- **Effects:** `fogDensity: 8`, `fogStart: 0.3` (fog starts much closer)
- **Filter:** `blur(0.3px) contrast(0.9)`

**Physics:**

```typescript
physics: {
  grip: 1.0,
  offRoadGrip: 0.9,
  maxSpeed: 0.95,      // Slightly slower due to caution
  acceleration: 1.0,
  brakeForce: 1.0
}
```

**Gameplay:** Visibility is the main challenge. Players must react quickly to obstacles appearing from fog. Draw distance dramatically reduced.

---

### 3. Snow

**Visual:**

- **Colors:** `#f5f5f5` grass (snow), `#e8e8e8` road, `#333333` lane markers
- **Effects:** `snow: { density: 50, speed: 2, direction: 0.1 }`
- **Filter:** `saturate(0.7) brightness(1.05)`
- **Particles:** White snowflakes (`snowflake.svg`) drifting down with slight wind

**Physics:**

```typescript
physics: {
  grip: 0.6,           // REDUCED - car slides more
  offRoadGrip: 0.3,    // SEVERELY reduced off-road (snowdrifts)
  maxSpeed: 0.85,      // Can't go full speed safely
  acceleration: 0.8,   // Slower acceleration on ice
  brakeForce: 0.5,     // Braking is much less effective
  slippery: true       // Enables ice physics simulation
}
```

**Gameplay Implementation:**

```typescript
// In world.ts update()
if (theme.physics.slippery) {
  // Car continues sliding in current direction briefly
  player.x += player.slideVelocity * dt;
  player.slideVelocity *= 0.95; // Decay slide
}

// Steering on ice has delayed response
if (input.left || input.right) {
  const slideDirection = input.left ? -1 : 1;
  player.slideVelocity += slideDirection * 0.02 * (1 - theme.physics.grip);
}
```

**Challenge:** Car skids on ice patches, braking is ineffective, must plan turns ahead.

---

### 4. Storm

**Visual:**

- **Colors:** `#2d1b4e` dark purple sky, `#4a4a5a` slate road
- **Effects:** `rain: { density: 100, speed: 8 }`, `lightning: { interval: 8000, duration: 150 }`
- **Filter:** `saturate(0.8) brightness(0.85)`
- **Particles:** Rain streaks (`raindrop.svg`) at angle, lightning bolt sprite (`lightning.svg`)

**Physics:**

```typescript
physics: {
  grip: 0.85,          // Wet roads = less grip
  offRoadGrip: 0.6,    // Mud/grass very slippery
  maxSpeed: 0.9,       // Rain reduces top speed
  acceleration: 0.95,
  brakeForce: 0.9,
  slippery: true       // Puddles cause hydroplaning
}
```

**Lightning Effect:**

```typescript
// Lightning flash temporarily blinds player
let lightningActive = false;
let lightningTimer = 0;

const updateLightning = (dt: number) => {
  lightningTimer += dt * 1000;
  if (lightningTimer > config.interval && Math.random() < 0.1) {
    lightningActive = true;
    setTimeout(() => (lightningActive = false), config.duration);
    lightningTimer = 0;
  }
};

// Render - during flash, entire screen goes bright white briefly
const renderLightningFlash = (ctx: CanvasRenderingContext2D) => {
  if (lightningActive) {
    ctx.fillStyle = `rgba(255,255,255,${config.flashIntensity})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw lightning bolt sprite
    renderSprite(ctx, "lightning.svg", randomX, 0);
  }
};
```

**Challenge:** Lightning flashes temporarily blind player, rain reduces visibility and grip, puddles cause hydroplaning.

---

### 5. Desert

**Visual:**

- **Colors:** `#D2691E` orange road (sand), `#F4A460` tan grass
- **Effects:** `heatHaze: true` (SVG turbulence filter)
- **Filter:** `saturate(1.2) sepia(0.15)`
- **Special:** Wavy distortion effect on road surface

**Physics:**

```typescript
physics: {
  grip: 0.95,          // Sand at edges is loose
  offRoadGrip: 0.4,    // Sand slows car significantly
  maxSpeed: 1.0,
  acceleration: 0.9,   // Sand resistance
  brakeForce: 1.0
}
```

**Heat Haze Effect:**

```typescript
// Apply SVG turbulence filter to road segments
const heatHazeFilter = `
  <filter id="heat-haze">
    <feTurbulence type="turbulence" baseFrequency="0.01" numOctaves="2" result="turbulence">
      <animate attributeName="baseFrequency" values="0.01;0.015;0.01" dur="2s" repeatCount="indefinite"/>
    </feTurbulence>
    <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="3" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
`;
```

**Challenge:** Sand at road edges slows car dramatically, heat haze distorts vision at distance.

---

### 6. Future

**Visual:**

- **Colors:** `#1a1a3e` road, `#0d0d2a` grass, `#00ffff` rumble strips, `#ff00ff` lane markers
- **Effects:** Neon glow on all edges
- **Filter:** `contrast(1.2) saturate(1.2) hue-rotate(10deg)`

**Physics:**

```typescript
physics: {
  grip: 1.0,
  offRoadGrip: 0.8,
  maxSpeed: 1.2,       // FUTURE = FASTER
  acceleration: 1.1,   // Better tech
  brakeForce: 1.0,
  turboZones: true     // Enable turbo zone segments
}
```

**Turbo Zones:**

```typescript
// Segments marked as turbo zones give speed boost
interface TurboZoneSegment extends Segment {
  turboMultiplier: number; // e.g., 1.5x speed
}

// In update()
if (segment.turboZone && player.speed < config.maxSpeed * 1.5) {
  player.speed *= 1.02; // Accelerate beyond normal max
  // Visual: blue trail behind car, speed lines
}

// Render turbo zone markers on road
const renderTurboZone = (ctx: CanvasRenderingContext2D, segment: Segment) => {
  // Draw chevron arrows pointing forward on road surface
  ctx.globalAlpha = 0.5;
  renderSprite(ctx, 'turbo-zone.svg', ...);
  ctx.globalAlpha = 1;
};
```

**Laser Obstacles:**

```typescript
// Laser beams cross the road at intervals
interface LaserObstacle {
  z: number;           // Position on track
  timing: number;      // Phase offset
  active: boolean;     // Is laser currently on?
}

// Collision with active laser = crash
if (laser.active && playerSegment.hasLaser) {
  player.speed = 0;
  // Crash animation
}

// Render laser beam sprite
const renderLaser = (ctx: CanvasRenderingContext2D, laser: LaserObstacle) => {
  if (laser.active) {
    renderSprite(ctx, 'laser-beam.svg', ...);
  }
};
```

**Challenge:** High-speed racing with turbo zones and timing-based laser obstacles.

---

### 7. Marsh

**Visual:**

- **Colors:** `#5D4037` brown water, `#2E7D32` deep green grass
- **Effects:** Oil slicks on road surface
- **Filter:** `saturate(0.8) brightness(0.9)`

**Physics:**

```typescript
physics: {
  grip: 0.7,           // Muddy conditions
  offRoadGrip: 0.3,    // Swamp = stuck
  maxSpeed: 0.85,      // Can't go fast in mud
  acceleration: 0.7,   // Bogged down
  brakeForce: 0.8,
  slippery: true       // Oil/water on track
}
```

**Oil Slicks:**

```typescript
// Random oil slick sprites placed on road
interface OilSlick {
  offset: number;      // Position across road (-1 to 1)
  z: number;           // Position along track
}

// When car drives over oil slick
const checkOilSlick = (playerX: number, segment: Segment) => {
  for (const slick of segment.oilSlicks) {
    if (Math.abs(playerX - slick.offset) < 0.2) {
      // Car loses all grip momentarily
      player.slideVelocity = player.x > slick.offset ? 0.05 : -0.05;
      return true;
    }
  }
  return false;
};

// Render oil slick with iridescent effect
const renderOilSlick = (ctx: CanvasRenderingContext2D, slick: OilSlick) => {
  renderSprite(ctx, 'oil-slick.svg', ...);
};
```

**Challenge:** Oil slicks cause sudden loss of control, muddy conditions reduce speed and grip.

---

### 8. Mountains

**Visual:**

- **Colors:** `#6B4423` earth tones, `#808080` stone grey road
- **Effects:** Increased fog density at higher elevations
- **Filter:** `saturate(0.9) brightness(0.95)`

**Physics:**

```typescript
physics: {
  grip: 1.0,
  offRoadGrip: 0.5,    // Cliff edges = dangerous
  maxSpeed: 0.9,       // Winding roads
  acceleration: 0.95,
  brakeForce: 1.1      // Better brakes for descents
}
```

**Track Generation:**

```typescript
// Mountain tracks have:
// - More curves
// - Elevation changes (hills)
// - Narrower road segments
// - Rock wall on one side, drop-off on other

const generateMountainSegment = () => ({
  curve: randomRange(ROAD.CURVE.MEDIUM, ROAD.CURVE.HARD),
  hill: randomRange(ROAD.HILL.LOW, ROAD.HILL.HIGH),
  width: ROAD_WIDTH * 0.85, // Narrower
});
```

**Challenge:** Narrow roads with sharp curves and elevation changes. One wrong move sends you off the cliff.

---

### 9. Lakes

**Visual:**

- **Colors:** `#2196F3` bright blue water, `#4CAF50` lush green grass
- **Effects:** Water splash particles when crossing rivers
- **Filter:** `saturate(1.2) brightness(1.05)`

**Physics:**

```typescript
physics: {
  grip: 0.9,           // Slightly wet
  offRoadGrip: 0.6,
  maxSpeed: 1.0,
  acceleration: 1.0,
  brakeForce: 0.9,
  jumpZones: true      // Enable jump mechanics
}
```

**Jump Zones (River Crossings):**

```typescript
interface JumpZone {
  z: number; // Start of jump ramp
  length: number; // How long the jump is
  height: number; // How high the jump
}

// Jump state
interface JumpState {
  active: boolean;
  startTime: number;
  duration: number;
  peakHeight: number;
}

// When entering jump zone
const startJump = (world: WorldState, jumpZone: JumpZone) => {
  world.jumpState = {
    active: true,
    startTime: performance.now(),
    duration: calculateJumpDuration(player.speed, jumpZone.length),
    peakHeight: calculateJumpHeight(player.speed),
  };
  // Switch to jump sprite
  playerSprite = getSpriteByName("car-jump.svg");
};

// During jump - arc motion
const updateJump = (world: WorldState, dt: number) => {
  if (!world.jumpState.active) return;

  const elapsed = (performance.now() - world.jumpState.startTime) / 1000;
  const progress = elapsed / world.jumpState.duration;

  if (progress >= 1) {
    // Landing
    world.jumpState.active = false;
    playerSprite = getSpriteByName("player-car.svg");
    // Water splash effect
    spawnWaterSplash(player.x, player.y);
  } else {
    // Parabolic arc: height = 4 * h * (p - p^2)
    const height =
      4 * world.jumpState.peakHeight * (progress - progress * progress);
    player.jumpHeight = height;
  }
};

// Render car at jump height
const renderPlayer = (ctx: CanvasRenderingContext2D, player: PlayerState) => {
  const y = player.screenY - (player.jumpHeight || 0) * 50; // Scale for visual
  renderSprite(ctx, playerSprite, player.screenX, y);
};
```

**Water Splash Effect:**

```typescript
// On landing, spawn water splash particles
const spawnWaterSplash = (x: number, y: number) => {
  for (let i = 0; i < 10; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 5,
      vy: -Math.random() * 8,
      sprite: "water-splash.svg",
      life: 0.5,
    });
  }
};
```

**Oil Slicks on Water:**

```typescript
// Oil slicks appear on water surfaces
// Same mechanics as Marsh level
```

**Challenge:** Time jumps correctly to cross rivers, avoid oil slicks on water surfaces.

---

### 10. Country

**Visual:**

- **Colors:** `#4CAF50` bright green grass, `#87CEEB` sky blue
- **Effects:** None - clear day
- **Filter:** `saturate(1.2) brightness(1.1)`

**Physics:**

```typescript
physics: {
  grip: 1.0,           // Perfect conditions
  offRoadGrip: 0.7,    // Grass is forgiving
  maxSpeed: 1.0,
  acceleration: 1.0,
  brakeForce: 1.0
}
```

**Obstacles:**

```typescript
// Country-specific obstacles
const countryObstacles = [
  "TREE1",
  "TREE2", // Trees
  "BUSH1",
  "BUSH2", // Bushes
  "BOULDER1", // Rocks
  "STUMP", // Tree stumps
];

// Ford/water crossing - slow down but no jump
const fordZone = {
  type: "ford",
  speedMultiplier: 0.6, // Slow through water
  splashEffect: true,
};
```

**Challenge:** Winding roads with natural obstacles. Relaxed but requires attention.

---

### 11. City

**Visual:**

- **Colors:** `#4a4a4a` asphalt road, `#1a1a1a` dark rumble strips
- **Effects:** Standard fog
- **Filter:** None (default)

**Physics:**

```typescript
physics: {
  grip: 1.0,           // Good road surface
  offRoadGrip: 0.3,    // Barriers/walls
  maxSpeed: 1.1,       // Wide motorway = faster
  acceleration: 1.0,
  brakeForce: 1.0
}
```

**Traffic:**

```typescript
// City has the MOST traffic
const cityTrafficConfig = {
  carCount: 40, // More cars than other levels
  oncomingTraffic: true, // Cars coming toward player
  laneChangeFrequency: 0.3,
};

// Oncoming cars in opposite lanes
const updateOncomingTraffic = (car: Car) => {
  if (car.lane < 0) {
    // Left side = oncoming
    car.speed = -car.speed; // Moving toward player
  }
};
```

**Challenge:** Wide road with heavy traffic including oncoming cars. Must dodge traffic at high speed.

---

### 12. Roadworks

**Visual:**

- **Colors:** `#FF6600` safety orange accents, `#000000` black, `#FFFFFF` white
- **Effects:** None
- **Filter:** None

**Physics:**

```typescript
physics: {
  grip: 1.0,
  offRoadGrip: 0.5,
  maxSpeed: 0.85,      // Can't go full speed through construction
  acceleration: 0.9,
  brakeForce: 1.2      // Need to stop quickly
}
```

**Obstacles:**

```typescript
// Roadworks-specific obstacles
const roadworksObstacles = [
  "traffic-cone.svg", // Single cone
  "barrier.svg", // Road barrier
  "BILLBOARD08", // Construction signs
];

// Cone/barrier collision - less severe than tree
const obstacleCollision = (obstacle: string) => {
  if (obstacle.includes("cone") || obstacle.includes("barrier")) {
    player.speed *= 0.7; // Slow down but not stop
    // Cone flies off
  } else {
    player.speed = maxSpeed / 5; // Full crash
  }
};

// Higher obstacle density
const roadworksObstacleDensity = 3; // 3x normal
```

**Challenge:** High density of obstacles requiring constant dodging. Cones and barriers narrow the road.

---

### 13. Windy

**Visual:**

- **Colors:** `#D2B48C` dusty brown grass, `#FFFACD` pale yellow sky
- **Effects:** Dust particles blowing across screen
- **Filter:** `sepia(0.1) saturate(0.9)`

**Physics:**

```typescript
physics: {
  grip: 0.95,          // Slightly loose surface
  offRoadGrip: 0.7,
  maxSpeed: 1.0,
  acceleration: 1.0,
  brakeForce: 1.0,
  windForce: 0.3,      // Base wind force
  windDirection: 0     // Will change dynamically
}
```

**Dynamic Wind System:**

```typescript
interface WindState {
  currentForce: number;
  currentDirection: number;
  gustTimer: number;
  gusting: boolean;
  gustDuration: number;
}

const updateWind = (world: WorldState, dt: number) => {
  const wind = world.windState;
  const config = world.currentTheme.effects.wind;

  wind.gustTimer += dt;

  // Random gusts
  if (!wind.gusting && wind.gustTimer > config.gustInterval) {
    if (Math.random() < 0.3) {
      wind.gusting = true;
      wind.gustDuration = config.gustDuration + Math.random() * 1000;
      wind.currentDirection = Math.random() > 0.5 ? 1 : -1;
      wind.currentForce = config.maxGustForce;
    }
    wind.gustTimer = 0;
  }

  // End gust
  if (wind.gusting && wind.gustTimer > wind.gustDuration) {
    wind.gusting = false;
    wind.currentForce = config.baseForce;
  }

  // Apply wind to player
  world.player.x += wind.currentForce * wind.currentDirection * dt;
};

// Player must counter-steer against wind
// In update()
const counterSteer = input.left ? -1 : input.right ? 1 : 0;
const windPush = wind.currentForce * wind.currentDirection;
const netLateralForce = windPush + counterSteer * 0.5;
player.x += netLateralForce * dt;
```

**Tumbleweed Obstacles:**

```typescript
// Tumbleweeds blow across road
interface Tumbleweed {
  x: number;
  z: number;
  rotation: number;
  speed: number;
  direction: number; // -1 (left to right) or 1 (right to left)
}

const updateTumbleweeds = (world: WorldState, dt: number) => {
  for (const weed of world.tumbleweeds) {
    // Move with wind
    weed.x += weed.speed * weed.direction * dt;
    weed.z += world.player.speed * dt; // Move relative to player
    weed.rotation += weed.speed * 5 * dt; // Tumbling animation

    // Remove if off screen
    if (Math.abs(weed.x) > 2) {
      world.tumbleweeds.splice(world.tumbleweeds.indexOf(weed), 1);
    }
  }

  // Spawn new tumbleweeds
  if (Math.random() < 0.02) {
    world.tumbleweeds.push({
      x: Math.random() > 0.5 ? -1.5 : 1.5,
      z: world.player.position + DRAW_DISTANCE,
      rotation: 0,
      speed: 0.5 + Math.random() * 0.5,
      direction: world.windState.currentDirection,
    });
  }
};

// Render with rotation
const renderTumbleweed = (ctx: CanvasRenderingContext2D, weed: Tumbleweed) => {
  ctx.save();
  ctx.translate(weed.screenX, weed.screenY);
  ctx.rotate(weed.rotation);
  renderSprite(ctx, "tumbleweed.svg", 0, 0);
  ctx.restore();
};

// Collision with tumbleweed - slight push
const checkTumbleweedCollision = (player: PlayerState, weed: Tumbleweed) => {
  if (Math.abs(player.x - weed.x) < 0.15) {
    player.x += weed.direction * 0.1; // Pushed by tumbleweed
    player.speed *= 0.98; // Slight slowdown
  }
};
```

**Challenge:** Constant wind pushes car sideways, player must counter-steer. Gusts are unpredictable. Tumbleweeds cross the road and can push the car.

---

## Technical Implementation

### Physics Modifier Application

```typescript
// In world.ts
export const applyThemePhysics = (
  config: GameConfig,
  theme: LevelTheme,
): GameConfig => {
  return {
    ...config,
    maxSpeed: config.maxSpeed * theme.physics.maxSpeed,
    accel: config.accel * theme.physics.acceleration,
    braking: config.braking * theme.physics.brakeForce,
    offRoadDecel: config.offRoadDecel * theme.physics.offRoadGrip,
    centrifugal: config.centrifugal * theme.physics.grip,
  };
};
```

### SVG Filter Definitions

```html
<svg style="position:absolute;width:0;height:0">
  <defs>
    <filter id="heat-haze">
      <feTurbulence type="turbulence" baseFrequency="0.01" numOctaves="2">
        <animate
          attributeName="baseFrequency"
          values="0.01;0.015;0.01"
          dur="2s"
          repeatCount="indefinite"
        />
      </feTurbulence>
      <feDisplacementMap in="SourceGraphic" scale="3" />
    </filter>

    <filter id="neon-glow">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <filter id="fog-blur">
      <feGaussianBlur stdDeviation="1.5" />
    </filter>
  </defs>
</svg>
```

### Particle System

```typescript
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  sprite?: string;
  size: number;
}

class ParticleSystem {
  private particles: Particle[] = [];

  emit(config: ParticleConfig, count: number) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * canvas.width,
        y: -10,
        vx: config.direction * 50,
        vy: config.speed * 100,
        life: 1,
        sprite: config.sprite,
        size: 2 + Math.random() * 4,
      });
    }
  }

  update(dt: number, windX: number = 0) {
    for (const p of this.particles) {
      p.x += (p.vx + windX) * dt;
      p.y += p.vy * dt;
      p.life -= dt * 0.5;
    }
    this.particles = this.particles.filter(
      (p) => p.life > 0 && p.y < canvas.height,
    );
  }

  render(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      if (p.sprite) {
        renderSprite(ctx, p.sprite, p.x, p.y, p.size);
      } else {
        ctx.fillStyle = `rgba(255,255,255,${p.life})`;
        ctx.fillRect(p.x, p.y, p.size, p.size * 4); // Elongated for rain
      }
    }
  }
}
```

---

## File Structure

```
src/
├── engine/
│   ├── themes/
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── night.ts
│   │   ├── fog.ts
│   │   ├── snow.ts
│   │   ├── storm.ts
│   │   ├── desert.ts
│   │   ├── future.ts
│   │   ├── marsh.ts
│   │   ├── mountains.ts
│   │   ├── lakes.ts
│   │   ├── country.ts
│   │   ├── city.ts
│   │   ├── roadworks.ts
│   │   └── windy.ts
│   ├── effects/
│   │   ├── particles.ts
│   │   ├── lightning.ts
│   │   ├── wind.ts
│   │   └── jump.ts
│   ├── physics/
│   │   ├── grip.ts
│   │   ├── wind.ts
│   │   └── jump.ts
│   └── constants.ts
├── assets/
│   └── sprites/
│       ├── tumbleweed.svg       ✅ Created
│       ├── traffic-cone.svg     ✅ Created
│       ├── barrier.svg          ✅ Created
│       ├── snowflake.svg        ✅ Created
│       ├── raindrop.svg         ✅ Created
│       ├── lightning.svg        ✅ Created
│       ├── oil-slick.svg        ✅ Created
│       ├── water-splash.svg     ✅ Created
│       ├── turbo-zone.svg       ✅ Created
│       ├── laser-beam.svg       ✅ Created
│       └── car-jump.svg         ✅ Created
```

---

## Physics Summary Table

| Level     | Grip | Off-Road | Max Speed | Accel | Brake | Special             |
| --------- | ---- | -------- | --------- | ----- | ----- | ------------------- |
| Night     | 1.0  | 0.8      | 1.0       | 1.0   | 1.0   | -                   |
| Fog       | 1.0  | 0.9      | 0.95      | 1.0   | 1.0   | Low visibility      |
| Snow      | 0.6  | 0.3      | 0.85      | 0.8   | 0.5   | Ice physics         |
| Storm     | 0.85 | 0.6      | 0.9       | 0.95  | 0.9   | Lightning, rain     |
| Desert    | 0.95 | 0.4      | 1.0       | 0.9   | 1.0   | Heat haze           |
| Future    | 1.0  | 0.8      | 1.2       | 1.1   | 1.0   | Turbo zones, lasers |
| Marsh     | 0.7  | 0.3      | 0.85      | 0.7   | 0.8   | Oil slicks          |
| Mountains | 1.0  | 0.5      | 0.9       | 0.95  | 1.1   | Narrow roads        |
| Lakes     | 0.9  | 0.6      | 1.0       | 1.0   | 0.9   | Jump zones          |
| Country   | 1.0  | 0.7      | 1.0       | 1.0   | 1.0   | -                   |
| City      | 1.0  | 0.3      | 1.1       | 1.0   | 1.0   | Heavy traffic       |
| Roadworks | 1.0  | 0.5      | 0.85      | 0.9   | 1.2   | High obstacles      |
| Windy     | 0.95 | 0.7      | 1.0       | 1.0   | 1.0   | Dynamic wind        |

---

## Effort Estimation

| Theme     | Visual | Physics | Total |
| --------- | ------ | ------- | ----- |
| Night     | 1h     | 0h      | 1h    |
| Fog       | 1h     | 0.5h    | 1.5h  |
| Snow      | 2h     | 2h      | 4h    |
| Storm     | 3h     | 1h      | 4h    |
| Desert    | 2h     | 0.5h    | 2.5h  |
| Future    | 3h     | 3h      | 6h    |
| Marsh     | 1h     | 1h      | 2h    |
| Mountains | 1h     | 0.5h    | 1.5h  |
| Lakes     | 2h     | 3h      | 5h    |
| Country   | 0.5h   | 0h      | 0.5h  |
| City      | 1h     | 1h      | 2h    |
| Roadworks | 1h     | 0.5h    | 1.5h  |
| Windy     | 2h     | 2h      | 4h    |

**Total: ~35 hours**

---

## Implementation Order

1. **Phase 1:** Theme system infrastructure + physics modifiers
2. **Phase 2:** Tier 1 (Night, Country, Mountains, City)
3. **Phase 3:** Tier 2 (Fog, Desert, Marsh, Roadworks)
4. **Phase 4:** Particle system (Snow, Storm)
5. **Phase 5:** Wind system (Windy)
6. **Phase 6:** Jump system (Lakes)
7. **Phase 7:** Advanced (Future - turbo zones + lasers)

---

## RECS Menu Implementation

The RECS (Racing Environment Construction Set) menu allows players to customize their track experience.

### Access

- From the **Main Menu**, select **"CONSTRUCTOR"** button
- This opens the RECS screen with track-builder.svg background

### Navigation Controls

- **TAB**: Switch between modes (top buttons → sliders → scenario)
- **UP/DOWN**: Navigate rows
- **LEFT/RIGHT**: Navigate columns
- **A/D** or **+/-**: Adjust slider values
- **ENTER**: Select/confirm

### UI Elements

**Top Row:**

- **TYPE**: Track type (currently fixed to circuit)
- **EXIT**: Return to main menu
- **START**: Begin race with current settings

**Slider Grid (3x3):**
| Row | Col 0 | Col 1 | Col 2 |
|-----|-------|-------|-------|
| 0 | CURVES | HILLS | SCENERY |
| 1 | SHARPNESS | STEEPNESS | SCATTER |
| 2 | LENGTH | DIFFICULTY | OBSTACLES |

**Scenario Selection:**

- 13 theme icons at bottom
- Use LEFT/RIGHT to navigate, ENTER to select
- Selected theme is highlighted with green border
- Current selection is highlighted with red border

### Theme Icons

Each scenario has a dedicated SVG icon (46x75 pixels):

| Icon File             | Theme     | Visual                                      |
| --------------------- | --------- | ------------------------------------------- |
| `theme-night.svg`     | Night     | Crescent moon with stars on dark background |
| `theme-fog.svg`       | Fog       | Layered clouds with fog lines               |
| `theme-snow.svg`      | Snow      | Snowflake with six arms                     |
| `theme-storm.svg`     | Storm     | Lightning bolt with dark clouds             |
| `theme-desert.svg`    | Desert    | Sun with radiating rays and sand dunes      |
| `theme-future.svg`    | Future    | Planet with orbital ring (neon colors)      |
| `theme-marsh.svg`     | Marsh     | Swamp with reeds and murky water            |
| `theme-mountains.svg` | Mountains | Mountain peaks with snow caps               |
| `theme-lakes.svg`     | Lakes     | Blue water with splash and tree             |
| `theme-country.svg`   | Country   | Green tree with clouds                      |
| `theme-city.svg`      | City      | Urban skyline with lit windows              |
| `theme-roadworks.svg` | Roadworks | Warning triangle with traffic cones         |
| `theme-windy.svg`     | Windy     | Windsock with wind lines                    |

### Implementation Files

- `src/ui/screens/screens.ts`: RECSScreen class
- `src/game/modes/time-challenge.ts`: "recs" screen added to GameScreen type
- `src/main.ts`: Navigation handlers for RECS screen
- `public/sprites/track-builder.svg`: Background image
