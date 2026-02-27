import type { Sprite, BackgroundLayer, SegmentColor, Segment } from "../types";
import { COLORS, SPRITES, SPRITE_SCALE } from "../constants";
import * as Util from "../utils/math";

export const polygon = (
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number,
  color: string,
): void => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.lineTo(x4, y4);
  ctx.closePath();
  ctx.fill();
};

export const rumbleWidth = (
  projectedRoadWidth: number,
  lanes: number,
): number => projectedRoadWidth / Math.max(6, 2 * lanes);

export const laneMarkerWidth = (
  projectedRoadWidth: number,
  lanes: number,
): number => projectedRoadWidth / Math.max(32, 8 * lanes);

export const segment = (
  ctx: CanvasRenderingContext2D,
  width: number,
  lanes: number,
  x1: number,
  y1: number,
  w1: number,
  x2: number,
  y2: number,
  w2: number,
  fog: number,
  color: SegmentColor,
): void => {
  const r1 = rumbleWidth(w1, lanes);
  const r2 = rumbleWidth(w2, lanes);
  const l1 = laneMarkerWidth(w1, lanes);
  const l2 = laneMarkerWidth(w2, lanes);

  ctx.fillStyle = color.grass;
  ctx.fillRect(0, y2, width, y1 - y2);

  polygon(
    ctx,
    x1 - w1 - r1,
    y1,
    x1 - w1,
    y1,
    x2 - w2,
    y2,
    x2 - w2 - r2,
    y2,
    color.rumble,
  );
  polygon(
    ctx,
    x1 + w1 + r1,
    y1,
    x1 + w1,
    y1,
    x2 + w2,
    y2,
    x2 + w2 + r2,
    y2,
    color.rumble,
  );
  polygon(ctx, x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, color.road);

  if (color.lane) {
    const lanew1 = (w1 * 2) / lanes;
    const lanew2 = (w2 * 2) / lanes;
    let lanex1 = x1 - w1 + lanew1;
    let lanex2 = x2 - w2 + lanew2;
    for (let lane = 1; lane < lanes; lane++) {
      polygon(
        ctx,
        lanex1 - l1 / 2,
        y1,
        lanex1 + l1 / 2,
        y1,
        lanex2 + l2 / 2,
        y2,
        lanex2 - l2 / 2,
        y2,
        color.lane,
      );
      lanex1 += lanew1;
      lanex2 += lanew2;
    }
  }

  fogLayer(ctx, 0, y1, width, y2 - y1, fog);
};

export const background = (
  ctx: CanvasRenderingContext2D,
  bgImage: HTMLImageElement,
  width: number,
  height: number,
  layer: BackgroundLayer,
  rotation: number = 0,
  offset: number = 0,
): void => {
  const imageW = layer.w / 2;
  const imageH = layer.h;

  const sourceX = layer.x + Math.floor(layer.w * rotation);
  const sourceY = layer.y;
  const sourceW = Math.min(imageW, layer.x + layer.w - sourceX);
  const sourceH = imageH;

  const destX = 0;
  const destY = offset;
  const destW = Math.floor(width * (sourceW / imageW));
  const destH = height;

  ctx.drawImage(
    bgImage,
    sourceX,
    sourceY,
    sourceW,
    sourceH,
    destX,
    destY,
    destW,
    destH,
  );
  if (sourceW < imageW) {
    ctx.drawImage(
      bgImage,
      layer.x,
      sourceY,
      imageW - sourceW,
      sourceH,
      destW - 1,
      destY,
      width - destW,
      destH,
    );
  }
};

export const sprite = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  _resolution: number,
  roadWidth: number,
  spriteSheet: HTMLImageElement,
  spriteData: Sprite,
  scale: number,
  destX: number,
  destY: number,
  offsetX: number = 0,
  offsetY: number = 0,
  clipY: number = 0,
): void => {
  const destW =
    ((spriteData.w * scale * width) / 2) * (SPRITE_SCALE * roadWidth);
  const destH =
    ((spriteData.h * scale * width) / 2) * (SPRITE_SCALE * roadWidth);

  const finalX = destX + destW * offsetX;
  const finalY = destY + destH * offsetY;

  const clipH = clipY > 0 ? Math.max(0, finalY + destH - clipY) : 0;
  if (clipH < destH) {
    ctx.drawImage(
      spriteSheet,
      spriteData.x,
      spriteData.y,
      spriteData.w,
      spriteData.h - (spriteData.h * clipH) / destH,
      finalX,
      finalY,
      destW,
      destH - clipH,
    );
  }
};

export const player = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  resolution: number,
  roadWidth: number,
  spriteSheet: HTMLImageElement,
  speedPercent: number,
  scale: number,
  destX: number,
  destY: number,
  steer: number,
  updown: number,
): void => {
  const bounce =
    1.5 *
    Math.random() *
    speedPercent *
    resolution *
    Util.randomChoice([-1, 1]);
  let spriteData: Sprite;

  if (steer < 0) {
    spriteData = updown > 0 ? SPRITES.PLAYER_UPHILL_LEFT : SPRITES.PLAYER_LEFT;
  } else if (steer > 0) {
    spriteData =
      updown > 0 ? SPRITES.PLAYER_UPHILL_RIGHT : SPRITES.PLAYER_RIGHT;
  } else {
    spriteData =
      updown > 0 ? SPRITES.PLAYER_UPHILL_STRAIGHT : SPRITES.PLAYER_STRAIGHT;
  }

  sprite(
    ctx,
    width,
    height,
    resolution,
    roadWidth,
    spriteSheet,
    spriteData,
    scale,
    destX,
    destY + bounce,
    -0.5,
    -1,
  );
};

export const fogLayer = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fog: number,
  fogColor: string = COLORS.FOG,
): void => {
  if (fog < 1) {
    ctx.globalAlpha = 1 - fog;
    ctx.fillStyle = fogColor;
    ctx.fillRect(x, y, width, height);
    ctx.globalAlpha = 1;
  }
};

export const lightningFlash = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
): void => {
  ctx.globalAlpha = intensity;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;
};

export const renderParticles = (
  ctx: CanvasRenderingContext2D,
  particles: Array<{
    x: number;
    y: number;
    life: number;
    size: number;
    sprite?: string;
    vx: number;
    vy: number;
  }>,
  cachedSprites: Map<string, { canvas: HTMLCanvasElement }>,
): void => {
  for (const p of particles) {
    ctx.globalAlpha = p.life;
    if (p.sprite && cachedSprites.has(p.sprite)) {
      const cached = cachedSprites.get(p.sprite)!;
      ctx.drawImage(
        cached.canvas,
        p.x - p.size,
        p.y - p.size,
        p.size * 2,
        p.size * 2,
      );
    } else {
      ctx.fillStyle = p.sprite?.includes("rain")
        ? "rgba(150,180,220,0.6)"
        : "#ffffff";
      const h = p.sprite?.includes("rain") ? p.size * 4 : p.size;
      ctx.fillRect(p.x, p.y, p.size, h);
    }
    ctx.globalAlpha = 1;
  }
};

export const renderTumbleweed = (
  ctx: CanvasRenderingContext2D,
  tumbleweed: { x: number; y: number; rotation: number; scale: number },
  cachedSprite: { canvas: HTMLCanvasElement } | null,
): void => {
  if (!cachedSprite) return;

  ctx.save();
  ctx.translate(tumbleweed.x, tumbleweed.y);
  ctx.rotate(tumbleweed.rotation);
  const size = 80 * tumbleweed.scale;
  ctx.drawImage(cachedSprite.canvas, -size / 2, -size / 2, size, size);
  ctx.restore();
};

export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
  playerIndex: number;
}

export const renderViewport = (
  ctx: CanvasRenderingContext2D,
  viewport: Viewport,
  renderFn: () => void,
): void => {
  ctx.save();
  ctx.beginPath();
  ctx.rect(viewport.x, viewport.y, viewport.width, viewport.height);
  ctx.clip();

  ctx.translate(viewport.x, viewport.y);

  renderFn();

  ctx.restore();
};

export const drawSplitScreenDivider = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  height: number,
  color: string = "#000000",
  width: number = 4,
): void => {
  ctx.fillStyle = color;
  ctx.fillRect(x - width / 2, y, width, height);
};
