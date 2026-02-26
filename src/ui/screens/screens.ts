import type {
  TimeChallengeState,
  GameScreen,
} from "../../game/modes/time-challenge";
import { globalSpriteCache } from "../../assets/svg-loader";

export interface UIScreen {
  render(ctx: CanvasRenderingContext2D, state: TimeChallengeState): void;
  handleClick?(x: number, y: number): string | null;
  handleKeyDown?(keyCode: number): string | null;
  handleMouseMove?(x: number, y: number): void;
  getZones?(): MenuZone[];
}

export interface Button {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  action: string;
}

export interface MenuZone {
  x: number;
  y: number;
  width: number;
  height: number;
  action: string;
  row: number;
  col: number;
}

const COLORS = {
  background: "#1a1a2e",
  panel: "#16213e",
  accent: "#0f3460",
  highlight: "#e94560",
  text: "#eaeaea",
  textDim: "#888888",
  timer: "#ffcc00",
  score: "#00ff88",
  selection: "#e53935",
};

export const drawPanel = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
): void => {
  ctx.fillStyle = COLORS.panel;
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = COLORS.accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);
};

export const drawButton = (
  ctx: CanvasRenderingContext2D,
  button: Button,
  isHovered: boolean = false,
): void => {
  ctx.fillStyle = isHovered ? COLORS.highlight : COLORS.accent;
  ctx.fillRect(button.x, button.y, button.width, button.height);

  ctx.strokeStyle = COLORS.text;
  ctx.lineWidth = 1;
  ctx.strokeRect(button.x, button.y, button.width, button.height);

  ctx.fillStyle = COLORS.text;
  ctx.font = "bold 18px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    button.label,
    button.x + button.width / 2,
    button.y + button.height / 2,
  );
};

export const drawText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: {
    font?: string;
    color?: string;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
  } = {},
): void => {
  const {
    font = "16px monospace",
    color = COLORS.text,
    align = "left",
    baseline = "top",
  } = options;

  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, x, y);
};

export const drawCenteredText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  options: {
    font?: string;
    color?: string;
  } = {},
): void => {
  drawText(ctx, text, centerX, y, { ...options, align: "center" });
};

const drawSelectionBox = (
  ctx: CanvasRenderingContext2D,
  zone: MenuZone,
): void => {
  ctx.strokeStyle = COLORS.selection;
  ctx.lineWidth = 5;
  ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);

  ctx.shadowColor = COLORS.selection;
  ctx.shadowBlur = 10;
  ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
  ctx.shadowBlur = 0;
};

const MAIN_MENU_ZONES: Array<{
  svgX: number;
  svgY: number;
  svgW: number;
  svgH: number;
  action: string;
  row: number;
  col: number;
}> = [
  {
    svgX: 30,
    svgY: 40,
    svgW: 180,
    svgH: 80,
    action: "player1",
    row: 0,
    col: 0,
  },
  { svgX: 230, svgY: 40, svgW: 340, svgH: 80, action: "start", row: 0, col: 1 },
  {
    svgX: 590,
    svgY: 40,
    svgW: 180,
    svgH: 80,
    action: "player2",
    row: 0,
    col: 2,
  },
  {
    svgX: 30,
    svgY: 140,
    svgW: 180,
    svgH: 90,
    action: "gears-p1",
    row: 1,
    col: 0,
  },
  { svgX: 230, svgY: 140, svgW: 340, svgH: 90, action: "game", row: 1, col: 1 },
  {
    svgX: 590,
    svgY: 140,
    svgW: 180,
    svgH: 90,
    action: "gears-p2",
    row: 1,
    col: 2,
  },
  {
    svgX: 30,
    svgY: 250,
    svgW: 180,
    svgH: 90,
    action: "accel-p1",
    row: 2,
    col: 0,
  },
  {
    svgX: 230,
    svgY: 250,
    svgW: 340,
    svgH: 90,
    action: "course",
    row: 2,
    col: 1,
  },
  {
    svgX: 590,
    svgY: 250,
    svgW: 180,
    svgH: 90,
    action: "accel-p2",
    row: 2,
    col: 2,
  },
  {
    svgX: 30,
    svgY: 360,
    svgW: 240,
    svgH: 80,
    action: "control",
    row: 3,
    col: 0,
  },
  {
    svgX: 290,
    svgY: 360,
    svgW: 260,
    svgH: 80,
    action: "players",
    row: 3,
    col: 1,
  },
  {
    svgX: 570,
    svgY: 360,
    svgW: 200,
    svgH: 80,
    action: "sound",
    row: 3,
    col: 2,
  },
  {
    svgX: 30,
    svgY: 460,
    svgW: 240,
    svgH: 80,
    action: "constructor",
    row: 4,
    col: 0,
  },
  { svgX: 290, svgY: 460, svgW: 260, svgH: 80, action: "code", row: 4, col: 1 },
  {
    svgX: 570,
    svgY: 460,
    svgW: 200,
    svgH: 80,
    action: "define",
    row: 4,
    col: 2,
  },
];

const NAVIGABLE_ZONES = [
  "start",
  "game",
  "course",
  "control",
  "players",
  "sound",
  "constructor",
  "code",
  "define",
];

export class MainMenuScreen implements UIScreen {
  private buttons: Button[];
  private zones: MenuZone[];
  private selectedIndex: number = 0;

  constructor(
    private width: number,
    private height: number,
  ) {
    this.buttons = [];
    this.zones = this.calculateZones();
    this.selectedIndex = this.zones.findIndex((z) =>
      NAVIGABLE_ZONES.includes(z.action),
    );
    if (this.selectedIndex < 0) this.selectedIndex = 0;
  }

  private calculateZones(): MenuZone[] {
    const scaleX = this.width / 800;
    const scaleY = this.height / 600;

    return MAIN_MENU_ZONES.map((z) => ({
      x: z.svgX * scaleX,
      y: z.svgY * scaleY,
      width: z.svgW * scaleX,
      height: z.svgH * scaleY,
      action: z.action,
      row: z.row,
      col: z.col,
    }));
  }

  render(ctx: CanvasRenderingContext2D, state: TimeChallengeState): void {
    const scale = this.width / 800;
    const menuSvg = globalSpriteCache.get("main-menu.svg", scale);
    if (menuSvg) {
      ctx.drawImage(menuSvg.canvas, 0, 0, this.width, this.height);
    } else {
      ctx.fillStyle = "#1a1c20";
      ctx.fillRect(0, 0, this.width, this.height);
      drawCenteredText(ctx, "LOADING...", this.width / 2, this.height / 2, {
        font: "bold 32px monospace",
        color: "#a0a0a0",
      });
      return;
    }

    const selectedZone = this.zones[this.selectedIndex];
    if (selectedZone) {
      drawSelectionBox(ctx, selectedZone);
    }
  }

  private findZoneIndex(x: number, y: number): number {
    return this.zones.findIndex(
      (z) => x >= z.x && x <= z.x + z.width && y >= z.y && y <= z.y + z.height,
    );
  }

  handleClick(x: number, y: number): string | null {
    const idx = this.findZoneIndex(x, y);
    if (idx >= 0) {
      const zone = this.zones[idx];
      if (zone) return zone.action;
    }
    return null;
  }

  handleMouseMove(x: number, y: number): void {
    const idx = this.findZoneIndex(x, y);
    const zone = this.zones[idx];
    if (idx >= 0 && zone && NAVIGABLE_ZONES.includes(zone.action)) {
      this.selectedIndex = idx;
    }
  }

  handleKeyDown(keyCode: number): string | null {
    const currentZone = this.zones[this.selectedIndex];
    if (!currentZone) return null;

    const { UP, DOWN, LEFT, RIGHT, SPACE } = {
      UP: 38,
      DOWN: 40,
      LEFT: 37,
      RIGHT: 39,
      SPACE: 32,
    };

    if (keyCode === SPACE || keyCode === 13) {
      return currentZone.action;
    }

    let candidates: MenuZone[] = [];

    if (keyCode === UP) {
      candidates = this.zones.filter(
        (z) => NAVIGABLE_ZONES.includes(z.action) && z.row < currentZone.row,
      );
    } else if (keyCode === DOWN) {
      candidates = this.zones.filter(
        (z) => NAVIGABLE_ZONES.includes(z.action) && z.row > currentZone.row,
      );
    } else if (keyCode === LEFT) {
      candidates = this.zones.filter(
        (z) =>
          NAVIGABLE_ZONES.includes(z.action) &&
          z.col < currentZone.col &&
          z.row === currentZone.row,
      );
    } else if (keyCode === RIGHT) {
      candidates = this.zones.filter(
        (z) =>
          NAVIGABLE_ZONES.includes(z.action) &&
          z.col > currentZone.col &&
          z.row === currentZone.row,
      );
    }

    if (candidates.length > 0) {
      if (keyCode === UP || keyCode === LEFT) {
        candidates.sort((a, b) =>
          keyCode === UP ? b.row - a.row : b.col - a.col,
        );
      } else {
        candidates.sort((a, b) =>
          keyCode === DOWN ? a.row - b.row : a.col - b.col,
        );
      }
      const firstCandidate = candidates[0];
      if (firstCandidate) {
        const newIdx = this.zones.indexOf(firstCandidate);
        if (newIdx >= 0) {
          this.selectedIndex = newIdx;
        }
      }
    }

    return null;
  }

  getZones(): MenuZone[] {
    return this.zones;
  }

  getButtons(): Button[] {
    return this.buttons;
  }
}

const MUSIC_CHANNELS = [
  { id: "channel1", name: "LOTUS III TITLE" },
  { id: "channel2", name: "ESPRIT TURBO" },
  { id: "channel3", name: "ESPRIT SE" },
];

export class MusicSelectionScreen implements UIScreen {
  private selectedIndex: number = 0;

  constructor(
    private width: number,
    private height: number,
  ) {}

  getSelectedChannel(): string {
    return MUSIC_CHANNELS[this.selectedIndex]?.id ?? "channel1";
  }

  render(ctx: CanvasRenderingContext2D, state: TimeChallengeState): void {
    const scale = this.width / 800;
    const musicSvg = globalSpriteCache.get("music-selection.svg", scale);
    if (musicSvg) {
      ctx.drawImage(musicSvg.canvas, 0, 0, this.width, this.height);
    } else {
      ctx.fillStyle = "#d2b48c";
      ctx.fillRect(0, 0, this.width, this.height);
    }

    const currentChannel = MUSIC_CHANNELS[this.selectedIndex];
    if (currentChannel) {
      const centerX = this.width / 2;
      const displayY = 110 * (this.height / 600);

      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(centerX - 200, displayY - 30, 400, 50);

      ctx.font = `bold ${28 * (this.height / 600)}px monospace`;
      ctx.fillStyle = "#ff8c00";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "#ff8c00";
      ctx.shadowBlur = 10;
      ctx.fillText(currentChannel.name, centerX, displayY);
      ctx.shadowBlur = 0;
    }

    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(this.width / 2 - 160, this.height - 80, 320, 40);
    ctx.font = `bold ${16 * (this.height / 600)}px monospace`;
    ctx.fillStyle = "#ff8c00";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      "LEFT/RIGHT: SELECT   SPACE/ENTER: START",
      this.width / 2,
      this.height - 60,
    );
  }

  handleClick(_x: number, _y: number): string | null {
    return "start_game";
  }

  handleKeyDown(keyCode: number): string | null {
    const { LEFT, RIGHT, SPACE } = {
      LEFT: 37,
      RIGHT: 39,
      SPACE: 32,
    };

    if (keyCode === SPACE || keyCode === 13) {
      return "start_game";
    }

    if (keyCode === LEFT) {
      this.selectedIndex =
        (this.selectedIndex - 1 + MUSIC_CHANNELS.length) %
        MUSIC_CHANNELS.length;
    } else if (keyCode === RIGHT) {
      this.selectedIndex = (this.selectedIndex + 1) % MUSIC_CHANNELS.length;
    }

    return null;
  }

  handleMouseMove(_x: number, _y: number): void {}

  getZones(): MenuZone[] {
    return [];
  }
}

export class ResultsScreen implements UIScreen {
  constructor(
    private width: number,
    private height: number,
  ) {}

  render(ctx: CanvasRenderingContext2D, state: TimeChallengeState): void {
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;

    drawCenteredText(
      ctx,
      state.isGameOver ? "GAME OVER" : "RACE COMPLETE",
      centerX,
      100,
      {
        font: "bold 36px monospace",
        color: state.isGameOver ? COLORS.highlight : COLORS.score,
      },
    );

    drawPanel(ctx, centerX - 150, 160, 300, 200);

    drawCenteredText(ctx, state.playerName, centerX, 180, {
      font: "bold 24px monospace",
    });

    drawCenteredText(
      ctx,
      `SCORE: ${state.score.toString().padStart(6, "0")}`,
      centerX,
      230,
      {
        font: "28px monospace",
        color: COLORS.score,
      },
    );

    drawCenteredText(
      ctx,
      `LAPS: ${state.lap - 1}/${state.totalLaps}`,
      centerX,
      280,
      {
        font: "20px monospace",
        color: COLORS.textDim,
      },
    );

    if (state.bestScore !== null && state.score >= state.bestScore) {
      drawCenteredText(ctx, "NEW RECORD!", centerX, 330, {
        font: "bold 24px monospace",
        color: COLORS.timer,
      });
    }

    drawCenteredText(
      ctx,
      "PRESS SPACE TO CONTINUE",
      centerX,
      this.height - 80,
      {
        font: "18px monospace",
        color: COLORS.textDim,
      },
    );
  }
}

export const createScreens = (
  width: number,
  height: number,
): Map<GameScreen, UIScreen> => {
  const screens = new Map<GameScreen, UIScreen>();
  screens.set("main-menu", new MainMenuScreen(width, height));
  screens.set("music-select", new MusicSelectionScreen(width, height));
  screens.set("results", new ResultsScreen(width, height));
  return screens;
};
