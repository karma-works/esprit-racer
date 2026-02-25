import type { TimeChallengeState } from "../../game/modes/time-challenge";
import {
  formatTimeDisplay,
  formatScore,
} from "../../game/modes/time-challenge";

const COLORS = {
  background: "rgba(0, 0, 0, 0.7)",
  timer: "#ffcc00",
  timerLow: "#ff4444",
  score: "#00ff88",
  lap: "#00ccff",
  speed: "#ffffff",
};

export interface HudConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const renderHud = (
  ctx: CanvasRenderingContext2D,
  state: TimeChallengeState,
  speed: number,
  config: HudConfig,
): void => {
  const { x, y, width } = config;
  const padding = 15;
  const lineHeight = 28;

  ctx.fillStyle = COLORS.background;
  ctx.fillRect(x, y, width, 120);

  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, 120);

  const timerColor = state.currentTime < 10 ? COLORS.timerLow : COLORS.timer;
  ctx.font = "bold 32px monospace";
  ctx.fillStyle = timerColor;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(
    `TIME: ${formatTimeDisplay(state.currentTime)}`,
    x + padding,
    y + padding,
  );

  ctx.font = "bold 24px monospace";
  ctx.fillStyle = COLORS.score;
  ctx.fillText(
    `SCORE: ${formatScore(state.score)}`,
    x + padding,
    y + padding + lineHeight,
  );

  ctx.fillStyle = COLORS.lap;
  ctx.fillText(
    `LAP: ${state.lap}/${state.totalLaps}`,
    x + padding,
    y + padding + lineHeight * 2,
  );

  ctx.fillStyle = COLORS.speed;
  ctx.textAlign = "right";
  ctx.font = "bold 28px monospace";
  ctx.fillText(`${Math.round(speed)} km/h`, x + width - padding, y + padding);
};

export const renderPauseOverlay = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
): void => {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.font = "bold 48px monospace";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("PAUSED", canvasWidth / 2, canvasHeight / 2 - 30);

  ctx.font = "24px monospace";
  ctx.fillStyle = "#888888";
  ctx.fillText("Press P to resume", canvasWidth / 2, canvasHeight / 2 + 30);
};

export const renderCountdown = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  count: number,
): void => {
  const text = count > 0 ? count.toString() : "GO!";
  const color = count > 0 ? "#ffcc00" : "#00ff88";

  ctx.font = "bold 96px monospace";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fillText(text, canvasWidth / 2 + 4, canvasHeight / 2 + 4);

  ctx.fillStyle = color;
  ctx.fillText(text, canvasWidth / 2, canvasHeight / 2);
};

export const renderCheckpointBonus = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  y: number,
  bonus: number,
): void => {
  ctx.font = "bold 32px monospace";
  ctx.fillStyle = "#00ff88";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`+${bonus} TIME BONUS!`, canvasWidth / 2, y);
};

export const renderLapComplete = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  y: number,
  lap: number,
): void => {
  ctx.font = "bold 36px monospace";
  ctx.fillStyle = "#00ccff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`LAP ${lap} COMPLETE!`, canvasWidth / 2, y);
};
