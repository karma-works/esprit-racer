import { KEY, THEMES, THEME_ORDER, COLORS } from "./engine/constants";
import type { LevelTheme } from "./engine/types";
import {
  createWorld,
  update,
  handleKeyDown,
  handleKeyUp,
  resetCars,
  getMirrorCars,
  setTheme,
  updateWind,
  updateJump,
  updateParticles,
  updateTumbleweeds,
  updateLightning,
  updateSlidePhysics,
} from "./engine/world";
import * as Render from "./engine/renderer/canvas";
import * as SvgRender from "./engine/renderer/sprite";
import * as Util from "./engine/utils/math";
import * as Segments from "./engine/segments";
import {
  globalSpriteCache,
  preloadGameSprites,
  getSpriteByName,
  type CachedSprite,
} from "./assets/svg-loader";
import {
  setMusicVolume,
  stopGameMusic,
  loadAndPlayTrack,
  isSoundEnabled,
  toggleSound,
  startEngineSound,
  stopEngineSound,
  updateEngineSound,
  playCollisionSound,
} from "./audio/mod-player";
import {
  createTimeChallengeState,
  type TimeChallengeState,
  updateTimer,
  startRace,
  pauseGame,
  resumeGame,
  returnToMenu,
  completeLap,
  checkCheckpoint,
  toggleGameMode,
  DEFAULT_TIME_LIMIT,
  calculateTimeLimit,
} from "./game/modes/time-challenge";
import { initChampionshipAI } from "./game/modes/championship-ai";
import {
  initRaceOpponents,
  updateRaceOpponents,
  getRacePosition,
  getVisibleOpponents,
} from "./game/modes/race-opponents";
import {
  createMultiplayerRaceState,
  type MultiplayerRaceState,
  startRace as startMultiplayerRace,
  updateRaceCountdown,
  checkLapComplete,
  isCountdownActive,
  getCountdownDisplay,
} from "./game/modes/race";
import {
  InputManager,
  DEFAULT_P1_INPUT,
  DEFAULT_P2_INPUT,
} from "./engine/input";
import { resolveAllPlayerCollisions } from "./engine/collision";
import type { Viewport } from "./engine/types";
import {
  createScreens,
  type Button,
  type MenuZone,
  type UIScreen,
  MusicSelectionScreen,
  CarSelectionScreen,
  DifficultySelectionScreen,
  ChampionshipStandingsScreen,
  RECSScreen,
  MainMenuScreen,
  MUSIC_TRACKS,
} from "./ui/screens/screens";
import {
  createChampionshipState,
  updateChampionshipStandings,
} from "./game/modes/championship";
import type { ChampionshipState } from "./engine/types";
import {
  renderHud,
  renderSplitScreenHud,
  renderPauseOverlay,
  renderCountdown,
  createDefaultHudState,
  type HudStateType,
} from "./ui/hud/hud";

const canvas = document.getElementById("canvas") as HTMLCanvasElement | null;

if (!canvas) {
  throw new Error("Canvas element not found");
}

const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("Could not get 2d context");
}

const BASE_WIDTH = 1024;
const BASE_HEIGHT = 768;
const ASPECT_RATIO = BASE_WIDTH / BASE_HEIGHT;

let world = createWorld();
const step = 1 / world.config.fps;

let svgBackground: CachedSprite | null = null;
let svgPlayerCarStraight: CachedSprite | null = null;
let svgPlayerCarLeft: CachedSprite | null = null;
let svgPlayerCarRight: CachedSprite | null = null;
let last = Util.timestamp();
let gdt = 0;

let gameState = createTimeChallengeState(
  world.trackLength,
  world.config.segmentLength,
);
let screens = createScreens(world.config.width, world.config.height);
let hudState = createDefaultHudState();
let championshipState: ChampionshipState | null = null;

let playerCount: 1 | 2 = 1;
let inputManager = new InputManager(playerCount);
let multiRaceState = createMultiplayerRaceState(playerCount);

const cameraDepth = 1 / Math.tan(((100 / 2) * Math.PI) / 180);
const cameraHeight = 1000;
const playerZ = world.player.z;
let resolution = world.config.height / 480;

let countdown = 0;
let countdownTimer = 0;

let isFullscreen = false;
const TRAFFIC_CAR_COUNT = 20;
let selectedThemeId: string = "night";

const getSelectedTheme = (): LevelTheme => {
  return THEMES[selectedThemeId] ?? THEMES["night"]!;
};

const setCanvasSize = (width?: number, height?: number) => {
  const viewportWidth = width ?? window.innerWidth;
  const viewportHeight = height ?? window.innerHeight;

  const scale = Math.min(
    viewportWidth / BASE_WIDTH,
    viewportHeight / BASE_HEIGHT,
  );
  const canvasWidth = Math.floor(BASE_WIDTH * scale);
  const canvasHeight = Math.floor(BASE_HEIGHT * scale);

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  canvas.style.width = `${canvasWidth}px`;
  canvas.style.height = `${canvasHeight}px`;

  world.config.width = canvasWidth;
  world.config.height = canvasHeight;
  resolution = canvasHeight / 480;
  screens = createScreens(world.config.width, world.config.height);
};

const toggleFullscreen = async () => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      isFullscreen = true;
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      canvas.width = screenWidth;
      canvas.height = screenHeight;
      canvas.style.width = `${screenWidth}px`;
      canvas.style.height = `${screenHeight}px`;
      world.config.width = screenWidth;
      world.config.height = screenHeight;
      resolution = screenHeight / 480;
      screens = createScreens(world.config.width, world.config.height);
    } else {
      await document.exitFullscreen();
      isFullscreen = false;
      setCanvasSize();
    }
  } catch (err) {
    console.warn("Fullscreen not available:", err);
  }
};

const exitFullscreen = async () => {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    isFullscreen = false;
    setCanvasSize();
  }
};

document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement && isFullscreen) {
    isFullscreen = false;
    setCanvasSize();
  }
});

const loadSvgSprites = async (): Promise<void> => {
  await preloadGameSprites();
  svgBackground = globalSpriteCache.get("background-level-1.svg", 1);
  svgPlayerCarStraight = globalSpriteCache.get("player-car.svg", 0.5);
  svgPlayerCarLeft = globalSpriteCache.get("player-car-left.svg", 0.5);
  svgPlayerCarRight = globalSpriteCache.get("player-car-right.svg", 0.5);
};

const SPRITE_NAME_MAP = new Map<string, string>([
  ["215_540_5", "PALM_TREE"],
  ["385_265_230", "BILLBOARD08"],
  ["360_360_625", "TREE1"],
  ["135_332_5", "DEAD_TREE1"],
  ["328_282_150", "BILLBOARD09"],
  ["320_220_230", "BOULDER3"],
  ["200_315_995", "COLUMN"],
  ["300_170_625", "BILLBOARD01"],
  ["298_190_488", "BILLBOARD06"],
  ["298_190_5", "BILLBOARD05"],
  ["298_190_313", "BILLBOARD07"],
  ["298_140_621", "BOULDER2"],
  ["282_295_1205", "TREE2"],
  ["268_170_1205", "BILLBOARD04"],
  ["150_260_1205", "DEAD_TREE2"],
  ["168_248_1205", "BOULDER1"],
  ["240_155_5", "BUSH1"],
  ["235_118_929", "CACTUS"],
  ["232_152_255", "BUSH2"],
  ["230_220_5", "BILLBOARD03"],
  ["215_220_245", "BILLBOARD02"],
  ["195_140_995", "STUMP"],
  ["122_144_1365", "SEMI"],
  ["100_78_1365", "TRUCK"],
  ["88_55_1383", "CAR03"],
  ["80_59_1383", "CAR02"],
  ["80_57_1383", "CAR04"],
  ["80_56_1205", "CAR01"],
]);

const getSpriteName = (
  sprite: { x: number; y: number; w: number; h: number },
  overrides?: Record<string, string>,
): string | null => {
  const key = `${sprite.w}_${sprite.h}_${sprite.x}`;
  const name = SPRITE_NAME_MAP.get(key) ?? null;
  if (name && overrides && overrides[name]) {
    return overrides[name];
  }
  return name;
};

const getPlayerCarSprite = (steer: number): CachedSprite | null => {
  if (steer < -0.5) return svgPlayerCarLeft;
  if (steer > 0.5) return svgPlayerCarRight;
  return svgPlayerCarStraight;
};

const adjustColor = (hex: string, amount: number): string => {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

const renderRacing = () => {
  const { config, player, skyOffset, currentTheme } = world;
  const {
    width,
    height,
    lanes,
    roadWidth,
    segmentLength,
    drawDistance,
    fogDensity,
  } = config;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const theme = currentTheme ?? getSelectedTheme();
  const fogColor = theme.colors.fog;
  const skyColor = theme.colors.sky;

  ctx.fillStyle = skyColor;
  ctx.fillRect(0, 0, width, height / 2);

  const baseSegment = Segments.findSegment(player.position, segmentLength);
  const basePercent = Util.percentRemaining(player.position, segmentLength);
  const playerSegment = Segments.findSegment(
    player.position + playerZ,
    segmentLength,
  );
  const playerPercent = Util.percentRemaining(
    player.position + playerZ,
    segmentLength,
  );
  const playerY = Util.interpolate(
    playerSegment.p1.world.y,
    playerSegment.p2.world.y,
    playerPercent,
  );
  let maxy = height;

  let x = 0;
  let dx = -(baseSegment.curve * basePercent);

  if (svgBackground) {
    ctx.save();
    if (theme.filters.background) {
      ctx.filter = theme.filters.background;
    }
    SvgRender.svgBackground(
      ctx,
      svgBackground,
      width,
      height,
      skyOffset,
      resolution * 0.001 * playerY,
    );
    ctx.restore();
  }

  const themeColors = {
    light: theme.colors.road,
    dark: {
      ...theme.colors.road,
      road: adjustColor(theme.colors.road.road, -15),
      grass: adjustColor(theme.colors.road.grass, -15),
      rumble: adjustColor(theme.colors.road.rumble, -15),
    },
  };

  for (let n = 0; n < drawDistance; n++) {
    const segmentIndex = (baseSegment.index + n) % world.segments.length;
    const segment = world.segments[segmentIndex];
    if (!segment) continue;

    segment.looped = segment.index < baseSegment.index;
    segment.fog = Util.exponentialFog(
      n / drawDistance,
      theme.effects.fogDensity,
    );
    segment.clip = maxy;

    Util.project(
      segment.p1,
      player.x * roadWidth - x,
      playerY + cameraHeight - (world.jumpState.peakHeight || 0) * 50,
      player.position - (segment.looped ? world.trackLength : 0),
      cameraDepth,
      width,
      height,
      roadWidth,
    );
    Util.project(
      segment.p2,
      player.x * roadWidth - x - dx,
      playerY + cameraHeight - (world.jumpState.peakHeight || 0) * 50,
      player.position - (segment.looped ? world.trackLength : 0),
      cameraDepth,
      width,
      height,
      roadWidth,
    );

    x += dx;
    dx += segment.curve;

    if (
      segment.p1.camera.z <= cameraDepth ||
      segment.p2.screen.y >= segment.p1.screen.y ||
      segment.p2.screen.y >= maxy
    ) {
      continue;
    }

    const segmentColor =
      Math.floor(segment.index / config.rumbleLength) % 2
        ? themeColors.light
        : themeColors.dark;

    Render.segment(
      ctx,
      width,
      lanes,
      segment.p1.screen.x,
      segment.p1.screen.y,
      segment.p1.screen.w ?? 0,
      segment.p2.screen.x,
      segment.p2.screen.y,
      segment.p2.screen.w ?? 0,
      segment.fog ?? 0,
      segmentColor,
    );

    Render.fogLayer(
      ctx,
      0,
      segment.p2.screen.y,
      width,
      segment.p1.screen.y - segment.p2.screen.y,
      segment.fog ?? 0,
      fogColor,
    );

    maxy = segment.p1.screen.y;
  }

  for (let n = drawDistance - 1; n > 0; n--) {
    const segmentIndex = (baseSegment.index + n) % world.segments.length;
    const segment = world.segments[segmentIndex];
    if (!segment) continue;

    for (const car of segment.cars) {
      const spriteScale = Util.interpolate(
        segment.p1.screen.scale,
        segment.p2.screen.scale,
        car.percent ?? 0,
      );
      const spriteX =
        Util.interpolate(
          segment.p1.screen.x,
          segment.p2.screen.x,
          car.percent ?? 0,
        ) +
        (spriteScale * car.offset * roadWidth * width) / 2;
      const spriteY = Util.interpolate(
        segment.p1.screen.y,
        segment.p2.screen.y,
        car.percent ?? 0,
      );

      const spriteName = getSpriteName(
        car.sprite,
        world.currentTheme?.spriteOverrides,
      );
      if (spriteName) {
        const cachedSprite = getSpriteByName(spriteName, spriteScale);
        if (cachedSprite) {
          SvgRender.svgSprite(
            ctx,
            cachedSprite,
            width,
            roadWidth,
            spriteScale,
            spriteX,
            spriteY,
            -0.5,
            -1,
            segment.clip ?? 0,
            car.sprite.w,
            car.sprite.h,
          );
        }
      }
    }

    // Render race opponents that are on this segment
    if (gameState.gameMode === "race") {
      for (const opp of world.raceOpponents) {
        const oppAbsZ = opp.position % world.trackLength;
        const oppSegIndex =
          Math.floor(oppAbsZ / config.segmentLength) % world.segments.length;
        if (oppSegIndex !== segment.index) continue;

        const oppPercent = (oppAbsZ % config.segmentLength) / config.segmentLength;
        const spriteScale = Util.interpolate(
          segment.p1.screen.scale,
          segment.p2.screen.scale,
          oppPercent,
        );
        const spriteX =
          Util.interpolate(
            segment.p1.screen.x,
            segment.p2.screen.x,
            oppPercent,
          ) +
          (spriteScale * opp.x * roadWidth * width) / 2;
        const spriteY = Util.interpolate(
          segment.p1.screen.y,
          segment.p2.screen.y,
          oppPercent,
        );

        const oppSprite = globalSpriteCache.get(opp.spriteName, spriteScale);
        if (oppSprite) {
          SvgRender.svgSprite(
            ctx,
            oppSprite,
            width,
            roadWidth,
            spriteScale,
            spriteX,
            spriteY,
            -0.5,
            -1,
            segment.clip ?? 0,
            oppSprite.width,
            oppSprite.height,
          );
        }
      }
    }

    for (const sprite of segment.sprites) {
      const spriteScale = segment.p1.screen.scale;
      const spriteX =
        segment.p1.screen.x +
        (spriteScale * sprite.offset * roadWidth * width) / 2;
      const spriteY = segment.p1.screen.y;

      const spriteName = getSpriteName(
        sprite.source,
        world.currentTheme?.spriteOverrides,
      );
      if (spriteName) {
        const cachedSprite = getSpriteByName(spriteName, spriteScale);
        if (cachedSprite) {
          SvgRender.svgSprite(
            ctx,
            cachedSprite,
            width,
            roadWidth,
            spriteScale,
            spriteX,
            spriteY,
            sprite.offset < 0 ? -1 : 0,
            -1,
            segment.clip ?? 0,
            sprite.source.w,
            sprite.source.h,
          );
        }
      }
    }

    if (segment === playerSegment) {
      const playerScale = cameraDepth / playerZ;
      const playerScreenY =
        height / 2 -
        (playerScale *
          Util.interpolate(
            playerSegment.p1.camera.y,
            playerSegment.p2.camera.y,
            playerPercent,
          ) *
          height) /
        2;
      const speedPercent = player.speed / config.maxSpeed;
      const bounce =
        1.5 *
        Math.random() *
        speedPercent *
        resolution *
        (Math.random() > 0.5 ? 1 : -1);
      const steer =
        player.speed * (world.input.left ? -1 : world.input.right ? 1 : 0);

      const playerSprite = getPlayerCarSprite(steer);

      if (playerSprite) {
        SvgRender.svgPlayer(
          ctx,
          playerSprite,
          width,
          height,
          roadWidth,
          speedPercent,
          playerScale,
          width / 2,
          playerScreenY,
          steer,
          bounce,
        );
      }
    }
  }

  const mirrorRange = world.trackLength * 0.08;
  const mirrorCars = getMirrorCars(
    world.cars,
    player.position,
    world.trackLength,
    mirrorRange,
    3,
  );

  const speed = (player.speed / config.maxSpeed) * 300;

  // Position tracking: ONLY count race opponents (not traffic cars)
  let playerPosition = 1;
  let totalRacers = 1;
  if (gameState.gameMode === "race" && world.raceOpponents.length > 0) {
    playerPosition = getRacePosition(world);
    totalRacers = world.raceOpponents.length + 1; // 10 opponents + player
  } else if (gameState.gameMode === "championship") {
    // Championship: count only AI cars in world.cars (no traffic)
    for (const car of world.cars) {
      if (car.z > player.position) playerPosition++;
    }
    totalRacers = world.cars.length + 1;
  }
  // Time trial: no position display (leave at 1/1)

  Render.renderParticles(ctx, world.particles, new Map());

  for (const weed of world.tumbleweeds) {
    const relZ = weed.z - player.position;
    if (relZ > 0 && relZ < 8000) {
      const distanceScale = 1 - relZ / 8000;
      const scale = 0.5 + distanceScale * 0.8;
      const screenY = height * 0.75 + distanceScale * 100;
      const screenX = width / 2 + weed.x * width * 0.25;
      const cachedWeed = globalSpriteCache.get("tumbleweed.svg", scale);
      if (cachedWeed) {
        Render.renderTumbleweed(
          ctx,
          { x: screenX, y: screenY, rotation: weed.rotation, scale },
          cachedWeed,
        );
      }
    }
  }

  if (world.lightningActive && theme.effects.lightning) {
    Render.lightningFlash(
      ctx,
      width,
      height,
      theme.effects.lightning.flashIntensity,
    );
  }

  hudState = {
    ...hudState,
    speed,
    maxSpeed: 300,
    position: playerPosition,
    totalPositions: totalRacers,
    mirrorCars: mirrorCars.slice(0, 3),
    boostMeter: Math.min(1, gameState.currentTime / DEFAULT_TIME_LIMIT),
  };


  renderHud(
    ctx,
    gameState,
    speed,
    {
      width,
      height,
    },
    hudState,
  );

  if (countdown > 0) {
    renderCountdown(ctx, width, height, countdown);
  }

  if (gameState.isPaused) {
    renderPauseOverlay(ctx, width, height);
  }
};

const renderSplitScreen = () => {
  const { width, height } = world.config;
  const viewportWidth = width / 2;
  const viewportHeight = height;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw divider
  Render.drawSplitScreenDivider(ctx, width / 2, 0, height);

  // Render each player's viewport
  for (let i = 0; i < playerCount; i++) {
    const player = world.players[i];
    if (!player) continue;

    const viewportX = i === 0 ? 0 : width / 2;

    ctx.save();
    ctx.beginPath();
    ctx.rect(viewportX, 0, viewportWidth, viewportHeight);
    ctx.clip();

    // Store original player
    const originalPlayer = world.player;
    world.player = player;

    // Render the world from this player's perspective
    renderRacingForViewport(viewportX, viewportWidth, viewportHeight, i);

    // Restore original player
    world.player = originalPlayer;

    ctx.restore();
  }
};

const renderRacingForViewport = (
  viewportX: number,
  viewportWidth: number,
  viewportHeight: number,
  playerIndex: number,
) => {
  const { config, player, skyOffset, currentTheme } = world;
  const { lanes, roadWidth, segmentLength, drawDistance, fogDensity } = config;

  const theme = currentTheme ?? getSelectedTheme();
  const fogColor = theme.colors.fog;
  const skyColor = theme.colors.sky;

  // Scale everything to fit the viewport
  const scaleX = viewportWidth / 1024;
  const scaleY = viewportHeight / 768;
  const scale = Math.min(scaleX, scaleY);

  // Translate context so all rendering is relative to this viewport
  ctx.save();
  ctx.translate(viewportX, 0);

  ctx.fillStyle = skyColor;
  ctx.fillRect(0, 0, viewportWidth, viewportHeight / 2);

  const baseSegment = Segments.findSegment(player.position, segmentLength);
  const basePercent = Util.percentRemaining(player.position, segmentLength);
  const playerSegment = Segments.findSegment(
    player.position + playerZ,
    segmentLength,
  );
  const playerPercent = Util.percentRemaining(
    player.position + playerZ,
    segmentLength,
  );
  const playerY = Util.interpolate(
    playerSegment.p1.world.y,
    playerSegment.p2.world.y,
    playerPercent,
  );
  let maxy = viewportHeight;

  let x = 0;
  let dx = -(baseSegment.curve * basePercent);

  if (svgBackground) {
    ctx.save();
    if (theme.filters.background) {
      ctx.filter = theme.filters.background;
    }
    SvgRender.svgBackground(
      ctx,
      svgBackground,
      viewportWidth,
      viewportHeight,
      skyOffset,
      resolution * 0.001 * playerY,
    );
    ctx.restore();
  }

  const themeColors = {
    light: theme.colors.road,
    dark: {
      ...theme.colors.road,
      road: adjustColor(theme.colors.road.road, -15),
      grass: adjustColor(theme.colors.road.grass, -15),
      rumble: adjustColor(theme.colors.road.rumble, -15),
    },
  };

  // Render road segments
  for (let n = 0; n < drawDistance; n++) {
    const segmentIndex = (baseSegment.index + n) % world.segments.length;
    const segment = world.segments[segmentIndex];
    if (!segment) continue;

    segment.looped = segment.index < baseSegment.index;
    segment.fog = Util.exponentialFog(
      n / drawDistance,
      theme.effects.fogDensity,
    );
    segment.clip = maxy;

    Util.project(
      segment.p1,
      player.x * roadWidth - x,
      playerY + cameraHeight - (world.jumpState.peakHeight || 0) * 50,
      player.position - (segment.looped ? world.trackLength : 0),
      cameraDepth,
      viewportWidth,
      viewportHeight,
      roadWidth,
    );
    Util.project(
      segment.p2,
      player.x * roadWidth - x - dx,
      playerY + cameraHeight - (world.jumpState.peakHeight || 0) * 50,
      player.position - (segment.looped ? world.trackLength : 0),
      cameraDepth,
      viewportWidth,
      viewportHeight,
      roadWidth,
    );

    x += dx;
    dx += segment.curve;

    if (
      segment.p1.camera.z <= cameraDepth ||
      segment.p2.screen.y >= segment.p1.screen.y ||
      segment.p2.screen.y >= maxy
    ) {
      continue;
    }

    const segmentColor =
      Math.floor(segment.index / config.rumbleLength) % 2
        ? themeColors.light
        : themeColors.dark;

    Render.segment(
      ctx,
      viewportWidth,
      lanes,
      segment.p1.screen.x,
      segment.p1.screen.y,
      segment.p1.screen.w ?? 0,
      segment.p2.screen.x,
      segment.p2.screen.y,
      segment.p2.screen.w ?? 0,
      segment.fog ?? 0,
      segmentColor,
    );

    maxy = segment.p1.screen.y;
  }

  // Render sprites and cars
  for (let n = drawDistance - 1; n > 0; n--) {
    const segmentIndex = (baseSegment.index + n) % world.segments.length;
    const segment = world.segments[segmentIndex];
    if (!segment) continue;

    // Render traffic cars
    for (const car of segment.cars) {
      const spriteScale = Util.interpolate(
        segment.p1.screen.scale,
        segment.p2.screen.scale,
        car.percent ?? 0,
      );
      const spriteX =
        Util.interpolate(
          segment.p1.screen.x,
          segment.p2.screen.x,
          car.percent ?? 0,
        ) +
        (spriteScale * car.offset * roadWidth * viewportWidth) / 2;
      const spriteY = Util.interpolate(
        segment.p1.screen.y,
        segment.p2.screen.y,
        car.percent ?? 0,
      );

      const spriteName = getSpriteName(
        car.sprite,
        world.currentTheme?.spriteOverrides,
      );
      if (spriteName) {
        const cachedSprite = getSpriteByName(spriteName, spriteScale);
        if (cachedSprite) {
          SvgRender.svgSprite(
            ctx,
            cachedSprite,
            viewportWidth,
            roadWidth,
            spriteScale,
            spriteX,
            spriteY,
            -0.5,
            -1,
            segment.clip ?? 0,
            car.sprite.w,
            car.sprite.h,
          );
        }
      }
    }

    // Render scenery sprites
    for (const sprite of segment.sprites) {
      const spriteScale = segment.p1.screen.scale;
      const spriteX =
        segment.p1.screen.x +
        (spriteScale * sprite.offset * roadWidth * viewportWidth) / 2;
      const spriteY = segment.p1.screen.y;

      const spriteName = getSpriteName(
        sprite.source,
        world.currentTheme?.spriteOverrides,
      );
      if (spriteName) {
        const cachedSprite = getSpriteByName(spriteName, spriteScale);
        if (cachedSprite) {
          SvgRender.svgSprite(
            ctx,
            cachedSprite,
            viewportWidth,
            roadWidth,
            spriteScale,
            spriteX,
            spriteY,
            sprite.offset < 0 ? -1 : 0,
            -1,
            segment.clip ?? 0,
            sprite.source.w,
            sprite.source.h,
          );
        }
      }
    }

    // Render current player car if on this segment
    if (segment === playerSegment) {
      const playerScale = cameraDepth / playerZ;
      const playerScreenY =
        viewportHeight / 2 -
        (playerScale *
          Util.interpolate(
            playerSegment.p1.camera.y,
            playerSegment.p2.camera.y,
            playerPercent,
          ) *
          viewportHeight) /
        2;
      const speedPercent = player.speed / config.maxSpeed;
      const bounce =
        1.5 *
        Math.random() *
        speedPercent *
        resolution *
        (Math.random() > 0.5 ? 1 : -1);
      const input = world.inputs[playerIndex] ?? world.input;
      const steer = player.speed * (input.left ? -1 : input.right ? 1 : 0);

      const playerSprite = getPlayerCarSprite(steer);

      if (playerSprite) {
        SvgRender.svgPlayer(
          ctx,
          playerSprite,
          viewportWidth,
          viewportHeight,
          roadWidth,
          speedPercent,
          playerScale,
          viewportWidth / 2,
          playerScreenY,
          steer,
          bounce,
        );
      }
    }

    // Render other players' cars if they are on this segment
    if (playerCount > 1) {
      for (let otherIndex = 0; otherIndex < playerCount; otherIndex++) {
        if (otherIndex === playerIndex) continue;

        const otherPlayer = world.players[otherIndex];
        const otherInput = world.inputs[otherIndex];
        if (!otherPlayer || !otherInput) continue;

        // Calculate which segment the other player is on
        const otherPlayerZ = otherPlayer.position + playerZ;
        const otherPlayerSegmentIndex =
          Math.floor(otherPlayerZ / segmentLength) % world.segments.length;

        if (segment.index === otherPlayerSegmentIndex) {
          const otherPlayerPercent = Util.percentRemaining(
            otherPlayerZ,
            segmentLength,
          );

          // Use the segment's scale which accounts for distance from camera
          const otherPlayerScale = Util.interpolate(
            segment.p1.screen.scale,
            segment.p2.screen.scale,
            otherPlayerPercent,
          );

          // Calculate Y position based on the segment's projected coordinates
          const otherPlayerScreenY =
            viewportHeight / 2 -
            (otherPlayerScale *
              Util.interpolate(
                segment.p1.camera.y,
                segment.p2.camera.y,
                otherPlayerPercent,
              ) *
              viewportHeight) /
            2;

          const otherSpeedPercent = otherPlayer.speed / config.maxSpeed;
          const otherBounce =
            1.5 *
            Math.random() *
            otherSpeedPercent *
            resolution *
            (Math.random() > 0.5 ? 1 : -1);
          const otherSteer =
            otherPlayer.speed *
            (otherInput.left ? -1 : otherInput.right ? 1 : 0);

          const otherPlayerSprite = getPlayerCarSprite(otherSteer);

          if (otherPlayerSprite) {
            // Calculate lateral position based on the difference in x positions
            // Scale by viewport width and road width to get screen coordinates
            const xOffset =
              (otherPlayer.x - player.x) *
              roadWidth *
              viewportWidth *
              otherPlayerScale *
              0.5;
            SvgRender.svgPlayer(
              ctx,
              otherPlayerSprite,
              viewportWidth,
              viewportHeight,
              roadWidth,
              otherSpeedPercent,
              otherPlayerScale,
              viewportWidth / 2 + xOffset,
              otherPlayerScreenY,
              otherSteer,
              otherBounce,
            );
          }
        }
      }
    }
  }

  // Render HUD for this player
  const speed = (player.speed / config.maxSpeed) * 300;
  const mirrorRange = world.trackLength * 0.08;
  const mirrorCars = getMirrorCars(
    world.cars,
    player.position,
    world.trackLength,
    mirrorRange,
    3,
  );

  let playerPosition = 1;

  // Count traffic cars ahead
  for (const car of world.cars) {
    if (car.z > player.position) {
      playerPosition++;
    }
  }

  // Count other human players ahead
  for (let i = 0; i < playerCount; i++) {
    if (i === playerIndex) continue;
    const otherPlayer = world.players[i];
    if (otherPlayer && otherPlayer.position > player.position) {
      playerPosition++;
    }
  }

  // Calculate total positions (traffic cars/AI + all human players)
  const totalPositions = world.cars.length + playerCount;

  renderSplitScreenHud(
    ctx,
    gameState,
    speed,
    {
      width: viewportWidth,
      height: viewportHeight,
      x: 0,
      y: 0,
      playerIndex,
    },
    {
      speed,
      maxSpeed: 300,
      position: Math.min(playerPosition, totalPositions),
      totalPositions,
      mirrorCars: mirrorCars.slice(0, 3),
      boostMeter: Math.min(1, gameState.currentTime / DEFAULT_TIME_LIMIT),
    },
  );

  ctx.restore();
};

const render = () => {
  const { width, height } = world.config;

  if (gameState.screen === "racing") {
    if (playerCount === 1) {
      renderRacing();
    } else {
      renderSplitScreen();
    }
  } else {
    const screen = screens.get(gameState.screen);
    if (screen) {
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      screen.render(ctx, gameState);
    }
  }
};

const updateGame = (dt: number) => {
  if (gameState.screen !== "racing" || gameState.isPaused || countdown > 0) {
    return;
  }

  gameState = updateTimer(gameState, dt);

  if (playerCount === 1) {
    const prevLap = world.currentLapTime;
    update(world, dt);
    if (gameState.gameMode === "race") {
      updateRaceOpponents(world, dt);
    }
    const speedPercent = world.player.speed / world.config.maxSpeed;
    updateWind(world, dt, speedPercent);
    updateJump(world, dt);
    updateParticles(world, dt);
    updateTumbleweeds(world, dt);
    updateLightning(world, dt);
    updateSlidePhysics(world, dt);
    updateEngineSound(speedPercent);

    const checkpointResult = checkCheckpoint(
      gameState,
      world.player.position,
      world.trackLength,
      world.config.segmentLength,
    );
    if (checkpointResult.bonusAwarded > 0) {
      gameState = checkpointResult.state;
    }

    if (
      prevLap > 0 &&
      world.currentLapTime === 0 &&
      world.lastLapTime !== null
    ) {
      gameState = completeLap(gameState, world);
    }
  } else {
    // Multiplayer mode - update each player
    for (let i = 0; i < playerCount; i++) {
      const player = world.players[i];
      const input = world.inputs[i];
      if (!player || !input) continue;

      // Temporarily set the main player/input for the update function
      world.player = player;
      world.input = input;

      const prevLap = world.currentLapTime;
      update(world, dt);

      const speedPercent = player.speed / world.config.maxSpeed;
      updateWind(world, dt, speedPercent);
      updateJump(world, dt);
      updateParticles(world, dt);
      updateTumbleweeds(world, dt);
      updateLightning(world, dt);
      updateSlidePhysics(world, dt);

      // Update engine sound for player 1 only
      if (i === 0) {
        updateEngineSound(speedPercent);
      }

      // Check lap completion for each player
      if (
        prevLap > 0 &&
        world.currentLapTime === 0 &&
        world.lastLapTime !== null
      ) {
        multiRaceState = checkLapComplete(multiRaceState, i, world);
      }
    }

    // Handle player-player collisions
    resolveAllPlayerCollisions(
      world.players,
      world.config.segmentLength,
      playCollisionSound,
    );

    // Restore first player as default
    world.player = world.players[0]!;
    world.input = world.inputs[0]!;

    // Update race countdown
    multiRaceState = updateRaceCountdown(multiRaceState, dt);
  }
};

const frame = () => {
  const now = Util.timestamp();
  const dt = Math.min(1, (now - last) / 1000);
  gdt += dt;

  if (countdown > 0) {
    countdownTimer += dt;
    if (countdownTimer >= 1) {
      countdown--;
      countdownTimer = 0;
    }
  }

  while (gdt > step) {
    gdt -= step;
    updateGame(step);
  }

  render();
  last = now;
  requestAnimationFrame(frame);
};

const goToDifficultySelection = () => {
  gameState = { ...gameState, screen: "difficulty-select" };
};

const goToMusicSelection = async () => {
  gameState = { ...gameState, screen: "music-select" };
  const musicScreen = screens.get("music-select") as
    | MusicSelectionScreen
    | undefined;
  const selectedTrack = musicScreen?.getSelectedTrack();
  if (selectedTrack && selectedTrack.file) {
    await loadAndPlayTrack(selectedTrack.file);
    setMusicVolume(0.3);
  } else {
    stopGameMusic();
  }
};

const goToCarSelection = () => {
  gameState = { ...gameState, screen: "car-select" };
};

const startGame = async (themeId?: string) => {
  const mainMenuScreen = screens.get("main-menu") as MainMenuScreen | undefined;
  const names = mainMenuScreen ? [mainMenuScreen.getPlayer1Name(), mainMenuScreen.getPlayer2Name()] : [];
  world = createWorld(playerCount, names);
  world.onCollision = playCollisionSound;

  const musicScreen = screens.get("music-select") as
    | MusicSelectionScreen
    | undefined;

  selectedThemeId = themeId ?? "night";

  const theme = getSelectedTheme();
  setTheme(world, theme);

  if (championshipState) {
    world.player.position -= championshipState.gridPosition * 500; // rough start

    // Replace generic traffic with AI opponents
    for (const segment of world.segments) {
      segment.cars = [];
    }
    world.cars = initChampionshipAI(world.trackLength, world.config.segmentLength);
  }

  const carScreen = screens.get("car-select") as CarSelectionScreen | undefined;
  if (carScreen) {
    const selectedCar = carScreen.getSelectedCar();
    world.player.selectedCar = selectedCar;
    svgPlayerCarStraight = globalSpriteCache.get(selectedCar.sprite, 0.5);
    svgPlayerCarLeft = globalSpriteCache.get(selectedCar.spriteLeft, 0.5);
    svgPlayerCarRight = globalSpriteCache.get(selectedCar.spriteRight, 0.5);
  }

  canvas.style.filter = theme.filters.global;

  // In race mode: use 10 race opponents + light traffic (5 slow cars for ambience)
  // In other modes: full traffic, no race opponents
  if (gameState.gameMode === "race") {
    resetCars(world, 5); // light background traffic only
    initRaceOpponents(world);
  } else if (!championshipState) {
    resetCars(world, TRAFFIC_CAR_COUNT);
  }

  // Position players for multiplayer
  if (playerCount > 1) {
    // Position players side by side
    if (world.players[0]) world.players[0].x = -0.5;
    if (world.players[1]) world.players[1].x = 0.5;

    // Initialize input manager
    inputManager = new InputManager(playerCount);
    multiRaceState = startMultiplayerRace(multiRaceState, playerCount);
  }

  gameState = startRace(gameState);
  countdown = 3;
  countdownTimer = 0;
  hudState = createDefaultHudState();

  const selectedTrack = musicScreen?.getSelectedTrack();
  if (selectedTrack && selectedTrack.file) {
    stopGameMusic();
    await loadAndPlayTrack(selectedTrack.file);
    setMusicVolume(0.3);
  } else {
    stopGameMusic();
  }

  // Start engine sound
  startEngineSound();
};

const goToRECS = () => {
  gameState = { ...gameState, screen: "recs" };
};

const handleMenuKeyDown = async (keyCode: number) => {
  const screen = screens.get(gameState.screen) as UIScreen | undefined;

  if (gameState.screen === "main-menu") {
    const mainMenuScreen = screen as MainMenuScreen | undefined;

    // Get current player count before handling the action
    if (mainMenuScreen) {
      playerCount = mainMenuScreen.getPlayerCount();
    }

    const action = screen?.handleKeyDown?.(keyCode);

    // Check if player count was toggled (action will be null if toggle happened)
    if (mainMenuScreen) {
      playerCount = mainMenuScreen.getPlayerCount();
      // Sync game mode from main menu to game state
      const menuGameMode = mainMenuScreen.getGameMode();
      if (gameState.gameMode !== menuGameMode) {
        gameState = toggleGameMode(gameState);
      }
    }

    if (action === "start") {
      await goToMusicSelection();
    } else if (action === "constructor") {
      goToRECS();
    } else if (action === "sound") {
      const isEnabled = toggleSound();
      console.log(`Sound ${isEnabled ? "enabled" : "disabled"}`);
    }
  } else if (gameState.screen === "recs") {
    const recsScreen = screen as RECSScreen | undefined;
    const action = screen?.handleKeyDown?.(keyCode);

    if (action === "start_game") {
      const themeId = recsScreen?.getSelectedThemeId() ?? "night";
      await startGame(themeId);
    } else if (action === "back") {
      gameState = { ...gameState, screen: "main-menu" };
    }
  } else if (gameState.screen === "music-select") {
    const musicScreen = screen as MusicSelectionScreen | undefined;
    const prevTrack = musicScreen?.getSelectedTrack();
    const action = screen?.handleKeyDown?.(keyCode);
    const newTrack = musicScreen?.getSelectedTrack();

    if (action === "start_game") {
      goToCarSelection();
    } else if (prevTrack?.id !== newTrack?.id && newTrack) {
      if (newTrack.file) {
        await loadAndPlayTrack(newTrack.file);
        setMusicVolume(0.3);
      } else {
        stopGameMusic();
      }
    }
  } else if (gameState.screen === "car-select") {
    const action = screen?.handleKeyDown?.(keyCode);
    if (action === "start_race") {
      await startGame();
    }
  } else if (gameState.screen === "difficulty-select") {
    const diffScreen = screen as DifficultySelectionScreen | undefined;
    const action = screen?.handleKeyDown?.(keyCode);
    if (action === "difficulty_selected") {
      championshipState = createChampionshipState(diffScreen?.getSelectedDifficulty() ?? "medium");
      await goToMusicSelection();
    } else if (action === "password_accepted") {
      // Could load fully from password, wait to implement parsePassword in details
      await goToMusicSelection();
    }
  } else if (gameState.screen === "standings") {
    if (keyCode === KEY.SPACE || keyCode === 13) {
      if (championshipState && !championshipState.eliminated && championshipState.currentRace < championshipState.totalRaces) {
        // Next race
        await goToCarSelection();
      } else {
        // Championship over, return to menu
        championshipState = null;
        gameState = returnToMenu(gameState);
        stopEngineSound();
        startMenuMusic();
      }
    }
  } else if (gameState.screen === "results") {
    if (keyCode === KEY.SPACE) {
      // if championship mode, go to standings instead!
      if (gameState.gameMode === "championship" && championshipState) {
        // approximate position from player array
        let playerPosition = 1;
        for (const car of world.cars) {
          if (car.z > world.player.position) playerPosition++;
        }
        championshipState = updateChampionshipStandings(championshipState, playerPosition);
        gameState = { ...gameState, screen: "standings" };
        screens.set("standings", new ChampionshipStandingsScreen(world.config.width, world.config.height, championshipState!));
      } else {
        gameState = returnToMenu(gameState);
        stopEngineSound();
        startMenuMusic();
      }
    }
  } else if (gameState.screen === "racing") {
    if (keyCode === KEY.P || keyCode === 27) {
      if (gameState.isPaused) {
        gameState = resumeGame(gameState);
      } else {
        gameState = pauseGame(gameState);
      }
    }
    if (keyCode === KEY.F || keyCode === 122) {
      toggleFullscreen();
    }
  }
};

document.addEventListener("keydown", (ev) => {
  if (ev.keyCode === 122) {
    ev.preventDefault();
  }

  if (gameState.screen === "racing" && !gameState.isPaused && countdown === 0) {
    if (playerCount === 1) {
      handleKeyDown(world, ev.keyCode);
    } else {
      inputManager.handleKeyDown(world.inputs, ev.keyCode);
    }
  }
  handleMenuKeyDown(ev.keyCode);
});

document.addEventListener("keyup", (ev) => {
  if (gameState.screen === "racing") {
    if (playerCount === 1) {
      handleKeyUp(world, ev.keyCode);
    } else {
      inputManager.handleKeyUp(world.inputs, ev.keyCode);
    }
  }
});

canvas.addEventListener("click", async (ev) => {
  const rect = canvas.getBoundingClientRect();
  const x = (ev.clientX - rect.left) * (world.config.width / rect.width);
  const y = (ev.clientY - rect.top) * (world.config.height / rect.height);

  const screen = screens.get(gameState.screen) as UIScreen | undefined;

  if (gameState.screen === "main-menu") {
    const mainMenuScreen = screen as MainMenuScreen | undefined;

    // Get current player count before handling the action
    if (mainMenuScreen) {
      playerCount = mainMenuScreen.getPlayerCount();
    }

    const action = screen?.handleClick?.(x, y);

    // Check if player count was toggled (action will be null if toggle happened)
    if (mainMenuScreen) {
      playerCount = mainMenuScreen.getPlayerCount();
      // Sync game mode from main menu to game state
      const menuGameMode = mainMenuScreen.getGameMode();
      if (gameState.gameMode !== menuGameMode) {
        gameState = toggleGameMode(gameState);
      }
    }

    if (action === "start") {
      await goToMusicSelection();
    } else if (action === "constructor") {
      goToRECS();
    } else if (action === "sound") {
      const isEnabled = toggleSound();
      console.log(`Sound ${isEnabled ? "enabled" : "disabled"}`);
    }
  } else if (gameState.screen === "music-select") {
    const action = screen?.handleClick?.(x, y);
    if (action === "start_game") {
      goToCarSelection();
    }
  } else if (gameState.screen === "car-select") {
    const action = screen?.handleClick?.(x, y);
    if (action === "start_race") {
      await startGame();
    }
  } else if (gameState.screen === "recs") {
    const recsScreen = screen as RECSScreen | undefined;
    const action = screen?.handleClick?.(x, y);
    if (action === "start_game") {
      const themeId = recsScreen?.getSelectedThemeId() ?? "night";
      await startGame(themeId);
    } else if (action === "back") {
      gameState = { ...gameState, screen: "main-menu" };
    }
  }
});

canvas.addEventListener("mousemove", (ev) => {
  const rect = canvas.getBoundingClientRect();
  const x = (ev.clientX - rect.left) * (world.config.width / rect.width);
  const y = (ev.clientY - rect.top) * (world.config.height / rect.height);

  const screen = screens.get(gameState.screen) as UIScreen | undefined;
  screen?.handleMouseMove?.(x, y);

  if (
    gameState.screen === "main-menu" ||
    gameState.screen === "music-select" ||
    gameState.screen === "car-select" ||
    gameState.screen === "difficulty-select" ||
    gameState.screen === "recs"
  ) {
    const zones = screen?.getZones?.() ?? [];
    for (const zone of zones) {
      if (
        x >= zone.x &&
        x <= zone.x + zone.width &&
        y >= zone.y &&
        y <= zone.y + zone.height
      ) {
        canvas.style.cursor = "pointer";
        return;
      }
    }
  }
  canvas.style.cursor = "default";
});

setCanvasSize();

window.addEventListener("resize", () => {
  if (!isFullscreen) {
    setCanvasSize();
  }
});

const init = async () => {
  try {
    await loadSvgSprites();
    console.log("SVG sprites loaded successfully");
  } catch (err) {
    console.error("Failed to load SVG sprites:", err);
  }

  setMusicVolume(0.3);
  frame();
};

let menuMusicStarted = false;

const startMenuMusic = async () => {
  if (menuMusicStarted) return;
  menuMusicStarted = true;

  const titleTrack = MUSIC_TRACKS[0];
  if (titleTrack) {
    await loadAndPlayTrack(titleTrack.file);
    setMusicVolume(0.3);
  }
};

document.addEventListener("click", startMenuMusic, { once: true });
document.addEventListener("keydown", startMenuMusic, { once: true });

init();
