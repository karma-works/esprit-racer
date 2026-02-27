export interface ModPlayerConfig {
  volume: number;
  loop: boolean;
}

const DEFAULT_CONFIG: ModPlayerConfig = {
  volume: 0.5,
  loop: true,
};

class ModPlayerImpl {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private currentUrl: string | null = null;
  private loaded = false;
  private playing = false;
  private config: ModPlayerConfig;
  private volume: number;

  constructor(config: Partial<ModPlayerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.volume = this.config.volume;
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = this.volume;
    }
    return this.audioContext;
  }

  async load(url: string): Promise<void> {
    if (this.currentUrl === url && this.audioBuffer) {
      return;
    }

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();

    const ctx = this.getAudioContext();
    this.audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    this.currentUrl = url;
    this.loaded = true;
  }

  async play(): Promise<void> {
    if (!this.audioBuffer) return;

    const ctx = this.getAudioContext();

    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
    }

    this.sourceNode = ctx.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.loop = this.config.loop;
    this.sourceNode.connect(this.gainNode!);
    this.sourceNode.start(0);
    this.playing = true;

    this.sourceNode.onended = () => {
      this.playing = false;
    };
  }

  pause(): void {
    if (this.sourceNode && this.playing) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
      this.playing = false;
    }
  }

  stop(): void {
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    this.playing = false;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume;
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

export const globalModPlayer = new ModPlayerImpl();

export const loadAndPlayTrack = async (file: string): Promise<void> => {
  stopGameMusic();
  await globalModPlayer.load(file);
  await globalModPlayer.play();
};

export const playGameMusic = async (): Promise<void> => {
  await globalModPlayer.play();
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
