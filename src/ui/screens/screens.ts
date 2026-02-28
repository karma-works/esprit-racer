import type {
  TimeChallengeState,
  GameScreen,
} from "../../game/modes/time-challenge";
import { globalSpriteCache } from "../../assets/svg-loader";
import { isSoundEnabled } from "../../audio/mod-player";
import { CarSelectionScreen } from "./car-selection";
import { DifficultySelectionScreen, ChampionshipStandingsScreen } from "./championship-screens";

export { CarSelectionScreen, DifficultySelectionScreen, ChampionshipStandingsScreen };

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
  private playerCount: 1 | 2 = 1;
  private gameMode: "time" | "race" | "championship" = "time";

  private player1Name: string = "PLAYER 1";
  private player2Name: string = "PLAYER 2";
  private editingPlayer: 0 | 1 | 2 = 0;

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

  getPlayerCount(): 1 | 2 {
    return this.playerCount;
  }

  getPlayer1Name(): string {
    return this.player1Name;
  }

  getPlayer2Name(): string {
    return this.player2Name;
  }

  getGameMode(): "time" | "race" | "championship" {
    return this.gameMode;
  }

  togglePlayerCount(): void {
    this.playerCount = this.playerCount === 1 ? 2 : 1;
  }

  toggleGameMode(): void {
    if (this.gameMode === "time") this.gameMode = "race";
    else if (this.gameMode === "race") this.gameMode = "championship";
    else this.gameMode = "time";
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

    const playersZone = this.zones.find((z) => z.action === "players");
    if (playersZone) {
      const text = this.playerCount === 1 ? "1 PLAYER" : "2 PLAYERS";
      drawCenteredText(
        ctx,
        text,
        playersZone.x + playersZone.width / 2,
        playersZone.y + playersZone.height / 2 - 15 * scale,
        {
          font: `bold ${14 * scale}px monospace`,
          color: "#ffcc00",
        },
      );

      const p1Text = (this.editingPlayer === 1 && Math.floor(Date.now() / 500) % 2 === 0) ? this.player1Name + "_" : this.player1Name;
      drawCenteredText(
        ctx,
        p1Text,
        playersZone.x + playersZone.width / 2,
        playersZone.y + playersZone.height / 2 + 5 * scale,
        {
          font: `bold ${12 * scale}px monospace`,
          color: this.editingPlayer === 1 ? "#ffffff" : "#aaaaaa",
        },
      );

      if (this.playerCount === 2) {
        const p2Text = (this.editingPlayer === 2 && Math.floor(Date.now() / 500) % 2 === 0) ? this.player2Name + "_" : this.player2Name;
        drawCenteredText(
          ctx,
          p2Text,
          playersZone.x + playersZone.width / 2,
          playersZone.y + playersZone.height / 2 + 20 * scale,
          {
            font: `bold ${12 * scale}px monospace`,
            color: this.editingPlayer === 2 ? "#ffffff" : "#aaaaaa",
          },
        );
      }
    }

    // Draw game mode in GAME box
    const gameZone = this.zones.find((z) => z.action === "game");
    if (gameZone) {
      let modeText = "TIME MODE";
      if (this.gameMode === "race") modeText = "RACE MODE";
      if (this.gameMode === "championship") modeText = "CHAMPIONSHIP";

      drawCenteredText(
        ctx,
        modeText,
        gameZone.x + gameZone.width / 2,
        gameZone.y + gameZone.height / 2 + 25 * scale,
        {
          font: `bold ${12 * scale}px monospace`,
          color: "#4caf50",
        },
      );
    }

    // Draw speaker icon based on sound state
    this.drawSpeakerIcon(ctx, scale);
  }

  private drawSpeakerIcon(ctx: CanvasRenderingContext2D, scale: number): void {
    const soundZone = this.zones.find((z) => z.action === "sound");
    if (!soundZone) return;

    const centerX = soundZone.x + soundZone.width / 2;
    const centerY = soundZone.y + soundZone.height / 2 + 10 * scale;
    const size = 30 * scale;

    ctx.save();
    ctx.strokeStyle = "#fdd835";
    ctx.fillStyle = "#fdd835";
    ctx.lineWidth = 3 * scale;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Draw speaker cone (base part)
    ctx.beginPath();
    ctx.moveTo(centerX - size * 0.5, centerY + size * 0.4);
    ctx.lineTo(centerX - size * 0.5, centerY - size * 0.4);
    ctx.lineTo(centerX + size * 0.2, centerY - size * 0.5);
    ctx.lineTo(centerX + size * 0.2, centerY + size * 0.5);
    ctx.closePath();
    ctx.fill();

    // Draw speaker box (back part)
    ctx.fillRect(
      centerX - size * 0.7,
      centerY - size * 0.25,
      size * 0.25,
      size * 0.5,
    );

    if (isSoundEnabled()) {
      // Draw sound waves
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(
        centerX + size * 0.3,
        centerY,
        size * 0.25,
        -Math.PI / 3,
        Math.PI / 3,
      );
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(
        centerX + size * 0.3,
        centerY,
        size * 0.45,
        -Math.PI / 3,
        Math.PI / 3,
      );
      ctx.stroke();
    } else {
      // Draw X (muted)
      ctx.strokeStyle = "#e53935";
      ctx.lineWidth = 4 * scale;
      ctx.beginPath();
      ctx.moveTo(centerX + size * 0.1, centerY - size * 0.35);
      ctx.lineTo(centerX + size * 0.7, centerY + size * 0.35);
      ctx.moveTo(centerX + size * 0.7, centerY - size * 0.35);
      ctx.lineTo(centerX + size * 0.1, centerY + size * 0.35);
      ctx.stroke();

      // Draw "OFF" text
      ctx.fillStyle = "#e53935";
      ctx.font = `bold ${10 * scale}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText("OFF", centerX + size * 0.5, centerY + size * 0.6);
    }

    ctx.restore();
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
      if (zone) {
        if (zone.action === "players") {
          const localY = y - zone.y;
          if (localY < zone.height * 0.4) {
            this.togglePlayerCount();
            this.editingPlayer = 0;
          } else if (localY < zone.height * 0.7) {
            this.editingPlayer = 1;
          } else if (this.playerCount === 2) {
            this.editingPlayer = 2;
          } else {
            this.editingPlayer = 1;
          }
          return null;
        }

        this.editingPlayer = 0;

        if (zone.action === "game") {
          this.toggleGameMode();
          return null;
        }
        return zone.action;
      }
    } else {
      this.editingPlayer = 0;
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
    if (this.editingPlayer > 0) {
      if (keyCode === 13 || keyCode === 27) { // Enter or escape
        this.editingPlayer = 0;
        return null;
      }
      if (keyCode === 8) { // Backspace
        if (this.editingPlayer === 1) this.player1Name = this.player1Name.slice(0, -1);
        if (this.editingPlayer === 2) this.player2Name = this.player2Name.slice(0, -1);
        return null;
      }

      if ((keyCode >= 65 && keyCode <= 90) || keyCode === 32 || (keyCode >= 48 && keyCode <= 57)) {
        const char = String.fromCharCode(keyCode);
        if (this.editingPlayer === 1 && this.player1Name.length < 12) this.player1Name += char;
        if (this.editingPlayer === 2 && this.player2Name.length < 12) this.player2Name += char;
      }
      return null;
    }

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
      if (currentZone.action === "players") {
        this.togglePlayerCount();
        return null;
      }
      if (currentZone.action === "game") {
        this.toggleGameMode();
        return null;
      }
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

export interface MusicTrack {
  id: string;
  name: string;
  file: string;
}

export const MUSIC_TRACKS: MusicTrack[] = [
  { id: "esprit", name: "ESPRIT THEME", file: "./sound/Esprit_Theme.mp3" },
  {
    id: "velocity",
    name: "VELOCITY VORTEX",
    file: "./sound/Velocity_Vortex.mp3",
  },
  {
    id: "nebula",
    name: "NEBULA NAVIGATOR",
    file: "./sound/Nebula_Navigator.mp3",
  },
  {
    id: "neon",
    name: "NEON DRIVE",
    file: "./sound/Neon_Drive.mp3",
  },
  {
    id: "neon2",
    name: "NEON VELOCITY",
    file: "./sound/Neon_Velocity.mp3",
  },
  {
    id: "silent",
    name: "NO MUSIC",
    file: "",
  },
];

export class MusicSelectionScreen implements UIScreen {
  private selectedIndex: number = 4; // Default to NEON VELOCITY

  constructor(
    private width: number,
    private height: number,
  ) { }

  getSelectedTrack(): MusicTrack {
    return MUSIC_TRACKS[this.selectedIndex] ?? MUSIC_TRACKS[0]!;
  }

  getSelectedChannel(): string {
    return this.getSelectedTrack().id;
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

    const centerX = this.width / 2;

    const currentTrack = MUSIC_TRACKS[this.selectedIndex];
    if (currentTrack) {
      const displayY = 110 * (this.height / 600);

      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(centerX - 200, displayY - 30, 400, 50);

      ctx.font = `bold ${28 * (this.height / 600)}px monospace`;
      ctx.fillStyle = "#ff8c00";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "#ff8c00";
      ctx.shadowBlur = 10;
      ctx.fillText(currentTrack.name, centerX, displayY);
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
        (this.selectedIndex - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length;
    } else if (keyCode === RIGHT) {
      this.selectedIndex = (this.selectedIndex + 1) % MUSIC_TRACKS.length;
    }

    return null;
  }

  handleMouseMove(_x: number, _y: number): void { }

  getZones(): MenuZone[] {
    return [];
  }
}

export interface RECSConfig {
  themeId: string;
  curves: number;
  hills: number;
  scenery: number;
  sharpness: number;
  steepness: number;
  scatter: number;
  length: number;
  difficulty: number;
  obstacles: number;
}

const THEME_LIST = [
  { id: "night", name: "NIGHT", icon: "theme-night.svg" },
  { id: "fog", name: "FOG", icon: "theme-fog.svg" },
  { id: "snow", name: "SNOW", icon: "theme-snow.svg" },
  { id: "storm", name: "STORM", icon: "theme-storm.svg" },
  { id: "desert", name: "DESERT", icon: "theme-desert.svg" },
  { id: "future", name: "FUTURE", icon: "theme-future.svg" },
  { id: "marsh", name: "MARSH", icon: "theme-marsh.svg" },
  { id: "mountains", name: "MOUNTAINS", icon: "theme-mountains.svg" },
  { id: "lakes", name: "LAKES", icon: "theme-lakes.svg" },
  { id: "country", name: "COUNTRY", icon: "theme-country.svg" },
  { id: "city", name: "CITY", icon: "theme-city.svg" },
  { id: "roadworks", name: "ROADWORKS", icon: "theme-roadworks.svg" },
  { id: "windy", name: "WINDY", icon: "theme-windy.svg" },
];

const RECS_SLIDERS = [
  { id: "curves", name: "CURVES", row: 0, col: 0 },
  { id: "hills", name: "HILLS", row: 0, col: 1 },
  { id: "scenery", name: "SCENERY", row: 0, col: 2 },
  { id: "sharpness", name: "SHARPNESS", row: 1, col: 0 },
  { id: "steepness", name: "STEEPNESS", row: 1, col: 1 },
  { id: "scatter", name: "SCATTER", row: 1, col: 2 },
  { id: "length", name: "LENGTH", row: 2, col: 0 },
  { id: "difficulty", name: "DIFFICULTY", row: 2, col: 1 },
  { id: "obstacles", name: "OBSTACLES", row: 2, col: 2 },
];

const RECS_TOP_BUTTONS = [
  { id: "type", name: "TYPE", x: 30 },
  { id: "exit", name: "EXIT", x: 285 },
  { id: "start", name: "START", x: 540 },
];

export class RECSScreen implements UIScreen {
  private config: RECSConfig;
  private selectedRow: number = 0;
  private selectedCol: number = 0;
  private mode: "sliders" | "scenario" | "top" = "top";

  constructor(
    private width: number,
    private height: number,
  ) {
    this.config = {
      themeId: "night",
      curves: 50,
      hills: 50,
      scenery: 50,
      sharpness: 50,
      steepness: 50,
      scatter: 50,
      length: 50,
      difficulty: 50,
      obstacles: 50,
    };
  }

  getConfig(): RECSConfig {
    return this.config;
  }

  getSelectedThemeId(): string {
    return this.config.themeId;
  }

  private getSliderValue(id: string): number {
    const key = id as keyof RECSConfig;
    const value = this.config[key];
    return typeof value === "number" ? value : 50;
  }

  private setSliderValue(id: string, value: number): void {
    const key = id as keyof RECSConfig;
    if (key in this.config) {
      (this.config as unknown as Record<string, unknown>)[key] = Math.max(
        0,
        Math.min(100, value),
      );
    }
  }

  render(ctx: CanvasRenderingContext2D, _state: TimeChallengeState): void {
    const scale = this.width / 800;
    const recsSvg = globalSpriteCache.get("track-builder.svg", scale);
    if (recsSvg) {
      ctx.drawImage(recsSvg.canvas, 0, 0, this.width, this.height);
    } else {
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, this.width, this.height);
    }

    const scaleX = this.width / 800;
    const scaleY = this.height / 600;

    for (const slider of RECS_SLIDERS) {
      const x = (30 + slider.col * 255) * scaleX;
      const y = (120 + slider.row * 100) * scaleY;
      const value = this.getSliderValue(slider.id);

      const isSelected =
        this.mode === "sliders" &&
        this.selectedRow === slider.row &&
        this.selectedCol === slider.col;

      if (isSelected) {
        ctx.strokeStyle = "#c1272d";
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, 230 * scaleX, 85 * scaleY);
      }

      ctx.fillStyle = "#ffca28";
      ctx.font = `bold ${14 * Math.min(scaleX, scaleY)}px monospace`;
      ctx.textAlign = "right";
      ctx.fillText(`${value}%`, x + 215 * scaleX, y + 32 * scaleY);

      const trackX = x + 40 * scaleX;
      const trackY = y + 55 * scaleY;
      const trackW = 150 * scaleX;
      const trackH = 12 * scaleY;
      const fillW = (value / 100) * trackW;

      ctx.fillStyle = "#c1272d";
      ctx.fillRect(trackX + 2, trackY + 2, fillW - 4, 8 * scaleY);
    }

    const scenarioY = 430 * scaleY;
    const slotWidth = 46 * scaleX;
    const slotHeight = 75 * scaleY;
    const gap = 54 * scaleX;
    const startX = 53 * scaleX;

    const themeIndex = THEME_LIST.findIndex(
      (t) => t.id === this.config.themeId,
    );

    for (let i = 0; i < THEME_LIST.length; i++) {
      const x = startX + i * gap;
      const y = scenarioY + 45 * scaleY;
      const theme = THEME_LIST[i];

      if (theme) {
        const iconSvg = globalSpriteCache.get(
          theme.icon,
          Math.min(scaleX, scaleY),
        );
        if (iconSvg) {
          ctx.drawImage(iconSvg.canvas, x, y, slotWidth, slotHeight);
        } else {
          ctx.fillStyle = "#222222";
          ctx.fillRect(x, y, slotWidth, slotHeight);
        }
      }

      if (this.mode === "scenario" && i === this.selectedCol) {
        ctx.strokeStyle = "#c1272d";
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 2, y - 2, slotWidth + 4, slotHeight + 4);
      } else if (i === themeIndex) {
        ctx.strokeStyle = "#00ff88";
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 1, y - 1, slotWidth + 2, slotHeight + 2);
      }
    }

    for (let i = 0; i < RECS_TOP_BUTTONS.length; i++) {
      const btn = RECS_TOP_BUTTONS[i];
      if (!btn) continue;
      const x = btn.x * scaleX;
      const y = 20 * scaleY;
      const isSelected = this.mode === "top" && this.selectedCol === i;

      if (isSelected) {
        ctx.strokeStyle = "#c1272d";
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, 230 * scaleX, 80 * scaleY);
      }
    }

    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(this.width / 2 - 300, this.height - 35, 600, 30);
    ctx.font = `bold ${11 * Math.min(scaleX, scaleY)}px monospace`;
    ctx.fillStyle = "#ffca28";
    ctx.textAlign = "center";
    ctx.fillText(
      "TAB: MODE   ARROWS: NAVIGATE   A/D: ADJUST   ENTER: SELECT",
      this.width / 2,
      this.height - 15,
    );
  }

  handleClick(x: number, y: number): string | null {
    const scaleX = this.width / 800;
    const scaleY = this.height / 600;

    for (let i = 0; i < RECS_TOP_BUTTONS.length; i++) {
      const btn = RECS_TOP_BUTTONS[i];
      if (!btn) continue;
      const btnX = btn.x * scaleX;
      const btnY = 20 * scaleY;
      const btnW = 230 * scaleX;
      const btnH = 80 * scaleY;

      if (x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH) {
        if (btn.id === "exit") {
          return "back";
        } else if (btn.id === "start") {
          return "start_game";
        }
        return null;
      }
    }

    for (const slider of RECS_SLIDERS) {
      const sliderX = (30 + slider.col * 255) * scaleX;
      const sliderY = (120 + slider.row * 100) * scaleY;
      const sliderW = 230 * scaleX;
      const sliderH = 85 * scaleY;

      if (
        x >= sliderX &&
        x <= sliderX + sliderW &&
        y >= sliderY &&
        y <= sliderY + sliderH
      ) {
        const trackX = sliderX + 40 * scaleX;
        const trackW = 150 * scaleX;
        const relativeX = x - trackX;
        const newValue = Math.round((relativeX / trackW) * 100);
        this.setSliderValue(slider.id, Math.max(0, Math.min(100, newValue)));
        return null;
      }
    }

    const scenarioY = (430 + 45) * scaleY;
    const slotWidth = 46 * scaleX;
    const slotHeight = 75 * scaleY;
    const gap = 54 * scaleX;
    const startX = 53 * scaleX;

    for (let i = 0; i < THEME_LIST.length; i++) {
      const iconX = startX + i * gap;

      if (
        x >= iconX &&
        x <= iconX + slotWidth &&
        y >= scenarioY &&
        y <= scenarioY + slotHeight
      ) {
        const theme = THEME_LIST[i];
        if (theme) {
          this.config.themeId = theme.id;
        }
        return null;
      }
    }

    return null;
  }

  handleMouseMove(x: number, y: number): void {
    const scaleX = this.width / 800;
    const scaleY = this.height / 600;

    for (const btn of RECS_TOP_BUTTONS) {
      if (!btn) continue;
      const btnX = btn.x * scaleX;
      const btnY = 20 * scaleY;
      const btnW = 230 * scaleX;
      const btnH = 80 * scaleY;

      if (x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH) {
        this.mode = "top";
        this.selectedCol = RECS_TOP_BUTTONS.indexOf(btn);
        return;
      }
    }

    for (const slider of RECS_SLIDERS) {
      const sliderX = (30 + slider.col * 255) * scaleX;
      const sliderY = (120 + slider.row * 100) * scaleY;
      const sliderW = 230 * scaleX;
      const sliderH = 85 * scaleY;

      if (
        x >= sliderX &&
        x <= sliderX + sliderW &&
        y >= sliderY &&
        y <= sliderY + sliderH
      ) {
        this.mode = "sliders";
        this.selectedRow = slider.row;
        this.selectedCol = slider.col;
        return;
      }
    }

    const scenarioY = (430 + 45) * scaleY;
    const slotWidth = 46 * scaleX;
    const slotHeight = 75 * scaleY;
    const gap = 54 * scaleX;
    const startX = 53 * scaleX;

    for (let i = 0; i < THEME_LIST.length; i++) {
      const iconX = startX + i * gap;

      if (
        x >= iconX &&
        x <= iconX + slotWidth &&
        y >= scenarioY &&
        y <= scenarioY + slotHeight
      ) {
        this.mode = "scenario";
        this.selectedCol = i;
        return;
      }
    }
  }

  getZones(): MenuZone[] {
    const scaleX = this.width / 800;
    const scaleY = this.height / 600;
    const zones: MenuZone[] = [];

    for (let i = 0; i < RECS_TOP_BUTTONS.length; i++) {
      const btn = RECS_TOP_BUTTONS[i];
      if (!btn) continue;
      zones.push({
        x: btn.x * scaleX,
        y: 20 * scaleY,
        width: 230 * scaleX,
        height: 80 * scaleY,
        action: btn.id,
        row: 0,
        col: i,
      });
    }

    for (const slider of RECS_SLIDERS) {
      zones.push({
        x: (30 + slider.col * 255) * scaleX,
        y: (120 + slider.row * 100) * scaleY,
        width: 230 * scaleX,
        height: 85 * scaleY,
        action: slider.id,
        row: slider.row + 1,
        col: slider.col,
      });
    }

    const scenarioY = (430 + 45) * scaleY;
    const slotWidth = 46 * scaleX;
    const slotHeight = 75 * scaleY;
    const gap = 54 * scaleX;
    const startX = 53 * scaleX;

    for (let i = 0; i < THEME_LIST.length; i++) {
      zones.push({
        x: startX + i * gap,
        y: scenarioY,
        width: slotWidth,
        height: slotHeight,
        action: `theme_${i}`,
        row: 4,
        col: i,
      });
    }

    return zones;
  }
}

export class ResultsScreen implements UIScreen {
  constructor(
    private width: number,
    private height: number,
  ) { }

  render(ctx: CanvasRenderingContext2D, state: TimeChallengeState): void {
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;

    const titleText = state.isGameOver
      ? state.gameMode === "race"
        ? "RACE COMPLETE"
        : "GAME OVER"
      : "RACE COMPLETE";
    drawCenteredText(ctx, titleText, centerX, 100, {
      font: "bold 36px monospace",
      color:
        state.isGameOver && state.gameMode === "time"
          ? COLORS.highlight
          : COLORS.score,
    });

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
  screens.set("car-select", new CarSelectionScreen(width, height));
  screens.set("difficulty-select", new DifficultySelectionScreen(width, height));
  // Championship standings needs state, so we just set a dummy one initially or create it dynamically in main.ts
  screens.set("recs", new RECSScreen(width, height));
  screens.set("results", new ResultsScreen(width, height));
  // Add race-results for race mode later if needed, but the current UI screens don't use it or map handles it? 
  return screens;
};
