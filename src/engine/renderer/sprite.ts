import type { CachedSprite } from "../../assets/svg-loader";
import { SPRITE_SCALE } from "../constants";

export const svgSprite = (
  ctx: CanvasRenderingContext2D,
  cachedSprite: CachedSprite,
  canvasWidth: number,
  roadWidth: number,
  scale: number,
  destX: number,
  destY: number,
  offsetX: number = 0,
  offsetY: number = 0,
  clipY: number = 0,
): void => {
  const aspectRatio = cachedSprite.width / cachedSprite.height;
  const baseWidth = 80;
  const baseHeight = baseWidth / aspectRatio;

  const destW =
    ((baseWidth * scale * canvasWidth) / 2) * (SPRITE_SCALE * roadWidth);
  const destH =
    ((baseHeight * scale * canvasWidth) / 2) * (SPRITE_SCALE * roadWidth);

  const finalX = destX + destW * offsetX;
  const finalY = destY + destH * offsetY;

  const clipH = clipY > 0 ? Math.max(0, finalY + destH - clipY) : 0;
  if (clipH < destH) {
    const srcH = cachedSprite.height * (1 - clipH / destH);
    ctx.drawImage(
      cachedSprite.canvas,
      0,
      0,
      cachedSprite.width,
      srcH,
      finalX,
      finalY,
      destW,
      destH - clipH,
    );
  }
};

export const svgPlayer = (
  ctx: CanvasRenderingContext2D,
  cachedSprite: CachedSprite,
  canvasWidth: number,
  canvasHeight: number,
  roadWidth: number,
  speedPercent: number,
  scale: number,
  destX: number,
  destY: number,
  steer: number,
  bounce: number,
): void => {
  const aspectRatio = cachedSprite.width / cachedSprite.height;
  const baseWidth = 80;
  const baseHeight = baseWidth / aspectRatio;

  const destW =
    ((baseWidth * scale * canvasWidth) / 2) * (SPRITE_SCALE * roadWidth);
  const destH =
    ((baseHeight * scale * canvasWidth) / 2) * (SPRITE_SCALE * roadWidth);

  const finalX = destX - destW / 2;
  const finalY = destY - destH + bounce;

  ctx.drawImage(cachedSprite.canvas, finalX, finalY, destW, destH);
};

export const svgBackground = (
  ctx: CanvasRenderingContext2D,
  cachedSprite: CachedSprite,
  canvasWidth: number,
  canvasHeight: number,
  rotation: number = 0,
  yOffset: number = 0,
): void => {
  const spriteW = cachedSprite.width;
  const spriteH = cachedSprite.height;

  const sourceX = Math.floor(spriteW * rotation) % spriteW;
  const sourceW = Math.min(spriteW / 2, spriteW - sourceX);

  const destW = Math.floor(canvasWidth * (sourceW / (spriteW / 2)));
  const destH = canvasHeight;

  ctx.drawImage(
    cachedSprite.canvas,
    sourceX,
    0,
    sourceW,
    spriteH,
    0,
    yOffset,
    destW,
    destH,
  );

  if (sourceW < spriteW / 2) {
    const remainingW = spriteW / 2 - sourceW;
    const remainingDestW = canvasWidth - destW;
    ctx.drawImage(
      cachedSprite.canvas,
      0,
      0,
      remainingW,
      spriteH,
      destW - 1,
      yOffset,
      remainingDestW,
      destH,
    );
  }
};
