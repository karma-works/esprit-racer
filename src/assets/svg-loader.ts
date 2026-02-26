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

export const SPRITE_SVG_MAP: Record<string, string> = {
  PALM_TREE: "palm-tree.svg",
  TREE1: "tree-deciduous.svg",
  TREE2: "tree-blossom.svg",
  DEAD_TREE1: "dead-tree.svg",
  DEAD_TREE2: "tree-twisting.svg",
  BUSH1: "bush-fern.svg",
  BUSH2: "bush-flowering.svg",
  CACTUS: "cactus.svg",
  STUMP: "stump.svg",
  COLUMN: "column.svg",
  BOULDER1: "rocks-flat.svg",
  BOULDER2: "rocks-flat.svg",
  BOULDER3: "dead-tree.svg",
  BILLBOARD01: "billboard-liquidplanner.svg",
  BILLBOARD02: "billboard-icecream.svg",
  BILLBOARD03: "billboard-codeincomplete.svg",
  BILLBOARD04: "billboard-rim.svg",
  BILLBOARD05: "billboard-danke.svg",
  BILLBOARD06: "billboard-liquidplanner.svg",
  BILLBOARD07: "billboard-sega.svg",
  BILLBOARD08: "billboard-snakes.svg",
  BILLBOARD09: "billboard-redmond.svg",
  CAR01: "car-red.svg",
  CAR02: "car-brown.svg",
  CAR03: "car-pink.svg",
  CAR04: "car-blue.svg",
  SEMI: "truck-semi.svg",
  TRUCK: "truck-jeep.svg",
  PLAYER_STRAIGHT: "player-car.svg",
  PLAYER_LEFT: "player-car.svg",
  PLAYER_RIGHT: "player-car.svg",
  PLAYER_UPHILL_STRAIGHT: "player-car.svg",
  PLAYER_UPHILL_LEFT: "player-car.svg",
  PLAYER_UPHILL_RIGHT: "player-car.svg",
};

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

export const getSpriteByName = (
  name: string,
  scale: number,
): CachedSprite | null => {
  const svgPath = SPRITE_SVG_MAP[name];
  if (!svgPath) return null;
  return globalSpriteCache.get(svgPath, scale);
};

export const preloadGameSprites = async (): Promise<void> => {
  const baseScales = [0.5, 1, 1.5, 2, 3];
  const largeScales = [0.5, 1, 1.5, 2, 3, 4];

  const sprites = [
    { path: "player-car.svg", scales: largeScales },
    { path: "background-level-1.svg", scales: [1, 2] },
    { path: "background.svg", scales: [1, 2] },
    { path: "main-menu.svg", scales: [0.5, 1] },
    { path: "palm-tree.svg", scales: largeScales },
    { path: "tree-deciduous.svg", scales: largeScales },
    { path: "tree-blossom.svg", scales: largeScales },
    { path: "tree-twisting.svg", scales: largeScales },
    { path: "dead-tree.svg", scales: largeScales },
    { path: "bush-fern.svg", scales: baseScales },
    { path: "bush-flowering.svg", scales: baseScales },
    { path: "cactus.svg", scales: baseScales },
    { path: "stump.svg", scales: baseScales },
    { path: "column.svg", scales: largeScales },
    { path: "rocks-flat.svg", scales: baseScales },
    { path: "billboard-snakes.svg", scales: largeScales },
    { path: "billboard-redmond.svg", scales: largeScales },
    { path: "billboard-liquidplanner.svg", scales: largeScales },
    { path: "billboard-sega.svg", scales: largeScales },
    { path: "billboard-danke.svg", scales: largeScales },
    { path: "billboard-rim.svg", scales: baseScales },
    { path: "billboard-codeincomplete.svg", scales: baseScales },
    { path: "billboard-icecream.svg", scales: baseScales },
    { path: "car-red.svg", scales: largeScales },
    { path: "car-pink.svg", scales: largeScales },
    { path: "car-blue.svg", scales: largeScales },
    { path: "car-brown.svg", scales: largeScales },
    { path: "truck-semi.svg", scales: largeScales },
    { path: "truck-jeep.svg", scales: largeScales },
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
