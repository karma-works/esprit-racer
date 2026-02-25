import { describe, it, expect } from "vitest";
import {
  createCamera,
  getPlayerZ,
  calculateResolution,
} from "../../src/engine/camera";

describe("camera", () => {
  describe("createCamera", () => {
    it("creates camera with field of view and height", () => {
      const camera = createCamera(100, 1000);

      expect(camera.fieldOfView).toBe(100);
      expect(camera.height).toBe(1000);
    });

    it("calculates camera depth from field of view", () => {
      const camera = createCamera(100, 1000);
      const expectedDepth = 1 / Math.tan(((100 / 2) * Math.PI) / 180);

      expect(camera.depth).toBeCloseTo(expectedDepth);
    });

    it("handles different field of view values", () => {
      const camera1 = createCamera(80, 1000);
      const camera2 = createCamera(120, 1000);

      expect(camera1.depth).toBeGreaterThan(camera2.depth);
    });
  });

  describe("getPlayerZ", () => {
    it("calculates player z position", () => {
      const z = getPlayerZ(1000, 0.5);
      expect(z).toBe(500);
    });

    it("scales with camera height", () => {
      const z1 = getPlayerZ(500, 0.5);
      const z2 = getPlayerZ(1000, 0.5);

      expect(z2).toBe(z1 * 2);
    });

    it("scales with camera depth", () => {
      const z1 = getPlayerZ(1000, 0.5);
      const z2 = getPlayerZ(1000, 1.0);

      expect(z2).toBe(z1 * 2);
    });
  });

  describe("calculateResolution", () => {
    it("calculates resolution relative to base height", () => {
      expect(calculateResolution(480, 480)).toBe(1);
      expect(calculateResolution(960, 480)).toBe(2);
      expect(calculateResolution(240, 480)).toBe(0.5);
    });

    it("uses 480 as default base height", () => {
      expect(calculateResolution(480)).toBe(1);
      expect(calculateResolution(960)).toBe(2);
    });
  });
});
