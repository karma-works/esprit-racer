import { describe, it, expect } from "vitest";
import {
  KEY,
  COLORS,
  SPRITES,
  SPRITE_SCALE,
  SPRITE_GROUPS,
  ROAD,
  BACKGROUND,
} from "../../src/engine/constants";

describe("constants", () => {
  describe("KEY", () => {
    it("has arrow key codes", () => {
      expect(KEY.LEFT).toBe(37);
      expect(KEY.UP).toBe(38);
      expect(KEY.RIGHT).toBe(39);
      expect(KEY.DOWN).toBe(40);
    });

    it("has WASD key codes", () => {
      expect(KEY.A).toBe(65);
      expect(KEY.W).toBe(87);
      expect(KEY.D).toBe(68);
      expect(KEY.S).toBe(83);
    });

    it("has space key code", () => {
      expect(KEY.SPACE).toBe(32);
    });
  });

  describe("COLORS", () => {
    it("has sky and tree colors", () => {
      expect(COLORS.SKY).toBe("#72D7EE");
      expect(COLORS.TREE).toBe("#005108");
      expect(COLORS.FOG).toBe("#005108");
    });

    it("has light segment colors", () => {
      expect(COLORS.LIGHT.road).toBe("#6B6B6B");
      expect(COLORS.LIGHT.grass).toBe("#10AA10");
      expect(COLORS.LIGHT.rumble).toBe("#555555");
      expect(COLORS.LIGHT.lane).toBe("#CCCCCC");
    });

    it("has dark segment colors", () => {
      expect(COLORS.DARK.road).toBe("#696969");
      expect(COLORS.DARK.grass).toBe("#009A00");
      expect(COLORS.DARK.rumble).toBe("#BBBBBB");
    });

    it("has start and finish colors", () => {
      expect(COLORS.START.road).toBe("white");
      expect(COLORS.START.grass).toBe("white");
      expect(COLORS.FINISH.road).toBe("black");
      expect(COLORS.FINISH.grass).toBe("black");
    });

    it("has checkpoint color", () => {
      expect(COLORS.CHECKPOINT.road).toBe("#FFFF88");
      expect(COLORS.CHECKPOINT.grass).toBe("#FFFF88");
      expect(COLORS.CHECKPOINT.rumble).toBe("#FFFF88");
    });
  });

  describe("SPRITES", () => {
    it("has player sprites", () => {
      expect(SPRITES.PLAYER_STRAIGHT).toBeDefined();
      expect(SPRITES.PLAYER_LEFT).toBeDefined();
      expect(SPRITES.PLAYER_RIGHT).toBeDefined();
      expect(SPRITES.PLAYER_UPHILL_STRAIGHT).toBeDefined();
    });

    it("has car sprites", () => {
      expect(SPRITES.CAR01).toBeDefined();
      expect(SPRITES.CAR02).toBeDefined();
      expect(SPRITES.CAR03).toBeDefined();
      expect(SPRITES.CAR04).toBeDefined();
    });

    it("has scenery sprites", () => {
      expect(SPRITES.TREE1).toBeDefined();
      expect(SPRITES.TREE2).toBeDefined();
      expect(SPRITES.PALM_TREE).toBeDefined();
      expect(SPRITES.BOULDER1).toBeDefined();
    });

    it("has banner sprites", () => {
      expect(SPRITES.CHECKPOINT_BANNER).toBeDefined();
      expect(SPRITES.FINISH_BANNER).toBeDefined();
      expect(SPRITES.CHECKPOINT_BANNER.w).toBe(400);
      expect(SPRITES.FINISH_BANNER.w).toBe(400);
    });

    it("sprites have required properties", () => {
      const sprite = SPRITES.PLAYER_STRAIGHT;
      expect(sprite.x).toBeDefined();
      expect(sprite.y).toBeDefined();
      expect(sprite.w).toBeDefined();
      expect(sprite.h).toBeDefined();
    });
  });

  describe("SPRITE_SCALE", () => {
    it("is calculated from player sprite width", () => {
      expect(SPRITE_SCALE).toBe(0.3 * (1 / SPRITES.PLAYER_STRAIGHT.w));
    });

    it("is a positive number", () => {
      expect(SPRITE_SCALE).toBeGreaterThan(0);
    });
  });

  describe("SPRITE_GROUPS", () => {
    it("has billboards array", () => {
      expect(SPRITE_GROUPS.BILLBOARDS).toBeInstanceOf(Array);
      expect(SPRITE_GROUPS.BILLBOARDS.length).toBeGreaterThan(0);
    });

    it("has plants array", () => {
      expect(SPRITE_GROUPS.PLANTS).toBeInstanceOf(Array);
      expect(SPRITE_GROUPS.PLANTS.length).toBeGreaterThan(0);
    });

    it("has cars array", () => {
      expect(SPRITE_GROUPS.CARS).toBeInstanceOf(Array);
      expect(SPRITE_GROUPS.CARS.length).toBeGreaterThan(0);
    });
  });

  describe("ROAD", () => {
    it("has length presets", () => {
      expect(ROAD.LENGTH.NONE).toBe(0);
      expect(ROAD.LENGTH.SHORT).toBe(25);
      expect(ROAD.LENGTH.MEDIUM).toBe(50);
      expect(ROAD.LENGTH.LONG).toBe(100);
    });

    it("has hill presets", () => {
      expect(ROAD.HILL.NONE).toBe(0);
      expect(ROAD.HILL.LOW).toBe(20);
      expect(ROAD.HILL.MEDIUM).toBe(40);
      expect(ROAD.HILL.HIGH).toBe(60);
    });

    it("has curve presets", () => {
      expect(ROAD.CURVE.NONE).toBe(0);
      expect(ROAD.CURVE.EASY).toBe(2);
      expect(ROAD.CURVE.MEDIUM).toBe(4);
      expect(ROAD.CURVE.HARD).toBe(6);
    });
  });

  describe("BACKGROUND", () => {
    it("has layers with coordinates", () => {
      expect(BACKGROUND.HILLS.x).toBe(5);
      expect(BACKGROUND.HILLS.y).toBe(5);
      expect(BACKGROUND.HILLS.w).toBe(1280);
      expect(BACKGROUND.HILLS.h).toBe(480);
    });

    it("has sky layer", () => {
      expect(BACKGROUND.SKY).toBeDefined();
      expect(BACKGROUND.SKY.h).toBe(480);
    });

    it("has trees layer", () => {
      expect(BACKGROUND.TREES).toBeDefined();
    });
  });
});
