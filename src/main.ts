import { KEY } from "./engine/constants";
import {
  createWorld,
  update,
  handleKeyDown,
  handleKeyUp,
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
  loadGameMusic,
  playGameMusic,
  setMusicVolume,
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
} from "./game/modes/time-challenge";
import { createScreens, type Button } from "./ui/screens/screens";
import { renderHud, renderPauseOverlay, renderCountdown } from "./ui/hud/hud";

const canvas = document.getElementById("canvas") as HTMLCanvasElement | null;

if (!canvas) {
  throw new Error("Canvas element not found");
}

const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("Could not get 2d context");
}

const world = createWorld();
const step = 1 / world.config.fps;

let svgBackground: CachedSprite | null = null;
let svgPlayerCar: CachedSprite | null = null;
let last = Util.timestamp();
let gdt = 0;

let gameState = createTimeChallengeState();
let screens = createScreens(world.config.width, world.config.height);

const cameraDepth = 1 / Math.tan(((100 / 2) * Math.PI) / 180);
const cameraHeight = 1000;
const playerZ = world.player.z;
const resolution = world.config.height / 480;

let countdown = 0;
let countdownTimer = 0;

const loadSvgSprites = async (): Promise<void> => {
  await preloadGameSprites();
  svgBackground = globalSpriteCache.get("background-level-1.svg", 1);
  svgPlayerCar = globalSpriteCache.get("player-car.svg", 0.5);
};

const getSpriteName = (sprite: { w: number; h: number }): string | null => {
  const spriteMap: Record<string, { w: number; h: number; name: string }> = {
    PALM_TREE: { w: 215, h: 540, name: "PALM_TREE" },
    BILLBOARD08: { w: 385, h: 265, name: "BILLBOARD08" },
    TREE1: { w: 360, h: 360, name: "TREE1" },
    DEAD_TREE1: { w: 135, h: 332, name: "DEAD_TREE1" },
    BILLBOARD09: { w: 328, h: 282, name: "BILLBOARD09" },
    BOULDER3: { w: 320, h: 220, name: "BOULDER3" },
    COLUMN: { w: 200, h: 315, name: "COLUMN" },
    BILLBOARD01: { w: 300, h: 170, name: "BILLBOARD01" },
    BILLBOARD06: { w: 298, h: 190, name: "BILLBOARD06" },
    BILLBOARD05: { w: 298, h: 190, name: "BILLBOARD05" },
    BILLBOARD07: { w: 298, h: 190, name: "BILLBOARD07" },
    BOULDER2: { w: 298, h: 140, name: "BOULDER2" },
    TREE2: { w: 282, h: 295, name: "TREE2" },
    BILLBOARD04: { w: 268, h: 170, name: "BILLBOARD04" },
    DEAD_TREE2: { w: 150, h: 260, name: "DEAD_TREE2" },
    BOULDER1: { w: 168, h: 248, name: "BOULDER1" },
    BUSH1: { w: 240, h: 155, name: "BUSH1" },
    CACTUS: { w: 235, h: 118, name: "CACTUS" },
    BUSH2: { w: 232, h: 152, name: "BUSH2" },
    BILLBOARD03: { w: 230, h: 220, name: "BILLBOARD03" },
    BILLBOARD02: { w: 215, h: 220, name: "BILLBOARD02" },
    STUMP: { w: 195, h: 140, name: "STUMP" },
    SEMI: { w: 122, h: 144, name: "SEMI" },
    TRUCK: { w: 100, h: 78, name: "TRUCK" },
    CAR03: { w: 88, h: 55, name: "CAR03" },
    CAR02: { w: 80, h: 59, name: "CAR02" },
    CAR04: { w: 80, h: 57, name: "CAR04" },
    CAR01: { w: 80, h: 56, name: "CAR01" },
  };

  for (const [, data] of Object.entries(spriteMap)) {
    if (data.w === sprite.w && data.h === sprite.h) {
      return data.name;
    }
  }
  return null;
};

const renderRacing = () => {
  const { config, player, skyOffset } = world;
  const {
    width,
    height,
    lanes,
    roadWidth,
    segmentLength,
    drawDistance,
    fogDensity,
  } = config;

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

  ctx.clearRect(0, 0, width, height);

  if (svgBackground) {
    SvgRender.svgBackground(
      ctx,
      svgBackground,
      width,
      height,
      skyOffset,
      resolution * 0.001 * playerY,
    );
  }

  for (let n = 0; n < drawDistance; n++) {
    const segmentIndex = (baseSegment.index + n) % world.segments.length;
    const segment = world.segments[segmentIndex];
    if (!segment) continue;

    segment.looped = segment.index < baseSegment.index;
    segment.fog = Util.exponentialFog(n / drawDistance, fogDensity);
    segment.clip = maxy;

    Util.project(
      segment.p1,
      player.x * roadWidth - x,
      playerY + cameraHeight,
      player.position - (segment.looped ? world.trackLength : 0),
      cameraDepth,
      width,
      height,
      roadWidth,
    );
    Util.project(
      segment.p2,
      player.x * roadWidth - x - dx,
      playerY + cameraHeight,
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
      segment.color,
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

      const spriteName = getSpriteName(car.sprite);
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

      const spriteName = getSpriteName(sprite.source);
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
          );
        }
      }
    }

    if (segment === playerSegment && svgPlayerCar) {
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

      SvgRender.svgPlayer(
        ctx,
        svgPlayerCar,
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

  renderHud(ctx, gameState, (player.speed / config.maxSpeed) * 300, {
    x: 10,
    y: 10,
    width: 280,
    height: 120,
  });

  if (countdown > 0) {
    renderCountdown(ctx, width, height, countdown);
  }

  if (gameState.isPaused) {
    renderPauseOverlay(ctx, width, height);
  }
};

const render = () => {
  const { width, height } = world.config;

  if (gameState.screen === "racing") {
    renderRacing();
  } else {
    const screen = screens.get(gameState.screen);
    if (screen) {
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, width, height);
      screen.render(ctx, gameState);
    }
  }
};

const updateGame = (dt: number) => {
  if (gameState.screen !== "racing" || gameState.isPaused || countdown > 0) {
    return;
  }

  gameState = updateTimer(gameState, dt);

  const prevLap = world.currentLapTime;
  update(world, dt);

  if (prevLap > 0 && world.currentLapTime === 0 && world.lastLapTime !== null) {
    gameState = completeLap(gameState, world);
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

const startGame = () => {
  gameState = startRace(gameState);
  countdown = 3;
  countdownTimer = 0;
  playGameMusic();
};

const handleMenuKeyDown = (keyCode: number) => {
  if (gameState.screen === "main-menu") {
    if (keyCode === KEY.SPACE || keyCode === KEY.UP) {
      startGame();
    }
  } else if (gameState.screen === "results") {
    if (keyCode === KEY.SPACE) {
      gameState = returnToMenu(gameState);
    }
  } else if (gameState.screen === "racing") {
    if (keyCode === KEY.P || keyCode === 27) {
      if (gameState.isPaused) {
        gameState = resumeGame(gameState);
      } else {
        gameState = pauseGame(gameState);
      }
    }
  }
};

document.addEventListener("keydown", (ev) => {
  if (gameState.screen === "racing" && !gameState.isPaused && countdown === 0) {
    handleKeyDown(world, ev.keyCode);
  }
  handleMenuKeyDown(ev.keyCode);
});

document.addEventListener("keyup", (ev) => {
  if (gameState.screen === "racing") {
    handleKeyUp(world, ev.keyCode);
  }
});

canvas.addEventListener("click", (ev) => {
  const rect = canvas.getBoundingClientRect();
  const x = (ev.clientX - rect.left) * (world.config.width / rect.width);
  const y = (ev.clientY - rect.top) * (world.config.height / rect.height);

  if (gameState.screen === "main-menu") {
    const screen = screens.get("main-menu") as
      | { getButtons?: () => Button[] }
      | undefined;
    const buttons = screen?.getButtons?.() ?? [];
    for (const button of buttons) {
      if (
        x >= button.x &&
        x <= button.x + button.width &&
        y >= button.y &&
        y <= button.y + button.height
      ) {
        if (button.action === "start") {
          startGame();
        }
        break;
      }
    }
  }
});

canvas.addEventListener("mousemove", (ev) => {
  const rect = canvas.getBoundingClientRect();
  const x = (ev.clientX - rect.left) * (world.config.width / rect.width);
  const y = (ev.clientY - rect.top) * (world.config.height / rect.height);

  if (gameState.screen === "main-menu") {
    const screen = screens.get("main-menu") as
      | { getButtons?: () => Button[] }
      | undefined;
    const buttons = screen?.getButtons?.() ?? [];
    for (const button of buttons) {
      if (
        x >= button.x &&
        x <= button.x + button.width &&
        y >= button.y &&
        y <= button.y + button.height
      ) {
        canvas.style.cursor = "pointer";
        return;
      }
    }
  }
  canvas.style.cursor = "default";
});

canvas.width = world.config.width;
canvas.height = world.config.height;

const init = async () => {
  try {
    await loadSvgSprites();
    console.log("SVG sprites loaded successfully");
  } catch (err) {
    console.error("Failed to load SVG sprites:", err);
  }

  try {
    await loadGameMusic();
    setMusicVolume(0.3);
  } catch (err) {
    console.warn("Failed to load music:", err);
  }

  frame();
};

init();
