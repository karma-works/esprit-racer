import { BACKGROUND, KEY } from "./engine/constants";
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
  type GameScreen,
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

let background: HTMLImageElement | null = null;
let sprites: HTMLImageElement | null = null;
let svgBackground: CachedSprite | null = null;
let svgPlayerCar: CachedSprite | null = null;
let last = Util.timestamp();
let gdt = 0;
let useSvg = false;

let gameState = createTimeChallengeState();
let screens = createScreens(world.config.width, world.config.height);

const cameraDepth = 1 / Math.tan(((100 / 2) * Math.PI) / 180);
const cameraHeight = 1000;
const playerZ = world.player.z;
const resolution = world.config.height / 480;

let countdown = 0;
let countdownTimer = 0;

const loadImages = (names: string[]): Promise<HTMLImageElement[]> => {
  return Promise.all(
    names.map((name) => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = document.createElement("img");
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = `images/${name}.png`;
      });
    }),
  );
};

const loadSvgSprites = async (): Promise<void> => {
  await preloadGameSprites();
  svgBackground = globalSpriteCache.get("level-1-background.svg", 1);
  svgPlayerCar = globalSpriteCache.get("retro-racing-car.svg", 0.5);
};

const renderRacing = () => {
  const { config, player, skyOffset, hillOffset, treeOffset } = world;
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

  if (useSvg && svgBackground) {
    SvgRender.svgBackground(
      ctx,
      svgBackground,
      width,
      height,
      skyOffset,
      resolution * 0.001 * playerY,
    );
  } else if (background) {
    Render.background(
      ctx,
      background,
      width,
      height,
      BACKGROUND.SKY,
      skyOffset,
      resolution * 0.001 * playerY,
    );
    Render.background(
      ctx,
      background,
      width,
      height,
      BACKGROUND.HILLS,
      hillOffset,
      resolution * 0.002 * playerY,
    );
    Render.background(
      ctx,
      background,
      width,
      height,
      BACKGROUND.TREES,
      treeOffset,
      resolution * 0.003 * playerY,
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

  if (sprites) {
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
        Render.sprite(
          ctx,
          width,
          height,
          resolution,
          roadWidth,
          sprites,
          car.sprite,
          spriteScale,
          spriteX,
          spriteY,
          -0.5,
          -1,
          segment.clip ?? 0,
        );
      }

      for (const sprite of segment.sprites) {
        const spriteScale = segment.p1.screen.scale;
        const spriteX =
          segment.p1.screen.x +
          (spriteScale * sprite.offset * roadWidth * width) / 2;
        const spriteY = segment.p1.screen.y;
        Render.sprite(
          ctx,
          width,
          height,
          resolution,
          roadWidth,
          sprites,
          sprite.source,
          spriteScale,
          spriteX,
          spriteY,
          sprite.offset < 0 ? -1 : 0,
          -1,
          segment.clip ?? 0,
        );
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

        if (useSvg && svgPlayerCar) {
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
        } else if (sprites) {
          Render.player(
            ctx,
            width,
            height,
            resolution,
            roadWidth,
            sprites,
            speedPercent,
            playerScale,
            width / 2,
            playerScreenY,
            steer,
            playerSegment.p2.world.y - playerSegment.p1.world.y,
          );
        }
      }
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
    useSvg = true;
    console.log("SVG sprites loaded successfully");
  } catch (err) {
    console.warn("Failed to load SVG sprites, falling back to PNG:", err);
    useSvg = false;
  }

  try {
    const [bg, sp] = await loadImages(["background", "sprites"]);
    background = bg ?? null;
    sprites = sp ?? null;
  } catch (err) {
    console.warn("Failed to load PNG images:", err);
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
