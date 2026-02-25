// @ts-ignore
import PasuunaPlayerModule from "@pinkkis/pasuuna-player";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PasuunaPlayer: any = PasuunaPlayerModule;

export interface ModPlayerConfig {
  volume: number;
  loop: boolean;
}

const DEFAULT_CONFIG: ModPlayerConfig = {
  volume: 0.5,
  loop: true,
};

export interface ModPlayer {
  load(url: string): Promise<void>;
  play(): void;
  pause(): void;
  stop(): void;
  setVolume(volume: number): void;
  getVolume(): number;
  isPlaying(): boolean;
  isLoaded(): boolean;
}

class ModPlayerImpl implements ModPlayer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private player: any = null;
  private loaded = false;
  private playing = false;
  private config: ModPlayerConfig;

  constructor(config: Partial<ModPlayerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async load(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.player = new PasuunaPlayer({
          repeat: this.config.loop,
          onReady: () => {
            this.loaded = true;
            this.player?.setVolume(this.config.volume);
            resolve();
          },
          onError: (error: Error) => {
            reject(error);
          },
        });
        this.player.load(url);
      } catch (error) {
        reject(error);
      }
    });
  }

  play(): void {
    if (this.player && this.loaded) {
      this.player.play();
      this.playing = true;
    }
  }

  pause(): void {
    if (this.player && this.loaded) {
      this.player.stop();
      this.playing = false;
    }
  }

  stop(): void {
    if (this.player && this.loaded) {
      this.player.stop();
      this.playing = false;
    }
  }

  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
    if (this.player && this.loaded) {
      this.player.setVolume(this.config.volume);
    }
  }

  getVolume(): number {
    return this.config.volume;
  }

  isPlaying(): boolean {
    return this.playing;
  }

  isLoaded(): boolean {
    return this.loaded;
  }
}

export const createModPlayer = (
  config?: Partial<ModPlayerConfig>,
): ModPlayer => {
  return new ModPlayerImpl(config);
};

export const globalModPlayer = createModPlayer();

export const loadGameMusic = async (): Promise<void> => {
  try {
    await globalModPlayer.load("/sound/racing_kirby.mod");
    console.log("Music loaded successfully");
  } catch (error) {
    console.warn("Failed to load music:", error);
  }
};

export const playGameMusic = (): void => {
  globalModPlayer.play();
};

export const pauseGameMusic = (): void => {
  globalModPlayer.pause();
};

export const stopGameMusic = (): void => {
  globalModPlayer.stop();
};

export const setMusicVolume = (volume: number): void => {
  globalModPlayer.setVolume(volume);
};
