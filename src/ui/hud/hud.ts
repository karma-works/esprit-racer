import type { TimeChallengeState } from "../../game/modes/time-challenge";
import {
  formatTimeDisplay,
  formatScore,
} from "../../game/modes/time-challenge";

const COLORS = {
  background: "rgba(0, 0, 0, 0.75)",
  backgroundLight: "rgba(0, 0, 0, 0.6)",
  timer: "#ffcc00",
  timerLow: "#ff4444",
  score: "#00ff88",
  lap: "#00ccff",
  speed: "#ffffff",
  barBg: "#333333",
  barGreen: "#22c55e",
  barRed: "#ef4444",
  barYellow: "#eab308",
  position: "#ffffff",
  boost: "#06b6d4",
  mirrorBg: "#1a3d1a",
  mirrorRoad: "#444444",
  mirrorLine: "#666666",
};

export interface HudConfig {
  width: number;
  height: number;
}

export interface MirrorCar {
  offset: number;
  distance: number;
  color: string;
}

export interface HudState {
  speed: number;
  maxSpeed: number;
  position: number;
  totalPositions: number;
  boostMeter: number;
  mirrorCars: MirrorCar[];
}

const DEFAULT_HUD_STATE: HudState = {
  speed: 0,
  maxSpeed: 300,
  position: 1,
  totalPositions: 4,
  boostMeter: 1,
  mirrorCars: [],
};

export const getPositionSuffix = (pos: number): string => {
  if (pos === 1) return "ST";
  if (pos === 2) return "ND";
  if (pos === 3) return "RD";
  return "TH";
};

const drawBlockyText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = "left",
): void => {
  ctx.font = `bold ${size}px "Courier New", monospace`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "top";

  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  const offsetX = align === "right" ? -2 : 2;
  ctx.fillText(text, x + offsetX, y + 2);

  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
};

const renderRearViewMirror = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  mirrorCars: MirrorCar[],
): void => {
  ctx.fillStyle = COLORS.backgroundLight;
  ctx.fillRect(x - 2, y - 2, width + 4, height + 4);

  ctx.strokeStyle = "#888888";
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);

  ctx.fillStyle = COLORS.mirrorBg;
  ctx.fillRect(x, y, width, height);

  const roadCenterX = x + width / 2;
  const roadTop = y + 8;
  const roadBottom = y + height - 16;
  const roadWidth = width * 0.85;

  ctx.fillStyle = COLORS.mirrorRoad;
  ctx.beginPath();
  ctx.moveTo(roadCenterX - roadWidth * 0.3, roadTop);
  ctx.lineTo(roadCenterX + roadWidth * 0.3, roadTop);
  ctx.lineTo(roadCenterX + roadWidth * 0.5, roadBottom);
  ctx.lineTo(roadCenterX - roadWidth * 0.5, roadBottom);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = COLORS.mirrorLine;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(roadCenterX, roadTop);
  ctx.lineTo(roadCenterX, roadBottom);
  ctx.stroke();
  ctx.setLineDash([]);

  const sortedCars = [...mirrorCars].sort((a, b) => b.distance - a.distance);

  for (const car of sortedCars) {
    const perspectiveScale = 0.4 + (1 - car.distance) * 0.6;
    const carX = roadCenterX + car.offset * roadWidth * 0.4 * perspectiveScale;
    const carY = roadTop + (roadBottom - roadTop) * (1 - car.distance * 0.8);
    const carW = 16 * perspectiveScale;
    const carH = 10 * perspectiveScale;

    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(carX - carW / 2 + 1, carY - carH / 2 + 1, carW, carH);

    ctx.fillStyle = car.color;
    ctx.fillRect(carX - carW / 2, carY - carH / 2, carW, carH);

    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fillRect(carX - carW / 2, carY - carH / 2, carW, carH * 0.3);
  }

  ctx.font = '10px "Courier New", monospace';
  ctx.fillStyle = "#666666";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("◀ REAR VIEW ▶", x + width / 2, y + height - 2);
};

const renderSpeedPanel = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  speed: number,
  maxSpeed: number,
): void => {
  const panelWidth = 180;
  const panelHeight = 80;

  ctx.fillStyle = COLORS.background;
  ctx.fillRect(x, y, panelWidth, panelHeight);
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, panelWidth, panelHeight);

  const speedKmh = Math.round(speed);
  const percent = speed / maxSpeed;

  drawBlockyText(
    ctx,
    `${speedKmh.toString().padStart(3, "0")} KMH`,
    x + 15,
    y + 10,
    24,
    COLORS.speed,
  );

  const barX = x + 15;
  const barY = y + 45;
  const barWidth = panelWidth - 30;
  const barHeight = 14;

  ctx.fillStyle = COLORS.barBg;
  ctx.fillRect(barX, barY, barWidth, barHeight);

  const fillColor =
    percent > 0.8
      ? COLORS.barRed
      : percent > 0.5
        ? COLORS.barYellow
        : COLORS.barGreen;
  const fillWidth = Math.max(0, Math.min(1, percent)) * barWidth;
  ctx.fillStyle = fillColor;
  ctx.fillRect(barX, barY, fillWidth, barHeight);

  ctx.strokeStyle = "#666";
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  for (let i = 1; i < 4; i++) {
    const lineX = barX + (barWidth / 4) * i;
    ctx.beginPath();
    ctx.moveTo(lineX, barY);
    ctx.lineTo(lineX, barY + barHeight);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.stroke();
  }
};

const renderPositionPanel = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  position: number,
  totalPositions: number,
): void => {
  const panelWidth = 120;
  const panelHeight = 80;

  ctx.fillStyle = COLORS.background;
  ctx.fillRect(x, y, panelWidth, panelHeight);
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, panelWidth, panelHeight);

  const posText = `${position}${getPositionSuffix(position)}`;
  const posColor = position === 1 ? COLORS.barYellow : COLORS.position;

  ctx.font = `bold 48px "Courier New", monospace`;
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(posText, x + panelWidth / 2 + 2, y + 8);

  ctx.fillStyle = posColor;
  ctx.fillText(posText, x + panelWidth / 2, y + 6);

  ctx.font = '14px "Courier New", monospace';
  ctx.fillStyle = "#888888";
  ctx.fillText(`OF ${totalPositions}`, x + panelWidth / 2, y + 58);
};

const renderTimerPanel = (
  ctx: CanvasRenderingContext2D,
  state: TimeChallengeState,
  x: number,
  y: number,
): void => {
  const panelWidth = 160;
  const panelHeight = 70;

  ctx.fillStyle = COLORS.background;
  ctx.fillRect(x, y, panelWidth, panelHeight);
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, panelWidth, panelHeight);

  const isRaceMode = state.gameMode === "race";
  const timerColor =
    !isRaceMode && state.currentTime < 10 ? COLORS.timerLow : COLORS.timer;

  drawBlockyText(
    ctx,
    isRaceMode ? "RACE TIME" : "TIME",
    x + 15,
    y + 8,
    14,
    "#888888",
  );
  drawBlockyText(
    ctx,
    formatTimeDisplay(state.currentTime),
    x + 15,
    y + 28,
    28,
    timerColor,
  );
};

const renderScorePanel = (
  ctx: CanvasRenderingContext2D,
  score: number,
  x: number,
  y: number,
): void => {
  const panelWidth = 180;
  const panelHeight = 45;

  ctx.fillStyle = COLORS.background;
  ctx.fillRect(x, y, panelWidth, panelHeight);
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, panelWidth, panelHeight);

  drawBlockyText(ctx, "SCORE", x + 15, y + 8, 14, "#888888");
  drawBlockyText(ctx, formatScore(score), x + 15, y + 24, 18, COLORS.score);
};

const renderLapPanel = (
  ctx: CanvasRenderingContext2D,
  lap: number,
  totalLaps: number,
  x: number,
  y: number,
): void => {
  const panelWidth = 120;
  const panelHeight = 45;

  ctx.fillStyle = COLORS.background;
  ctx.fillRect(x, y, panelWidth, panelHeight);
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, panelWidth, panelHeight);

  drawBlockyText(ctx, "LAP", x + 15, y + 8, 14, "#888888");
  drawBlockyText(ctx, `${lap}/${totalLaps}`, x + 15, y + 24, 18, COLORS.lap);
};

const renderBoostPanel = (
  ctx: CanvasRenderingContext2D,
  boostMeter: number,
  x: number,
  y: number,
): void => {
  const panelWidth = 100;
  const panelHeight = 45;

  ctx.fillStyle = COLORS.background;
  ctx.fillRect(x, y, panelWidth, panelHeight);
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, panelWidth, panelHeight);

  drawBlockyText(ctx, "NITRO", x + 10, y + 8, 12, "#888888");

  const barX = x + 10;
  const barY = y + 26;
  const barWidth = panelWidth - 20;
  const barHeight = 10;

  ctx.fillStyle = COLORS.barBg;
  ctx.fillRect(barX, barY, barWidth, barHeight);

  const fillColor = boostMeter < 0.3 ? COLORS.barRed : COLORS.boost;
  const fillWidth = Math.max(0, Math.min(1, boostMeter)) * barWidth;
  ctx.fillStyle = fillColor;
  ctx.fillRect(barX, barY, fillWidth, barHeight);

  ctx.strokeStyle = "#666";
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barWidth, barHeight);
};

export const renderHud = (
  ctx: CanvasRenderingContext2D,
  state: TimeChallengeState,
  speed: number,
  config: HudConfig,
  hudState: Partial<HudState> = {},
): void => {
  const { width, height } = config;
  const hs = { ...DEFAULT_HUD_STATE, ...hudState, speed };

  const padding = 15;
  const mirrorWidth = 220;
  const mirrorHeight = 100;
  const mirrorX = width / 2 - mirrorWidth / 2;
  const mirrorY = padding;

  renderRearViewMirror(
    ctx,
    mirrorX,
    mirrorY,
    mirrorWidth,
    mirrorHeight,
    hs.mirrorCars,
  );

  const leftColumnX = padding;
  const rightColumnX = width - padding;
  const row1Y = mirrorY + mirrorHeight + 15;
  const row2Y = row1Y + 90;
  const row3Y = row2Y + 55;

  renderSpeedPanel(ctx, leftColumnX, row1Y, hs.speed, hs.maxSpeed);
  renderPositionPanel(ctx, leftColumnX, row2Y, hs.position, hs.totalPositions);

  renderTimerPanel(ctx, state, rightColumnX - 160, row1Y);
  renderScorePanel(ctx, state.score, rightColumnX - 180, row2Y);
  renderLapPanel(ctx, state.lap, state.totalLaps, rightColumnX - 120, row3Y);
};

export const renderPauseOverlay = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
): void => {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.font = 'bold 48px "Courier New", monospace';
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("PAUSED", canvasWidth / 2, canvasHeight / 2 - 40);

  ctx.font = '24px "Courier New", monospace';
  ctx.fillStyle = "#888888";
  ctx.fillText("Press P to resume", canvasWidth / 2, canvasHeight / 2 + 20);

  ctx.fillStyle = "#666666";
  ctx.fillText(
    "Press F for fullscreen",
    canvasWidth / 2,
    canvasHeight / 2 + 55,
  );
};

export const renderCountdown = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  count: number,
): void => {
  const text = count > 0 ? count.toString() : "GO!";
  const color = count > 0 ? "#ffcc00" : "#00ff88";

  ctx.font = 'bold 96px "Courier New", monospace';
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
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
  ctx.font = 'bold 32px "Courier New", monospace';
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
  ctx.font = 'bold 36px "Courier New", monospace';
  ctx.fillStyle = "#00ccff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`LAP ${lap} COMPLETE!`, canvasWidth / 2, y);
};

export interface SplitScreenHudConfig {
  width: number;
  height: number;
  x: number;
  y: number;
  playerIndex: number;
}

export const renderSplitScreenHud = (
  ctx: CanvasRenderingContext2D,
  state: TimeChallengeState,
  speed: number,
  config: SplitScreenHudConfig,
  hudState: Partial<HudState> = {},
): void => {
  const { width, height, x: viewportX, y: viewportY } = config;
  const hs = { ...DEFAULT_HUD_STATE, ...hudState, speed };

  ctx.save();
  ctx.translate(viewportX, viewportY);

  const scaleX = width / 1024;
  const scaleY = height / 768;
  const scale = Math.min(scaleX, scaleY);

  const padding = Math.max(8, 15 * scale);
  const mirrorWidth = Math.max(110, 220 * scale);
  const mirrorHeight = Math.max(50, 100 * scale);
  const mirrorX = width / 2 - mirrorWidth / 2;
  const mirrorY = padding;

  renderRearViewMirror(
    ctx,
    mirrorX,
    mirrorY,
    mirrorWidth,
    mirrorHeight,
    hs.mirrorCars,
  );

  const leftColumnX = padding;
  const rightColumnX = width - padding;
  const row1Y = mirrorY + mirrorHeight + padding;
  const row2Y = row1Y + 90 * scale;
  const row3Y = row2Y + 55 * scale;

  const speedPanelWidth = Math.max(100, 180 * scale);
  const speedPanelHeight = Math.max(45, 80 * scale);
  renderCompactSpeedPanel(
    ctx,
    leftColumnX,
    row1Y,
    speedPanelWidth,
    speedPanelHeight,
    hs.speed,
    hs.maxSpeed,
  );

  renderCompactPositionPanel(
    ctx,
    leftColumnX,
    row2Y,
    Math.max(70, 120 * scale),
    Math.max(45, 80 * scale),
    hs.position,
    hs.totalPositions,
  );

  renderCompactTimerPanel(
    ctx,
    state,
    rightColumnX - Math.max(80, 160 * scale),
    row1Y,
    Math.max(80, 160 * scale),
    Math.max(40, 70 * scale),
  );

  renderCompactLapPanel(
    ctx,
    state.lap,
    state.totalLaps,
    rightColumnX - Math.max(60, 120 * scale),
    row2Y,
    Math.max(60, 120 * scale),
    Math.max(30, 45 * scale),
  );

  ctx.restore();
};

const renderCompactSpeedPanel = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  panelWidth: number,
  panelHeight: number,
  speed: number,
  maxSpeed: number,
): void => {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(x, y, panelWidth, panelHeight);
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, panelWidth, panelHeight);

  const speedKmh = Math.round(speed);
  const percent = speed / maxSpeed;
  const fontSize = Math.max(14, panelHeight * 0.35);

  drawBlockyText(
    ctx,
    `${speedKmh.toString().padStart(3, "0")}`,
    x + panelWidth * 0.5,
    y + panelHeight * 0.25,
    fontSize,
    COLORS.speed,
    "center",
  );

  const barX = x + panelWidth * 0.1;
  const barY = y + panelHeight * 0.6;
  const barWidth = panelWidth * 0.8;
  const barHeight = panelHeight * 0.2;

  ctx.fillStyle = COLORS.barBg;
  ctx.fillRect(barX, barY, barWidth, barHeight);

  const fillColor =
    percent > 0.8
      ? COLORS.barRed
      : percent > 0.5
        ? COLORS.barYellow
        : COLORS.barGreen;
  const fillWidth = Math.max(0, Math.min(1, percent)) * barWidth;
  ctx.fillStyle = fillColor;
  ctx.fillRect(barX, barY, fillWidth, barHeight);

  ctx.strokeStyle = "#666";
  ctx.strokeRect(barX, barY, barWidth, barHeight);
};

const renderCompactPositionPanel = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  panelWidth: number,
  panelHeight: number,
  position: number,
  totalPositions: number,
): void => {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(x, y, panelWidth, panelHeight);
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, panelWidth, panelHeight);

  const posText = `${position}${getPositionSuffix(position)}`;
  const posColor = position === 1 ? COLORS.barYellow : COLORS.position;
  const fontSize = Math.max(18, panelHeight * 0.5);

  ctx.font = `bold ${fontSize}px "Courier New", monospace`;
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(posText, x + panelWidth / 2 + 2, y + 8);

  ctx.fillStyle = posColor;
  ctx.fillText(posText, x + panelWidth / 2, y + 6);

  const labelFontSize = Math.max(10, panelHeight * 0.2);
  ctx.font = `${labelFontSize}px "Courier New", monospace`;
  ctx.fillStyle = "#888888";
  ctx.fillText(
    `OF ${totalPositions}`,
    x + panelWidth / 2,
    y + panelHeight - labelFontSize - 5,
  );
};

const renderCompactTimerPanel = (
  ctx: CanvasRenderingContext2D,
  state: TimeChallengeState,
  x: number,
  y: number,
  panelWidth: number,
  panelHeight: number,
): void => {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(x, y, panelWidth, panelHeight);
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, panelWidth, panelHeight);

  const isRaceMode = state.gameMode === "race";
  const timerColor =
    !isRaceMode && state.currentTime < 10 ? COLORS.timerLow : COLORS.timer;
  const fontSize = Math.max(12, panelHeight * 0.45);

  drawBlockyText(
    ctx,
    isRaceMode ? "RACE TIME" : "TIME",
    x + panelWidth * 0.1,
    y + panelHeight * 0.1,
    fontSize * 0.5,
    "#888888",
  );
  drawBlockyText(
    ctx,
    formatTimeDisplay(state.currentTime),
    x + panelWidth * 0.1,
    y + panelHeight * 0.4,
    fontSize,
    timerColor,
  );
};

const renderCompactLapPanel = (
  ctx: CanvasRenderingContext2D,
  lap: number,
  totalLaps: number,
  x: number,
  y: number,
  panelWidth: number,
  panelHeight: number,
): void => {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(x, y, panelWidth, panelHeight);
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, panelWidth, panelHeight);

  const fontSize = Math.max(12, panelHeight * 0.5);

  drawBlockyText(
    ctx,
    "LAP",
    x + panelWidth * 0.1,
    y + panelHeight * 0.1,
    fontSize * 0.5,
    "#888888",
  );
  drawBlockyText(
    ctx,
    `${lap}/${totalLaps}`,
    x + panelWidth * 0.1,
    y + panelHeight * 0.4,
    fontSize,
    COLORS.lap,
  );
};

export const createDefaultHudState = (): HudState => ({ ...DEFAULT_HUD_STATE });

export type { HudState as HudStateType };
