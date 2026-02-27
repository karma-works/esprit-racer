# Level Implementation Plan

## Overview

This document outlines a minimal-effort approach to implementing the 13 distinct environments from Lotus III using the existing 2.5D canvas-based rendering engine with strategic use of SVG filters, CSS filters, and optional WebGL post-processing.

## Architecture Summary

The current engine uses:

- Canvas 2D rendering (`src/engine/renderer/canvas.ts`)
- SVG sprites loaded via `src/assets/svg-loader.ts`
- Color theming via `COLORS` constant in `src/engine/constants.ts`
- Single background SVG (`background-level-1.svg`)

## Core Strategy: Theme System

### 1. Level Theme Definition

Create a `LevelTheme` interface and theme registry:

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
    lightning?: boolean;
    rain?: boolean;
    snow?: boolean;
    heatHaze?: boolean;
    windForce?: number;
  };
  filters: {
    global: string;
    background: string;
    road: string;
  };
  background: string;
  sprites: Partial<typeof SPRITE_SVG_MAP>;
}
```

### 2. Engine Changes Required

**Minimal changes to existing files:**

| File            | Change                                  |
| --------------- | --------------------------------------- |
| `constants.ts`  | Add `THEMES` registry                   |
| `types.ts`      | Add `LevelTheme` interface              |
| `world.ts`      | Add `currentTheme` to `WorldState`      |
| `canvas.ts`     | Apply theme colors to segment rendering |
| `sprite.ts`     | Apply theme filter to background        |
| `svg-loader.ts` | Support theme-specific sprite overrides |
| `main.ts`       | Theme switching logic                   |

---

## Implementation by Level

### Tier 1: Color-Only Themes (Minimal Effort)

These require only color palette changes - no new assets or effects.

#### 1. Night

- **Colors:** `#000000` sky, `#001a33` road, `#FFFF00` neon accents
- **Effects:** Higher `fogDensity` (4), reduced draw distance
- **Filter:** `brightness(0.6) contrast(1.2) saturate(0.8)`
- **Background:** Dark variant of existing background with neon skyline overlay

```typescript
{
  colors: {
    sky: "#0a0a1a",
    fog: "#001122",
    road: { road: "#1a1a2e", grass: "#0d1117", rumble: "#2d2d44", lane: "#ffdd00" }
  },
  filters: { global: "brightness(0.7) saturate(0.9)" }
}
```

#### 2. City

- **Colors:** `#4a4a4a` asphalt, `#ff0000/#ffff00` traffic lights
- **Effects:** Standard fog
- **Sprites:** Add traffic light sprites to billboards
- **Filter:** None (default)

#### 3. Country

- **Colors:** `#4CAF50` grass, `#87CEEB` sky
- **Effects:** None
- **Filter:** `saturate(1.2) brightness(1.1)`

#### 4. Mountains

- **Colors:** `#6B4423` earth tones, `#808080` stone
- **Effects:** Slightly increased `fogDensity`
- **Filter:** `saturate(0.9) brightness(0.95)`

---

### Tier 2: Filter + Fog Effects

These use SVG filters or CSS filters for atmospheric effects.

#### 5. Fog

- **Colors:** `#9e9e9e` sky, `#4a5d4a` muted green
- **Effects:** `fogDensity: 8`, `fogStart: 0.3`
- **Filter:** `blur(0.5px) brightness(0.9) contrast(0.85)`

```typescript
{
  effects: { fogDensity: 8, fogStart: 0.3 },
  filters: { global: "blur(0.3px) contrast(0.9)" }
}
```

#### 6. Storm

- **Colors:** `#2d1b4e` dark purple, `#4a4a5a` slate
- **Effects:** `fogDensity: 6`, `lightning: true`
- **Filter:** `brightness(0.8) contrast(1.1)`
- **Special:** Lightning flash via periodic `brightness(3)` overlay

```typescript
{
  effects: {
    fogDensity: 6,
    lightning: { interval: 8000, duration: 100 }
  },
  filters: { global: "saturate(0.8) brightness(0.85)" }
}
```

#### 7. Desert

- **Colors:** `#D2691E` orange, `#F4A460` tan
- **Effects:** `heatHaze: true`, off-road sand slowdown
- **Filter:** `saturate(1.3) brightness(1.1) sepia(0.2)`
- **Special:** Wavy distortion via SVG turbulence filter

```typescript
{
  filters: {
    global: "saturate(1.2) sepia(0.15)",
    road: "url(#heat-haze-filter)"
  }
}
```

---

### Tier 3: Particle/Weather Effects

Require minimal particle system or sprite overlays.

#### 8. Snow

- **Colors:** `#FFFFFF` white, `#E0F7FA` pale blue
- **Effects:** `snow: true`, reduced grip (`offRoadDecel` modifier)
- **Filter:** `brightness(1.1) saturate(0.7)`
- **Particles:** Simple white dot overlay moving downward

```typescript
{
  colors: {
    road: { road: "#e8e8e8", grass: "#f5f5f5", rumble: "#cccccc", lane: "#333333" }
  },
  effects: { snow: { density: 50, speed: 2 } },
  filters: { global: "saturate(0.7) brightness(1.05)" }
}
```

#### 9. Lakes

- **Colors:** `#2196F3` bright blue, `#4CAF50` lush green
- **Effects:** Water splash sprites, oil slicks
- **Filter:** `saturate(1.2) brightness(1.05)`

#### 10. Marsh

- **Colors:** `#5D4037` brown, `#2E7D32` deep green
- **Effects:** Oil/water on track, reduced grip
- **Filter:** `saturate(0.8) brightness(0.9)`

#### 11. Windy

- **Colors:** `#D2B48C` dusty brown, `#FFFACD` pale yellow
- **Effects:** `windForce: 0.5`, tumbleweed sprites
- **Filter:** `sepia(0.1) saturate(0.9)`

---

### Tier 4: Advanced Themes

Require additional sprites or gameplay modifiers.

#### 12. Future

- **Colors:** `#00BFFF` electric blue, `#FF00FF` magenta
- **Effects:** Turbo zones (speed boost segments), laser obstacles
- **Filter:** `hue-rotate(20deg) saturate(1.3) contrast(1.1)`
- **Special:** Glow effect via CSS `drop-shadow` or SVG filter

```typescript
{
  colors: {
    road: { road: "#1a1a3e", grass: "#0d0d2a", rumble: "#00ffff", lane: "#ff00ff" }
  },
  effects: { turboZones: true, lasers: true },
  filters: { global: "contrast(1.2) saturate(1.2)" }
}
```

#### 13. Roadworks

- **Colors:** `#FF6600` safety orange, `#000000` black, `#FFFFFF` white
- **Effects:** High obstacle density, bollards
- **Filter:** None
- **Sprites:** Add cone/barrier sprites

---

## Technical Implementation

### SVG Filter Approach

Define reusable SVG filters in a single `<svg>` element:

```html
<svg style="position:absolute;width:0;height:0">
  <defs>
    <!-- Heat haze for desert -->
    <filter id="heat-haze">
      <feTurbulence type="turbulence" baseFrequency="0.01" numOctaves="2" />
      <feDisplacementMap in="SourceGraphic" scale="5" />
    </filter>

    <!-- Glow for Future theme -->
    <filter id="neon-glow">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <!-- Fog overlay -->
    <filter id="fog-blur">
      <feGaussianBlur stdDeviation="2" />
    </filter>
  </defs>
</svg>
```

### CSS Filter Application

Apply filters dynamically via canvas wrapper:

```typescript
const applyThemeFilter = (canvas: HTMLCanvasElement, theme: LevelTheme) => {
  canvas.style.filter = theme.filters.global;
};
```

### Particle System (Minimal)

For snow/rain effects, overlay a secondary canvas:

```typescript
interface ParticleEffect {
  type: "snow" | "rain" | "dust";
  density: number;
  speed: number;
  direction: number;
}

const renderParticles = (
  ctx: CanvasRenderingContext2D,
  effect: ParticleEffect,
  deltaTime: number,
) => {
  const particles = generateParticles(effect.density);
  particles.forEach((p) => {
    ctx.fillStyle = effect.type === "snow" ? "#fff" : "rgba(200,200,255,0.5)";
    ctx.fillRect(p.x, p.y, 2, effect.type === "rain" ? 8 : 2);
  });
};
```

### Lightning Effect

```typescript
const renderLightning = (ctx: CanvasRenderingContext2D, active: boolean) => {
  if (active) {
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }
};
```

---

## File Structure

```
src/
├── engine/
│   ├── themes/
│   │   ├── index.ts          # Theme registry
│   │   ├── types.ts          # LevelTheme interface
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
│   │   ├── particles.ts      # Snow/rain particles
│   │   ├── lightning.ts      # Lightning flash
│   │   └── heat-haze.ts      # Desert distortion
│   └── constants.ts          # Add THEMES export
├── assets/
│   └── backgrounds/
│       ├── bg-night.svg
│       ├── bg-storm.svg
│       └── ...
```

---

## Effort Estimation

| Theme     | Effort | Approach                  |
| --------- | ------ | ------------------------- |
| Night     | 1h     | Color swap + filter       |
| City      | 1h     | Color swap                |
| Country   | 1h     | Color swap + filter       |
| Mountains | 1h     | Color swap                |
| Fog       | 2h     | Filter + fog density      |
| Storm     | 3h     | Filter + lightning system |
| Desert    | 3h     | Filter + heat haze        |
| Snow      | 4h     | Filter + particle system  |
| Lakes     | 3h     | Color + water sprites     |
| Marsh     | 2h     | Color + grip modifier     |
| Windy     | 3h     | Filter + wind physics     |
| Future    | 5h     | Filter + turbo zones      |
| Roadworks | 2h     | Color + obstacle sprites  |

**Total: ~31 hours**

---

## Recommended Implementation Order

1. **Phase 1:** Theme system infrastructure (types, registry, color application)
2. **Phase 2:** Tier 1 themes (Night, City, Country, Mountains)
3. **Phase 3:** Tier 2 themes (Fog, Storm, Desert)
4. **Phase 4:** Particle system + Tier 3 themes (Snow, Lakes, Marsh, Windy)
5. **Phase 5:** Tier 4 themes (Future, Roadworks)

---

## Sprite Strategy

### Minimal New Sprites Needed

| Theme     | New Sprites                    |
| --------- | ------------------------------ |
| Night     | Neon skyline overlay           |
| Snow      | Snowflake particles            |
| Storm     | Rain particles, lightning bolt |
| Desert    | Tumbleweed                     |
| Lakes     | Water splash, oil slick        |
| Windy     | Tumbleweed                     |
| Future    | Laser beam, turbo zone marker  |
| Roadworks | Traffic cone, barrier          |

### Sprite Reuse

Most themes can reuse existing sprites with color filters applied:

- Trees → Palm trees (Desert, Lakes)
- Dead trees → Desert/Country
- Bushes → Country, Marsh
- Cactus → Desert only

---

## Background Strategy

### Option A: Filtered Variants (Recommended)

Single base background with theme-specific CSS filters:

- Night: `brightness(0.4) saturate(0.5)`
- Storm: `brightness(0.7) contrast(1.2)`
- Desert: `sepia(0.3) saturate(1.2)`
- Future: `hue-rotate(180deg) saturate(1.5)`

### Option B: Layered Backgrounds

Separate background SVGs for each theme (more effort, better quality)

---

## RECS Integration

The RECS (Racing Environment Construction Set) can be implemented as a theme mixer:

```typescript
interface RECSConfig {
  theme: LevelTheme;
  modifiers: {
    curviness: number; // 0-10
    hills: number; // 0-10
    obstacles: number; // 0-10
    weather: number; // 0-10 (affects fog/particles)
    timeOfDay: number; // 0-24 (affects lighting)
  };
}

const applyRECSModifiers = (
  baseTheme: LevelTheme,
  config: RECSConfig,
): LevelTheme => {
  return {
    ...baseTheme,
    effects: {
      ...baseTheme.effects,
      fogDensity: baseTheme.effects.fogDensity * (config.modifiers.weather / 5),
    },
    filters: {
      ...baseTheme.filters,
      global: adjustBrightness(
        baseTheme.filters.global,
        config.modifiers.timeOfDay,
      ),
    },
  };
};
```

---

## Summary

The key insight is that **most visual variety comes from color palette + filters**, not new assets. By implementing a robust theme system first, we can create 13 distinct environments with:

- 1 core theme system
- ~8 new particle/effect sprites
- CSS/SVG filters for atmospheric effects
- Minimal engine modifications

This approach leverages the existing 2.5D canvas architecture without requiring WebGL migration or extensive asset creation.
