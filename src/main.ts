import { BACKGROUND, KEY } from "./engine/constants";
import {
  createWorld,
  update,
  handleKeyDown,
  handleKeyUp,
  formatTime,
} from "./engine/world";
import * as Render from "./engine/renderer/canvas";
import * as Util from "./engine/utils/math";
import * as Segments from "./engine/segments";

const canvas = document.getElementById("canvas") as HTMLCanvasElement | null;
const speedEl = document.getElementById("speed-value");
const timerEl = document.getElementById("timer-value");
const lapEl = document.getElementById("lap-value");

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
let last = Util.timestamp();
let gdt = 0;

const cameraDepth = 1 / Math.tan(((100 / 2) * Math.PI) / 180);
const cameraHeight = 1000;
const playerZ = world.player.z;
const resolution = world.config.height / 480;

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

const render = () => {
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

  if (background) {
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

      if (segment === playerSegment && sprites) {
        Render.player(
          ctx,
          width,
          height,
          resolution,
          roadWidth,
          sprites,
          player.speed / config.maxSpeed,
          cameraDepth / playerZ,
          width / 2,
          height / 2 -
            ((cameraDepth / playerZ) *
              Util.interpolate(
                playerSegment.p1.camera.y,
                playerSegment.p2.camera.y,
                playerPercent,
              ) *
              height) /
              2,
          player.speed * (world.input.left ? -1 : world.input.right ? 1 : 0),
          playerSegment.p2.world.y - playerSegment.p1.world.y,
        );
      }
    }
  }

  if (speedEl) {
    speedEl.textContent = String(5 * Math.round(player.speed / 500));
  }
  if (timerEl) {
    timerEl.textContent = formatTime(world.currentLapTime);
  }
};

const frame = () => {
  const now = Util.timestamp();
  const dt = Math.min(1, (now - last) / 1000);
  gdt += dt;

  while (gdt > step) {
    gdt -= step;
    update(world, step);
  }

  render();
  last = now;
  requestAnimationFrame(frame);
};

document.addEventListener("keydown", (ev) => handleKeyDown(world, ev.keyCode));
document.addEventListener("keyup", (ev) => handleKeyUp(world, ev.keyCode));

canvas.width = world.config.width;
canvas.height = world.config.height;

loadImages(["background", "sprites"])
  .then(([bg, sp]) => {
    background = bg ?? null;
    sprites = sp ?? null;
    frame();
  })
  .catch((err) => {
    console.error("Failed to load images:", err);
    frame();
  });
