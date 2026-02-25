import type {
  TimeChallengeState,
  GameScreen,
} from "../../game/modes/time-challenge";

export interface UIScreen {
  render(ctx: CanvasRenderingContext2D, state: TimeChallengeState): void;
  handleClick?(x: number, y: number): void;
}

export interface Button {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  action: string;
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

export class MainMenuScreen implements UIScreen {
  private buttons: Button[];

  constructor(
    private width: number,
    private height: number,
  ) {
    const centerX = width / 2;
    const buttonWidth = 200;
    const buttonHeight = 50;
    const startY = height / 2 + 50;
    const spacing = 70;

    this.buttons = [
      {
        x: centerX - buttonWidth / 2,
        y: startY,
        width: buttonWidth,
        height: buttonHeight,
        label: "TIME CHALLENGE",
        action: "start",
      },
      {
        x: centerX - buttonWidth / 2,
        y: startY + spacing,
        width: buttonWidth,
        height: buttonHeight,
        label: "OPTIONS",
        action: "options",
      },
    ];
  }

  render(ctx: CanvasRenderingContext2D, state: TimeChallengeState): void {
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, this.width, this.height);

    drawCenteredText(ctx, "ESPRIT RACER", this.width / 2, 100, {
      font: "bold 48px monospace",
      color: COLORS.highlight,
    });

    drawCenteredText(ctx, state.playerName, this.width / 2, 180, {
      font: "24px monospace",
      color: COLORS.textDim,
    });

    if (state.bestScore !== null) {
      drawCenteredText(
        ctx,
        `BEST: ${state.bestScore.toString().padStart(6, "0")}`,
        this.width / 2,
        this.height - 80,
        {
          font: "20px monospace",
          color: COLORS.score,
        },
      );
    }

    for (const button of this.buttons) {
      drawButton(ctx, button);
    }
  }

  getButtons(): Button[] {
    return this.buttons;
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
  screens.set("results", new ResultsScreen(width, height));
  return screens;
};
