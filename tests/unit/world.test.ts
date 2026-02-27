import { describe, it, expect, beforeEach } from "vitest";
import {
  createDefaultConfig,
  createDefaultPlayer,
  createDefaultInput,
  createWorld,
  update,
  formatTime,
  handleKeyDown,
  handleKeyUp,
  resetCars,
  getMirrorCars,
} from "../../src/engine/world";
import { KEY } from "../../src/engine/constants";

describe("world", () => {
  describe("createDefaultConfig", () => {
    it("creates config with expected values", () => {
      const config = createDefaultConfig();

      expect(config.fps).toBe(60);
      expect(config.width).toBe(1024);
      expect(config.height).toBe(768);
      expect(config.lanes).toBe(3);
      expect(config.roadWidth).toBe(2000);
      expect(config.segmentLength).toBe(200);
      expect(config.rumbleLength).toBe(3);
      expect(config.drawDistance).toBe(300);
      expect(config.fogDensity).toBe(5);
    });

    it("calculates physics values correctly", () => {
      const config = createDefaultConfig();

      expect(config.maxSpeed).toBe(200 / (1 / 60));
      expect(config.accel).toBe(config.maxSpeed / 5);
      expect(config.braking).toBe(-config.maxSpeed);
    });
  });

  describe("createDefaultPlayer", () => {
    it("creates player at specified z position", () => {
      const player = createDefaultPlayer(5000);

      expect(player.z).toBe(5000);
      expect(player.x).toBe(0);
      expect(player.position).toBe(0);
      expect(player.speed).toBe(0);
    });
  });

  describe("createDefaultInput", () => {
    it("creates input with all false values", () => {
      const input = createDefaultInput();

      expect(input.left).toBe(false);
      expect(input.right).toBe(false);
      expect(input.faster).toBe(false);
      expect(input.slower).toBe(false);
    });
  });

  describe("createWorld", () => {
    it("creates complete world state", () => {
      const world = createWorld();

      expect(world.config).toBeDefined();
      expect(world.player).toBeDefined();
      expect(world.input).toBeDefined();
      expect(world.segments).toBeDefined();
      expect(world.cars).toBeDefined();
      expect(world.trackLength).toBeGreaterThan(0);
    });

    it("creates segments array with content", () => {
      const world = createWorld();

      expect(world.segments.length).toBeGreaterThan(0);
    });

    it("initializes offsets to zero", () => {
      const world = createWorld();

      expect(world.skyOffset).toBe(0);
      expect(world.hillOffset).toBe(0);
      expect(world.treeOffset).toBe(0);
    });

    it("initializes lap times", () => {
      const world = createWorld();

      expect(world.currentLapTime).toBe(0);
      expect(world.lastLapTime).toBeNull();
      expect(world.fastLapTime).toBeNull();
    });
  });

  describe("formatTime", () => {
    it("formats seconds and tenths", () => {
      expect(formatTime(5.5)).toBe("5.5");
      expect(formatTime(10.5)).toBe("10.5");
      expect(formatTime(59.5)).toBe("59.5");
    });

    it("formats minutes when present", () => {
      expect(formatTime(65.5)).toBe("1.05.5");
      expect(formatTime(125.5)).toBe("2.05.5");
    });

    it("pads seconds with zero when needed", () => {
      expect(formatTime(61.5)).toBe("1.01.5");
      expect(formatTime(62.0)).toBe("1.02.0");
    });

    it("handles zero", () => {
      expect(formatTime(0)).toBe("0.0");
    });
  });

  describe("handleKeyDown", () => {
    it("sets left input for LEFT key", () => {
      const world = createWorld();
      handleKeyDown(world, KEY.LEFT);
      expect(world.input.left).toBe(true);
    });

    it("sets left input for A key", () => {
      const world = createWorld();
      handleKeyDown(world, KEY.A);
      expect(world.input.left).toBe(true);
    });

    it("sets right input for RIGHT key", () => {
      const world = createWorld();
      handleKeyDown(world, KEY.RIGHT);
      expect(world.input.right).toBe(true);
    });

    it("sets right input for D key", () => {
      const world = createWorld();
      handleKeyDown(world, KEY.D);
      expect(world.input.right).toBe(true);
    });

    it("sets faster input for UP key", () => {
      const world = createWorld();
      handleKeyDown(world, KEY.UP);
      expect(world.input.faster).toBe(true);
    });

    it("sets faster input for W key", () => {
      const world = createWorld();
      handleKeyDown(world, KEY.W);
      expect(world.input.faster).toBe(true);
    });

    it("sets slower input for DOWN key", () => {
      const world = createWorld();
      handleKeyDown(world, KEY.DOWN);
      expect(world.input.slower).toBe(true);
    });

    it("sets slower input for S key", () => {
      const world = createWorld();
      handleKeyDown(world, KEY.S);
      expect(world.input.slower).toBe(true);
    });

    it("ignores unknown keys", () => {
      const world = createWorld();
      handleKeyDown(world, 999);
      expect(world.input.left).toBe(false);
      expect(world.input.right).toBe(false);
      expect(world.input.faster).toBe(false);
      expect(world.input.slower).toBe(false);
    });
  });

  describe("handleKeyUp", () => {
    it("clears left input for LEFT key", () => {
      const world = createWorld();
      world.input.left = true;
      handleKeyUp(world, KEY.LEFT);
      expect(world.input.left).toBe(false);
    });

    it("clears right input for RIGHT key", () => {
      const world = createWorld();
      world.input.right = true;
      handleKeyUp(world, KEY.RIGHT);
      expect(world.input.right).toBe(false);
    });

    it("clears faster input for UP key", () => {
      const world = createWorld();
      world.input.faster = true;
      handleKeyUp(world, KEY.UP);
      expect(world.input.faster).toBe(false);
    });

    it("clears slower input for DOWN key", () => {
      const world = createWorld();
      world.input.slower = true;
      handleKeyUp(world, KEY.DOWN);
      expect(world.input.slower).toBe(false);
    });
  });

  describe("update", () => {
    it("accelerates player when faster is pressed", () => {
      const world = createWorld();
      world.input.faster = true;
      const initialSpeed = world.player.speed;

      update(world, 1 / 60);

      expect(world.player.speed).toBeGreaterThan(initialSpeed);
    });

    it("decelerates player when slower is pressed", () => {
      const world = createWorld();
      world.player.speed = 1000;
      world.input.slower = true;
      const initialSpeed = world.player.speed;

      update(world, 1 / 60);

      expect(world.player.speed).toBeLessThan(initialSpeed);
    });

    it("decelerates player naturally when no input", () => {
      const world = createWorld();
      world.player.speed = 1000;
      const initialSpeed = world.player.speed;

      update(world, 1 / 60);

      expect(world.player.speed).toBeLessThan(initialSpeed);
    });

    it("moves player left when left is pressed", () => {
      const world = createWorld();
      world.player.speed = 1000;
      world.input.left = true;
      const initialX = world.player.x;

      update(world, 1 / 60);

      expect(world.player.x).toBeLessThan(initialX);
    });

    it("moves player right when right is pressed", () => {
      const world = createWorld();
      world.player.speed = 1000;
      world.input.right = true;
      const initialX = world.player.x;

      update(world, 1 / 60);

      expect(world.player.x).toBeGreaterThan(initialX);
    });

    it("limits player x position", () => {
      const world = createWorld();
      world.player.x = -5;
      world.player.speed = 100;

      update(world, 1 / 60);

      expect(world.player.x).toBeGreaterThanOrEqual(-3);
    });

    it("limits player speed", () => {
      const world = createWorld();
      world.player.speed = 999999;
      world.input.faster = true;

      update(world, 1 / 60);

      expect(world.player.speed).toBeLessThanOrEqual(world.config.maxSpeed);
    });

    it("does not go below zero speed", () => {
      const world = createWorld();
      world.player.speed = 0;
      world.input.slower = true;

      update(world, 1 / 60);

      expect(world.player.speed).toBeGreaterThanOrEqual(0);
    });

    it("updates lap time", () => {
      const world = createWorld();
      world.player.position = world.player.z + 100;

      update(world, 1 / 60);

      expect(world.currentLapTime).toBeGreaterThan(0);
    });

    it("advances position based on speed", () => {
      const world = createWorld();
      world.player.speed = 1000;
      const initialPosition = world.player.position;

      update(world, 1 / 60);

      expect(world.player.position).toBeGreaterThan(initialPosition);
    });

    it("decelerates when off road", () => {
      const world = createWorld();
      world.player.speed = 5000;
      world.player.x = -1.5;

      update(world, 1 / 60);

      expect(world.player.speed).toBeLessThan(5000);
    });

    it("applies centrifugal force on curves", () => {
      const world = createWorld();
      world.player.speed = 10000;
      world.player.x = 0;

      const playerSegmentIndex = Math.floor(
        (world.player.position + world.player.z) / world.config.segmentLength,
      );
      const playerSegment = world.segments[playerSegmentIndex];
      if (playerSegment) {
        playerSegment.curve = 5;
      }

      update(world, 1 / 60);

      expect(world.player.x).toBeLessThan(0);
    });

    it("wraps position around track", () => {
      const world = createWorld();
      world.player.speed = 1000;
      world.player.position = world.trackLength - 100;

      update(world, 1 / 60);

      expect(world.player.position).toBeGreaterThanOrEqual(0);
    });
  });

  describe("resetCars", () => {
    it("creates specified number of cars", () => {
      const world = createWorld();
      resetCars(world, 10);
      expect(world.cars).toHaveLength(10);
    });

    it("places cars on segments", () => {
      const world = createWorld();
      resetCars(world, 10);

      let carsOnSegments = 0;
      for (const segment of world.segments) {
        carsOnSegments += segment.cars.length;
      }
      expect(carsOnSegments).toBe(10);
    });
  });

  describe("getMirrorCars", () => {
    const createMockCar = (z: number, offset: number = 0) => ({
      z,
      offset,
      sprite: { x: 0, y: 0, w: 80, h: 56 },
      speed: 100,
    });

    it("returns empty array when no cars are behind", () => {
      const cars = [createMockCar(1000), createMockCar(2000)];
      const result = getMirrorCars(cars, 500, 10000, 1000);
      expect(result).toHaveLength(0);
    });

    it("returns cars that are behind the player", () => {
      const cars = [createMockCar(400), createMockCar(300)];
      const result = getMirrorCars(cars, 500, 10000, 1000);
      expect(result).toHaveLength(2);
    });

    it("limits to maxCars", () => {
      const cars = [
        createMockCar(400),
        createMockCar(350),
        createMockCar(300),
        createMockCar(250),
      ];
      const result = getMirrorCars(cars, 500, 10000, 1000, 2);
      expect(result).toHaveLength(2);
    });

    it("handles track wraparound", () => {
      const trackLength = 10000;
      const cars = [createMockCar(trackLength - 100)];
      const result = getMirrorCars(cars, 50, trackLength, 200);
      expect(result).toHaveLength(1);
      expect(result[0]?.distance).toBeGreaterThan(0);
    });

    it("sorts by distance descending", () => {
      const cars = [createMockCar(400), createMockCar(200)];
      const result = getMirrorCars(cars, 500, 10000, 1000);
      expect(result[0]?.distance).toBeGreaterThan(result[1]?.distance ?? 0);
    });

    it("normalizes distance correctly", () => {
      const mirrorRange = 1000;
      const cars = [createMockCar(400)];
      const result = getMirrorCars(cars, 500, 10000, mirrorRange);
      expect(result[0]?.distance).toBe(0.1);
    });

    it("excludes cars outside mirror range", () => {
      const mirrorRange = 100;
      const cars = [createMockCar(300)];
      const result = getMirrorCars(cars, 500, 10000, mirrorRange);
      expect(result).toHaveLength(0);
    });

    it("assigns colors based on offset", () => {
      const cars = [
        createMockCar(400, 0.1),
        createMockCar(350, 0.2),
        createMockCar(300, 0.3),
      ];
      const result = getMirrorCars(cars, 500, 10000, 1000);
      const colors = result.map((c) => c.color);
      expect(new Set(colors).size).toBeGreaterThan(1);
    });
  });
});
