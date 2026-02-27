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

// ============================================================================
// Sound Effects System
// ============================================================================

let soundEnabled = true;
let engineAudioContext: AudioContext | null = null;
let engineOscillator: OscillatorNode | null = null;
let engineGainNode: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let noiseNode: AudioBufferSourceNode | null = null;
let noiseGainNode: GainNode | null = null;

export const isSoundEnabled = (): boolean => soundEnabled;

export const toggleSound = (): boolean => {
  soundEnabled = !soundEnabled;

  if (!soundEnabled) {
    // Mute everything
    stopGameMusic();
    stopEngineSound();
  } else {
    // Resume music if it was playing
    const volume = globalModPlayer.getVolume();
    if (volume > 0) {
      globalModPlayer.setVolume(volume);
    }
  }

  return soundEnabled;
};

export const setSoundEnabled = (enabled: boolean): void => {
  if (soundEnabled !== enabled) {
    toggleSound();
  }
};

// ============================================================================
// Procedural Engine Sound
// ============================================================================

const createEngineAudioContext = (): AudioContext => {
  if (!engineAudioContext) {
    engineAudioContext = new AudioContext();
  }
  return engineAudioContext;
};

const createEngineNoiseBuffer = (ctx: AudioContext): AudioBuffer => {
  const bufferSize = ctx.sampleRate * 2; // 2 seconds
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  return buffer;
};

export const startEngineSound = (): void => {
  if (!soundEnabled) return;

  try {
    const ctx = createEngineAudioContext();

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    // Stop existing engine sound
    stopEngineSound();

    // Create oscillator for engine base tone
    engineOscillator = ctx.createOscillator();
    engineOscillator.type = "sawtooth";
    engineOscillator.frequency.value = 50; // Idle frequency

    engineGainNode = ctx.createGain();
    engineGainNode.gain.value = 0.06; // Reduced by 40%

    // Create noise for engine texture
    if (!noiseBuffer) {
      noiseBuffer = createEngineNoiseBuffer(ctx);
    }

    noiseNode = ctx.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    noiseNode.loop = true;

    // Filter the noise to make it sound more engine-like
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.value = 200;

    noiseGainNode = ctx.createGain();
    noiseGainNode.gain.value = 0.03; // Reduced by 40%

    // Connect nodes
    engineOscillator.connect(engineGainNode);
    engineGainNode.connect(ctx.destination);

    noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGainNode);
    noiseGainNode.connect(ctx.destination);

    // Start
    engineOscillator.start();
    noiseNode.start();
  } catch (err) {
    console.error("Failed to start engine sound:", err);
  }
};

export const stopEngineSound = (): void => {
  try {
    if (engineOscillator) {
      engineOscillator.stop();
      engineOscillator.disconnect();
      engineOscillator = null;
    }

    if (noiseNode) {
      noiseNode.stop();
      noiseNode.disconnect();
      noiseNode = null;
    }

    if (engineGainNode) {
      engineGainNode.disconnect();
      engineGainNode = null;
    }

    if (noiseGainNode) {
      noiseGainNode.disconnect();
      noiseGainNode = null;
    }
  } catch (err) {
    // Ignore errors when stopping
  }
};

export const updateEngineSound = (speedPercent: number): void => {
  if (!soundEnabled || !engineOscillator || !engineGainNode) return;

  try {
    const ctx = engineAudioContext;
    if (!ctx) return;

    // Map speed to frequency (50Hz idle to 200Hz max)
    const baseFreq = 50 + speedPercent * 150;
    engineOscillator.frequency.setValueAtTime(baseFreq, ctx.currentTime);

    // Map speed to volume (reduced by 40%)
    const volume = 0.03 + speedPercent * 0.09;
    engineGainNode.gain.setValueAtTime(volume, ctx.currentTime);

    // Update noise volume (reduced by 40%)
    if (noiseGainNode) {
      const noiseVol = 0.012 + speedPercent * 0.048;
      noiseGainNode.gain.setValueAtTime(noiseVol, ctx.currentTime);
    }
  } catch (err) {
    // Ignore update errors
  }
};

// ============================================================================
// Collision Sound
// ============================================================================

export const playCollisionSound = (intensity: number = 1.0): void => {
  if (!soundEnabled) return;

  try {
    const ctx = createEngineAudioContext();

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    // Create noise burst
    const bufferSize = ctx.sampleRate * 0.3; // 300ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const decay = 1 - i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * decay * intensity;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Filter to make it sound like a crash
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 800;

    const gain = ctx.createGain();
    gain.gain.value = Math.min(0.5, 0.2 * intensity);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    source.start();

    // Auto-cleanup
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  } catch (err) {
    console.error("Failed to play collision sound:", err);
  }
};
