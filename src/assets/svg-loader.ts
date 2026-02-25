export interface CachedSprite {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  scale: number;
}

export interface SpriteCache {
  get(svgPath: string, scale: number): CachedSprite | null;
  preload(svgPath: string, scales: number[]): Promise<void>;
  clear(): void;
}

export interface SpriteLoaderConfig {
  basePath: string;
  defaultScales: number[];
}

const DEFAULT_CONFIG: SpriteLoaderConfig = {
  basePath: "/sprites/",
  defaultScales: [0.25, 0.5, 1, 2],
};

class SpriteCacheImpl implements SpriteCache {
  private cache = new Map<string, Map<number, CachedSprite>>();
  private config: SpriteLoaderConfig;
  private svgCache = new Map<string, string>();

  constructor(config: Partial<SpriteLoaderConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async loadSVG(path: string): Promise<string> {
    if (this.svgCache.has(path)) {
      return this.svgCache.get(path)!;
    }

    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load SVG: ${path}`);
    }

    const svgText = await response.text();
    this.svgCache.set(path, svgText);
    return svgText;
  }

  async renderSVGToCanvas(
    svgText: string,
    scale: number,
  ): Promise<CachedSprite> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const svgBlob = new Blob([svgText], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        const width = Math.ceil(img.naturalWidth * scale);
        const height = Math.ceil(img.naturalHeight * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);

        resolve({ canvas, width, height, scale });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`Failed to render SVG at scale ${scale}`));
      };

      img.src = url;
    });
  }

  async preload(svgPath: string, scales: number[]): Promise<void> {
    const fullPath = svgPath.startsWith("/")
      ? svgPath
      : this.config.basePath + svgPath;
    const svgText = await this.loadSVG(fullPath);

    if (!this.cache.has(svgPath)) {
      this.cache.set(svgPath, new Map());
    }

    const scaleMap = this.cache.get(svgPath)!;

    await Promise.all(
      scales.map(async (scale) => {
        if (!scaleMap.has(scale)) {
          const cached = await this.renderSVGToCanvas(svgText, scale);
          scaleMap.set(scale, cached);
        }
      }),
    );
  }

  get(svgPath: string, scale: number): CachedSprite | null {
    const scaleMap = this.cache.get(svgPath);
    if (!scaleMap) return null;

    const exactMatch = scaleMap.get(scale);
    if (exactMatch) return exactMatch;

    let closestScale = 0;
    let closestDiff = Infinity;

    for (const cachedScale of scaleMap.keys()) {
      const diff = Math.abs(cachedScale - scale);
      if (diff < closestDiff && cachedScale >= scale) {
        closestDiff = diff;
        closestScale = cachedScale;
      }
    }

    if (closestScale > 0) {
      return scaleMap.get(closestScale)!;
    }

    for (const cachedScale of scaleMap.keys()) {
      const diff = Math.abs(cachedScale - scale);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestScale = cachedScale;
      }
    }

    return scaleMap.get(closestScale) ?? null;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const createSpriteCache = (
  config?: Partial<SpriteLoaderConfig>,
): SpriteCache => {
  return new SpriteCacheImpl(config);
};

export const globalSpriteCache = createSpriteCache();

export const preloadGameSprites = async (): Promise<void> => {
  const sprites = [
    { path: "retro-racing-car.svg", scales: [0.1, 0.2, 0.3, 0.5, 0.75, 1] },
    { path: "level-1-background.svg", scales: [0.5, 1, 1.5, 2] },
    { path: "main-menu.svg", scales: [0.5, 1] },
  ];

  await Promise.all(
    sprites.map((s) => globalSpriteCache.preload(s.path, s.scales)),
  );
};

export const drawCachedSprite = (
  ctx: CanvasRenderingContext2D,
  cached: CachedSprite,
  x: number,
  y: number,
  targetWidth: number,
  targetHeight: number,
): void => {
  ctx.drawImage(cached.canvas, x, y, targetWidth, targetHeight);
};

export const drawCachedSpriteCentered = (
  ctx: CanvasRenderingContext2D,
  cached: CachedSprite,
  centerX: number,
  centerY: number,
  targetWidth: number,
  targetHeight: number,
): void => {
  const x = centerX - targetWidth / 2;
  const y = centerY - targetHeight / 2;
  ctx.drawImage(cached.canvas, x, y, targetWidth, targetHeight);
};
