import type { TimeChallengeState } from "../../game/modes/time-challenge";
import type { UIScreen, MenuZone } from "./screens";
import { CAR_TYPES } from "../../engine/cars";
import type { CarType } from "../../engine/types";
import { globalSpriteCache } from "../../assets/svg-loader";

export class CarSelectionScreen implements UIScreen {
    private cars: CarType[];
    private selectedIndex: number = 0;

    constructor(
        private width: number,
        private height: number,
    ) {
        this.cars = [
            CAR_TYPES.esprit_road!,
            CAR_TYPES.esprit_s4!,
            CAR_TYPES.m200!,
        ];
    }

    getSelectedCar(): CarType {
        if (this.selectedIndex >= 0 && this.selectedIndex < this.cars.length) {
            return this.cars[this.selectedIndex]!;
        }
        return this.cars[0]!;
    }

    render(ctx: CanvasRenderingContext2D, _state: TimeChallengeState): void {
        const scale = this.width / 800;

        // Background Dark Green
        ctx.fillStyle = "#002000"; // dark green like reference
        ctx.fillRect(0, 0, this.width, this.height);

        // Bezel Border
        const padX = 40 * scale;
        const padY = 50 * scale;
        const innerW = this.width - padX * 2;
        const innerH = this.height - padY * 2;

        // Outer gray rim
        ctx.strokeStyle = "#888888";
        ctx.lineWidth = 6 * scale;
        // Draw with rounded effect by using lineJoin round
        ctx.lineJoin = "round";
        ctx.strokeRect(padX, padY, innerW, innerH);

        ctx.strokeStyle = "#bbbbbb";
        ctx.lineWidth = 2 * scale;
        ctx.strokeRect(padX - 4 * scale, padY - 4 * scale, innerW + 8 * scale, innerH + 8 * scale);

        // Title Title Bar Breakdown
        ctx.fillStyle = "#002000";
        ctx.fillRect(this.width / 2 - 120 * scale, padY - 20 * scale, 240 * scale, 40 * scale);
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";

        // Custom blocky font rendering by using monospace bold
        ctx.font = `bold ${32 * scale}px monospace`;
        ctx.fillText("SELECT", this.width / 2, padY - 2 * scale);
        ctx.fillText("A CAR", this.width / 2, padY + 28 * scale);

        const car = this.getSelectedCar();

        // Top Section (Large view)
        const topH = 200 * scale;
        ctx.fillStyle = "#000000";
        ctx.fillRect(padX + 10 * scale, padY + 40 * scale, innerW - 20 * scale, topH);

        // Draw Left/Right Arrows in gray boxes
        this.drawArrowBtn(ctx, scale, padX, padY + 10 * scale, "LEFT");
        this.drawArrowBtn(ctx, scale, this.width - padX - 40 * scale, padY + 10 * scale, "RIGHT");

        // Draw Large Car
        // The car sprites in assets are usually 128-256px. We scale them up big.
        const largeScale = 3.5;
        const sprite = globalSpriteCache.get(car.sprite, largeScale * scale);
        if (sprite) {
            ctx.drawImage(
                sprite.canvas,
                this.width / 2 - sprite.canvas.width / 2,
                padY + 40 * scale + topH / 2 - sprite.canvas.height / 2
            );
        } else {
            // Draw placeholder if sprite not available yet
            ctx.fillStyle = "#222222";
            ctx.fillRect(this.width / 2 - 100 * scale, padY + 40 * scale + topH / 2 - 40 * scale, 200 * scale, 80 * scale);
        }

        // Mid Section Split
        const midY = padY + 40 * scale + topH + 10 * scale;
        const midH = 150 * scale;
        const midLeftW = (innerW - 30 * scale) * 0.45;
        const midRightW = (innerW - 30 * scale) * 0.55;

        // --- Left Mid Box ---
        ctx.fillStyle = "#000000";
        ctx.fillRect(padX + 10 * scale, midY, midLeftW, midH);

        // Car Name
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left";
        ctx.font = `bold ${22 * scale}px monospace`;
        const names = car.name.split(" ");
        // To handle "Reference Esprit S4", etc.
        ctx.fillText(names[0] || "", padX + 20 * scale, midY + 40 * scale);
        ctx.fillText(names.slice(1).join(" ") || "", padX + 30 * scale, midY + 70 * scale);

        // Thumbnail inset box
        ctx.fillStyle = "#222222";
        const thumbW = 100 * scale;
        const thumbH = 60 * scale;
        const thumbX = padX + midLeftW / 2 + 10 * scale;
        const thumbY = midY + 10 * scale;
        ctx.fillRect(thumbX, thumbY, thumbW, thumbH);
        if (sprite) {
            // Draw smaller version of the sprite in the thumbnail
            ctx.drawImage(
                sprite.canvas,
                0, 0, sprite.canvas.width, sprite.canvas.height, // source
                thumbX + 10 * scale, thumbY + 15 * scale, thumbW - 20 * scale, thumbH - 30 * scale // dest
            );
        }

        // Text specs (Speed, 0-60, Power, Torque)
        ctx.fillStyle = "#cccccc";
        ctx.font = `bold ${12 * scale}px monospace`;
        const maxMph = Math.floor((280 * car.topSpeed) / 1.609); // kmh to mph
        const zeroSixty = (5.5 / car.acceleration).toFixed(1);
        ctx.fillText(`MAX SPEED: ${maxMph} MPH`, padX + 20 * scale, midY + 105 * scale);
        ctx.fillText(`0-60: ${zeroSixty} SECONDS`, padX + 40 * scale, midY + 125 * scale);

        ctx.fillText(`MAX POWER: ${Math.floor(260 * car.acceleration)} BHP`, padX + 20 * scale, midY + 155 * scale); // overflow hack position

        // Stat Bars (Red/Blue vertical bars)
        const barStartX = padX + 10 * scale + midLeftW - 130 * scale;
        const barStartY = midY + 95 * scale;
        const barW = 18 * scale;
        const barH = 45 * scale;

        const drawBar = (x: number, val: number, label: string) => {
            // Blue remaining
            ctx.fillStyle = "#330099"; // dark purple-blue for empty
            ctx.fillRect(x, barStartY, barW, barH);

            // Red filled
            const h = barH * Math.min(1, Math.max(0.1, val));
            ctx.fillStyle = "#dd0000"; // bright red for fill
            ctx.fillRect(x, barStartY + barH - h, barW, h);

            ctx.fillStyle = "#888888";
            ctx.font = `bold ${10 * scale}px monospace`;
            ctx.fillText(label, x + 2 * scale, barStartY + barH + 12 * scale);
        };

        // Normalize stat values
        drawBar(barStartX, car.topSpeed / 1.15, "SP");
        drawBar(barStartX + 25 * scale, car.acceleration / 1.2, "AC");
        drawBar(barStartX + 50 * scale, car.handling / 1.1, "HA");
        drawBar(barStartX + 75 * scale, car.handling / 1.1, "RD"); // Duplicating handling for Road
        drawBar(barStartX + 100 * scale, car.braking / 1.15, "BR");


        // --- Right Mid Box (Graph) ---
        ctx.fillStyle = "#000000";
        ctx.fillRect(padX + 20 * scale + midLeftW, midY, midRightW, midH);

        // Graph grid
        ctx.strokeStyle = "#333333";
        ctx.lineWidth = 1 * scale;
        for (let i = 0; i <= 20; i++) {
            const xOffset = i * (midRightW / 20);
            ctx.beginPath(); ctx.moveTo(padX + 20 * scale + midLeftW + xOffset, midY); ctx.lineTo(padX + 20 * scale + midLeftW + xOffset, midY + midH); ctx.stroke();
        }
        for (let i = 0; i <= 10; i++) {
            const yOffset = i * (midH / 10);
            ctx.beginPath(); ctx.moveTo(padX + 20 * scale + midLeftW, midY + yOffset); ctx.lineTo(padX + 20 * scale + midLeftW + midRightW, midY + yOffset); ctx.stroke();
        }

        // Graph Labels
        ctx.fillStyle = "#dddddd";
        ctx.font = `${10 * scale}px monospace`;
        ctx.fillText("140", padX + 22 * scale + midLeftW, midY + 10 * scale);
        ctx.fillText("M\nP\nH", padX + 22 * scale + midLeftW, midY + 40 * scale); // Mocking vertical text
        ctx.fillText("0", padX + 22 * scale + midLeftW, midY + midH - 2 * scale);
        ctx.fillText("SECS", padX + 20 * scale + midLeftW + midRightW / 2 - 10 * scale, midY + midH + 12 * scale);
        ctx.fillText("60", padX + 20 * scale + midLeftW + midRightW - 15 * scale, midY + midH + 12 * scale);

        // Fake acceleration curves for 5 gears
        ctx.lineWidth = 2 * scale;
        const gears = [
            { color: "#00ff00", limitX: 0.2 }, // Gear 1 (green)
            { color: "#0000ff", limitX: 0.4 }, // Gear 2 (blue)
            { color: "#ff8800", limitX: 0.6 }, // Gear 3 (orange)
            { color: "#aaaaaa", limitX: 0.8 }, // Gear 4 (grey)
            { color: "#ff0000", limitX: 1.0 }, // Gear 5 (red)
        ];

        const graphOrgX = padX + 20 * scale + midLeftW;
        const graphOrgY = midY + midH;

        gears.forEach((g, i) => {
            ctx.strokeStyle = g.color;
            ctx.beginPath();
            ctx.moveTo(graphOrgX, graphOrgY);

            // Adjust curve steepness by acceleration
            const ac = car.acceleration;

            // End point for the gear
            const endX = graphOrgX + (midRightW * g.limitX) * (1 / ac);
            const endY = graphOrgY - (midH * ((i + 1) / 5)) * (car.topSpeed / 1.1);

            // Control point pulls the curve up for an acceleration curve
            const cpX = graphOrgX + (endX - graphOrgX) * 0.2;
            const cpY = graphOrgY - (graphOrgY - endY) * 0.8;

            ctx.quadraticCurveTo(Math.min(cpX, graphOrgX + midRightW), Math.max(cpY, midY), Math.min(endX, graphOrgX + midRightW), Math.max(endY, midY));
            ctx.stroke();

            // Gear legend inside graph
            ctx.fillStyle = g.color;
            ctx.fillRect(graphOrgX + midRightW - 20 * scale, midY + midH - 70 * scale + i * 12 * scale, 4 * scale, 4 * scale);
            ctx.fillStyle = "#aaaaaa";
            ctx.fillText(`${i + 1}`, graphOrgX + midRightW - 12 * scale, midY + midH - 64 * scale + i * 12 * scale);
        });


        // --- Bottom Thumbnails ---
        const botY = midY + midH + 10 * scale;
        const botH = innerH - (botY - padY) - 10 * scale;
        const tWidth = (innerW - 50 * scale) / 4;

        for (let i = 0; i < 4; i++) {
            const thumbX = padX + 10 * scale + i * (tWidth + 10 * scale);

            ctx.fillStyle = "#111111"; // placeholder dark gray for detail views
            ctx.fillRect(thumbX, botY, tWidth, botH);

            ctx.strokeStyle = "#444444";
            ctx.lineWidth = 1 * scale;
            ctx.strokeRect(thumbX, botY, tWidth, botH);

            // Mock "wireframe" / "interior" details
            ctx.strokeStyle = "#335533";
            ctx.beginPath();
            for (let j = 0; j < 5; j++) {
                ctx.moveTo(thumbX + Math.random() * tWidth, botY + Math.random() * botH);
                ctx.lineTo(thumbX + Math.random() * tWidth, botY + Math.random() * botH);
            }
            ctx.stroke();
        }

        // Final hints
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.font = `bold ${14 * scale}px monospace`;
        ctx.fillText("SPACE: START RACE", this.width / 2, this.height - 10 * scale);
    }

    private drawArrowBtn(ctx: CanvasRenderingContext2D, scale: number, x: number, y: number, dir: "LEFT" | "RIGHT") {
        ctx.fillStyle = "#888888";
        ctx.fillRect(x, y, 40 * scale, 30 * scale);
        ctx.strokeStyle = "#cccccc";
        ctx.lineWidth = 2 * scale;
        ctx.strokeRect(x, y, 40 * scale, 30 * scale);

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        if (dir === "LEFT") {
            ctx.moveTo(x + 25 * scale, y + 5 * scale);
            ctx.lineTo(x + 10 * scale, y + 15 * scale);
            ctx.lineTo(x + 25 * scale, y + 25 * scale);
        } else {
            ctx.moveTo(x + 15 * scale, y + 5 * scale);
            ctx.lineTo(x + 30 * scale, y + 15 * scale);
            ctx.lineTo(x + 15 * scale, y + 25 * scale);
        }
        ctx.fill();
    }

    handleClick(x: number, y: number): string | null {
        const scale = this.width / 800;
        const padX = 40 * scale;
        const padY = 50 * scale;

        const leftX = padX;
        const leftY = padY + 10 * scale;
        if (x >= leftX && x <= leftX + 40 * scale && y >= leftY && y <= leftY + 30 * scale) {
            this.selectedIndex = (this.selectedIndex - 1 + this.cars.length) % this.cars.length;
            return null;
        }

        const rightX = this.width - padX - 40 * scale;
        if (x >= rightX && x <= rightX + 40 * scale && y >= leftY && y <= leftY + 30 * scale) {
            this.selectedIndex = (this.selectedIndex + 1) % this.cars.length;
            return null;
        }

        return null;
    }

    handleKeyDown(keyCode: number): string | null {
        const { LEFT, RIGHT, SPACE, ENTER } = { LEFT: 37, RIGHT: 39, SPACE: 32, ENTER: 13 };

        if (keyCode === LEFT) {
            this.selectedIndex = (this.selectedIndex - 1 + this.cars.length) % this.cars.length;
        } else if (keyCode === RIGHT) {
            this.selectedIndex = (this.selectedIndex + 1) % this.cars.length;
        } else if (keyCode === SPACE || keyCode === ENTER) {
            return "start_race";
        }

        return null;
    }

    handleMouseMove(_x: number, _y: number): void { }

    getZones(): MenuZone[] {
        return [];
    }
}
