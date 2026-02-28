import type { TimeChallengeState } from "../../game/modes/time-challenge";
import type { UIScreen, MenuZone } from "./screens";
import type { ChampionshipState } from "../../engine/types";
import { generatePassword, parsePassword } from "../../game/modes/championship";
import { globalSpriteCache } from "../../assets/svg-loader";

export class DifficultySelectionScreen implements UIScreen {
    private difficulties: ("easy" | "medium" | "hard")[] = ["easy", "medium", "hard"];
    private selectedIndex: number = 0;
    private passwordMode: boolean = false;
    private passwordInput: string = "";

    constructor(
        private width: number,
        private height: number,
    ) { }

    getSelectedDifficulty(): "easy" | "medium" | "hard" {
        return this.difficulties[this.selectedIndex]!;
    }

    isPasswordMode(): boolean {
        return this.passwordMode;
    }

    getPasswordInput(): string {
        return this.passwordInput;
    }

    render(ctx: CanvasRenderingContext2D, _state: TimeChallengeState): void {
        const scale = this.width / 800;

        // Background
        ctx.fillStyle = "#111122";
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.fillStyle = "#ffcc00";
        ctx.textAlign = "center";
        ctx.font = `bold ${32 * scale}px monospace`;
        ctx.fillText("CHAMPIONSHIP MODE", this.width / 2, 60 * scale);

        if (this.passwordMode) {
            this.renderPasswordEntry(ctx, scale);
        } else {
            this.renderDifficultySelect(ctx, scale);
        }
    }

    private renderDifficultySelect(ctx: CanvasRenderingContext2D, scale: number) {
        const boxWidth = 200 * scale;
        const boxHeight = 100 * scale;
        const startY = 200 * scale;
        const spacing = 40 * scale;

        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${20 * scale}px monospace`;
        ctx.fillText("SELECT DIFFICULTY", this.width / 2, 140 * scale);

        this.difficulties.forEach((diff, i) => {
            const y = startY + i * (boxHeight + spacing);
            const isSelected = this.selectedIndex === i;

            ctx.fillStyle = isSelected ? "#3a4b5c" : "#1a2b3c";
            ctx.fillRect(this.width / 2 - boxWidth / 2, y, boxWidth, boxHeight);

            if (isSelected) {
                ctx.strokeStyle = "#00ff88";
                ctx.lineWidth = 4 * scale;
                ctx.strokeRect(this.width / 2 - boxWidth / 2, y, boxWidth, boxHeight);
            }

            ctx.fillStyle = isSelected ? "#00ff88" : "#aaaaaa";
            ctx.font = `bold ${24 * scale}px monospace`;
            ctx.fillText(diff.toUpperCase(), this.width / 2, y + boxHeight / 2 + 8 * scale);
        });

        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${16 * scale}px monospace`;
        ctx.fillText("UP/DOWN: SELECT   SPACE: START   P: ENTER PASSWORD", this.width / 2, this.height - 40 * scale);
    }

    private renderPasswordEntry(ctx: CanvasRenderingContext2D, scale: number) {
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${20 * scale}px monospace`;
        ctx.fillText("ENTER PASSWORD", this.width / 2, 200 * scale);

        ctx.fillStyle = "#1a2b3c";
        ctx.fillRect(this.width / 2 - 150 * scale, 250 * scale, 300 * scale, 60 * scale);
        ctx.strokeStyle = "#00ff88";
        ctx.lineWidth = 4 * scale;
        ctx.strokeRect(this.width / 2 - 150 * scale, 250 * scale, 300 * scale, 60 * scale);

        ctx.fillStyle = "#00ff88";
        ctx.font = `bold ${32 * scale}px monospace`;
        ctx.fillText(this.passwordInput + "_", this.width / 2, 290 * scale);

        const decoded = parsePassword(this.passwordInput);
        if (decoded) {
            ctx.fillStyle = "#44ff44";
            ctx.font = `bold ${16 * scale}px monospace`;
            ctx.fillText(`VALID: Race ${decoded.currentRace! + 1}, ${decoded.points} pts`, this.width / 2, 350 * scale);
        } else if (this.passwordInput.length === 6) {
            ctx.fillStyle = "#ff4444";
            ctx.font = `bold ${16 * scale}px monospace`;
            ctx.fillText("INVALID PASSWORD", this.width / 2, 350 * scale);
        }

        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${16 * scale}px monospace`;
        ctx.fillText("ESC: CANCEL   ENTER: ACCEPT", this.width / 2, this.height - 40 * scale);
    }

    handleClick(_x: number, _y: number): string | null {
        return null; // Keyboard driven for simplicity
    }

    handleKeyDown(keyCode: number): string | null {
        const { UP, DOWN, SPACE, ENTER, ESC, P } = {
            UP: 38, DOWN: 40, SPACE: 32, ENTER: 13, ESC: 27, P: 80
        };

        if (this.passwordMode) {
            if (keyCode === ESC) {
                this.passwordMode = false;
                this.passwordInput = "";
            } else if (keyCode === ENTER && this.passwordInput.length === 6 && parsePassword(this.passwordInput)) {
                return "password_accepted";
            } else if (keyCode >= 65 && keyCode <= 90 && this.passwordInput.length < 6) {
                // A-Z
                this.passwordInput += String.fromCharCode(keyCode);
            } else if (keyCode >= 48 && keyCode <= 57 && this.passwordInput.length < 6) {
                // 0-9
                this.passwordInput += String.fromCharCode(keyCode);
            } else if (keyCode === 8) { // Backspace
                this.passwordInput = this.passwordInput.slice(0, -1);
            }
            return null;
        } else {
            if (keyCode === UP) {
                this.selectedIndex = Math.max(0, this.selectedIndex - 1);
            } else if (keyCode === DOWN) {
                this.selectedIndex = Math.min(this.difficulties.length - 1, this.selectedIndex + 1);
            } else if (keyCode === SPACE || keyCode === ENTER) {
                return "difficulty_selected";
            } else if (keyCode === P) {
                this.passwordMode = true;
            }
        }
        return null;
    }

    handleMouseMove(_x: number, _y: number): void { }

    getZones(): MenuZone[] {
        return [];
    }
}

export class ChampionshipStandingsScreen implements UIScreen {
    constructor(
        private width: number,
        private height: number,
        private state: ChampionshipState
    ) { }

    render(ctx: CanvasRenderingContext2D, _state: TimeChallengeState): void {
        const scale = this.width / 800;

        ctx.fillStyle = "#0a0a1a";
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.fillStyle = "#00ffff";
        ctx.textAlign = "center";
        ctx.font = `bold ${32 * scale}px monospace`;

        if (this.state.eliminated) {
            ctx.fillStyle = "#ff3333";
            ctx.fillText("CHAMPIONSHIP OVER", this.width / 2, 80 * scale);
            ctx.fillStyle = "#ffffff";
            ctx.font = `bold ${20 * scale}px monospace`;
            ctx.fillText("You failed to qualify for the next race.", this.width / 2, 140 * scale);
        } else if (this.state.currentRace >= this.state.totalRaces) {
            ctx.fillStyle = "#ffff00";
            ctx.fillText("CHAMPIONSHIP COMPLETE!", this.width / 2, 80 * scale);
            ctx.fillStyle = "#ffffff";
            ctx.font = `bold ${20 * scale}px monospace`;
            ctx.fillText(`Final Score: ${this.state.points} points`, this.width / 2, 140 * scale);
        } else {
            ctx.fillText("RACE RESULTS", this.width / 2, 80 * scale);

            const lastPos = this.state.positionHistory[this.state.positionHistory.length - 1];
            ctx.fillStyle = "#ffffff";
            ctx.font = `bold ${24 * scale}px monospace`;
            ctx.fillText(`You finished ${lastPos}${this.getOrdinalSuffix(lastPos!)}`, this.width / 2, 140 * scale);

            ctx.fillStyle = "#00ff88";
            ctx.fillText(`Total Points: ${this.state.points}`, this.width / 2, 200 * scale);

            const pass = generatePassword(this.state);
            ctx.fillStyle = "#aaaaaa";
            ctx.font = `${16 * scale}px monospace`;
            ctx.fillText(`Password: ${pass}`, this.width / 2, 260 * scale);

            ctx.fillStyle = "#ffffff";
            ctx.font = `bold ${20 * scale}px monospace`;
            ctx.fillText(`Next Race starts from Position ${this.state.gridPosition}`, this.width / 2, 340 * scale);
        }

        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${16 * scale}px monospace`;
        ctx.fillText("SPACE: CONTINUE", this.width / 2, this.height - 40 * scale);
    }

    private getOrdinalSuffix(i: number): string {
        const j = i % 10, k = i % 100;
        if (j == 1 && k != 11) return "st";
        if (j == 2 && k != 12) return "nd";
        if (j == 3 && k != 13) return "rd";
        return "th";
    }

    handleClick(_x: number, _y: number): string | null {
        return "continue";
    }

    handleKeyDown(keyCode: number): string | null {
        if (keyCode === 32 || keyCode === 13) {
            return "continue";
        }
        return null;
    }

    handleMouseMove(_x: number, _y: number): void { }

    getZones(): MenuZone[] {
        return [];
    }
}
