import type { InputMapping, InputState } from "./types";
import { KEY } from "./constants";

export const DEFAULT_P1_INPUT: InputMapping = {
  left: [KEY.A],
  right: [KEY.D],
  faster: [KEY.W],
  slower: [KEY.S],
};

export const DEFAULT_P2_INPUT: InputMapping = {
  left: [KEY.LEFT],
  right: [KEY.RIGHT],
  faster: [KEY.UP],
  slower: [KEY.DOWN],
};

export const DEFAULT_PLAYER_CONFIGS = [
  {
    id: 0,
    name: "PLAYER 1",
    inputMapping: DEFAULT_P1_INPUT,
    color: "#00ff88",
    spriteColor: "#00ff88",
  },
  {
    id: 1,
    name: "PLAYER 2",
    inputMapping: DEFAULT_P2_INPUT,
    color: "#ff4444",
    spriteColor: "#ff4444",
  },
];

export const createDefaultInput = (): InputState => ({
  left: false,
  right: false,
  faster: false,
  slower: false,
});

export const createInputArray = (playerCount: number): InputState[] => {
  return Array(playerCount).fill(null).map(createDefaultInput);
};

export class InputManager {
  private playerConfigs: InputMapping[];

  constructor(playerCount: number = 1) {
    this.playerConfigs = [
      DEFAULT_P1_INPUT,
      ...(playerCount > 1 ? [DEFAULT_P2_INPUT] : []),
    ];
  }

  setPlayerConfig(playerIndex: number, config: InputMapping): void {
    if (playerIndex >= 0 && playerIndex < this.playerConfigs.length) {
      this.playerConfigs[playerIndex] = config;
    }
  }

  getPlayerConfig(playerIndex: number): InputMapping | null {
    return this.playerConfigs[playerIndex] ?? null;
  }

  getPlayerForKey(keyCode: number): number {
    for (let i = 0; i < this.playerConfigs.length; i++) {
      const config = this.playerConfigs[i];
      if (!config) continue;

      if (
        config.left.includes(keyCode) ||
        config.right.includes(keyCode) ||
        config.faster.includes(keyCode) ||
        config.slower.includes(keyCode)
      ) {
        return i;
      }
    }
    return -1;
  }

  handleKeyDown(inputs: InputState[], keyCode: number): void {
    for (let i = 0; i < this.playerConfigs.length; i++) {
      const config = this.playerConfigs[i];
      const input = inputs[i];
      if (!config || !input) continue;

      if (config.left.includes(keyCode)) input.left = true;
      if (config.right.includes(keyCode)) input.right = true;
      if (config.faster.includes(keyCode)) input.faster = true;
      if (config.slower.includes(keyCode)) input.slower = true;
    }
  }

  handleKeyUp(inputs: InputState[], keyCode: number): void {
    for (let i = 0; i < this.playerConfigs.length; i++) {
      const config = this.playerConfigs[i];
      const input = inputs[i];
      if (!config || !input) continue;

      if (config.left.includes(keyCode)) input.left = false;
      if (config.right.includes(keyCode)) input.right = false;
      if (config.faster.includes(keyCode)) input.faster = false;
      if (config.slower.includes(keyCode)) input.slower = false;
    }
  }
}

export const getInputForPlayer = (
  inputs: InputState[],
  playerIndex: number,
): InputState => {
  return inputs[playerIndex] ?? createDefaultInput();
};

export const setInputForPlayer = (
  inputs: InputState[],
  playerIndex: number,
  input: InputState,
): void => {
  if (playerIndex >= 0 && playerIndex < inputs.length) {
    inputs[playerIndex] = input;
  }
};
