declare module "@pinkkis/pasuuna-player" {
  export interface PasuunaPlayerOptions {
    repeat?: boolean;
    onReady?: () => void;
    onError?: (error: Error) => void;
  }

  export default class PasuunaPlayer {
    constructor(options: PasuunaPlayerOptions);
    load(url: string): void;
    play(): void;
    stop(): void;
    setVolume(volume: number): void;
  }
}
