import PasuunaPlayer from "@pinkkis/pasuuna-player";

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
  private tracker: any = null;
  private loaded = false;
  private playing = false;
  private config: ModPlayerConfig;
  private volume: number;

  constructor(config: Partial<ModPlayerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.volume = this.config.volume;
  }

  async load(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const Pasuuna = PasuunaPlayer as any;
        this.tracker = new Pasuuna.Tracker();
        this.tracker.init();

        const onSongLoaded = (song: { title: string }) => {
          this.loaded = true;
          this.setVolume(this.volume);
          resolve();
        };

        this.tracker.events.on(Pasuuna.EVENT.songLoaded, onSongLoaded);

        fetch(url)
          .then((response) => response.arrayBuffer())
          .then((buffer) => {
            this.tracker.parse(buffer);
          })
          .catch((error) => {
            reject(error);
          });
      } catch (error) {
        reject(error);
      }
    });
  }

  play(): void {
    if (this.tracker && this.loaded && !this.playing) {
      this.tracker.playSong();
      this.playing = true;
    }
  }

  pause(): void {
    if (this.tracker && this.loaded && this.playing) {
      this.tracker.stop();
      this.playing = false;
    }
  }

  stop(): void {
    if (this.tracker && this.loaded) {
      this.tracker.stop();
      this.playing = false;
    }
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.tracker && this.tracker.audio && this.tracker.audio.masterVolume) {
      this.tracker.audio.masterVolume.gain.setValueAtTime(this.volume, 0);
    }
  }

  getVolume(): number {
    return this.volume;
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
