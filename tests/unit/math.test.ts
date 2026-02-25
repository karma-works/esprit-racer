import { describe, it, expect } from "vitest";
import {
  timestamp,
  toInt,
  toFloat,
  limit,
  randomInt,
  percentRemaining,
  accelerate,
  interpolate,
  easeIn,
  easeOut,
  easeInOut,
  exponentialFog,
  increase,
  overlap,
  project,
} from "../../src/engine/utils/math";
import type { ProjectablePoint } from "../../src/engine/utils/math";

describe("timestamp", () => {
  it("returns a number", () => {
    const result = timestamp();
    expect(typeof result).toBe("number");
  });

  it("returns current time in milliseconds", () => {
    const before = Date.now();
    const result = timestamp();
    const after = Date.now();
    expect(result).toBeGreaterThanOrEqual(before);
    expect(result).toBeLessThanOrEqual(after);
  });
});

describe("toInt", () => {
  it("parses string to integer", () => {
    expect(toInt("42", 0)).toBe(42);
    expect(toInt("-10", 0)).toBe(-10);
  });

  it("returns default for invalid input", () => {
    expect(toInt("abc", 5)).toBe(5);
    expect(toInt(null, 10)).toBe(10);
    expect(toInt(undefined, 15)).toBe(15);
  });

  it("handles number input", () => {
    expect(toInt(42, 0)).toBe(42);
    expect(toInt(3.7, 0)).toBe(3);
  });
});

describe("toFloat", () => {
  it("parses string to float", () => {
    expect(toFloat("3.14", 0)).toBeCloseTo(3.14);
    expect(toFloat("-2.5", 0)).toBeCloseTo(-2.5);
  });

  it("returns default for invalid input", () => {
    expect(toFloat("abc", 5.5)).toBe(5.5);
    expect(toFloat(null, 10.5)).toBe(10.5);
    expect(toFloat(undefined, 15.5)).toBe(15.5);
  });

  it("handles number input", () => {
    expect(toFloat(3.14, 0)).toBeCloseTo(3.14);
  });
});

describe("limit", () => {
  it("returns value within bounds", () => {
    expect(limit(5, 0, 10)).toBe(5);
  });

  it("returns min when value is below", () => {
    expect(limit(-5, 0, 10)).toBe(0);
  });

  it("returns max when value is above", () => {
    expect(limit(15, 0, 10)).toBe(10);
  });

  it("handles negative bounds", () => {
    expect(limit(-15, -10, 10)).toBe(-10);
    expect(limit(15, -10, 10)).toBe(10);
  });
});

describe("randomInt", () => {
  it("returns value within range", () => {
    for (let i = 0; i < 100; i++) {
      const result = randomInt(0, 10);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(10);
    }
  });

  it("handles negative range", () => {
    for (let i = 0; i < 100; i++) {
      const result = randomInt(-10, -5);
      expect(result).toBeGreaterThanOrEqual(-10);
      expect(result).toBeLessThanOrEqual(-5);
    }
  });
});

describe("percentRemaining", () => {
  it("calculates remaining percentage", () => {
    expect(percentRemaining(50, 100)).toBe(0.5);
    expect(percentRemaining(25, 100)).toBe(0.25);
    expect(percentRemaining(150, 100)).toBe(0.5);
  });

  it("returns 0 for exact multiples", () => {
    expect(percentRemaining(100, 100)).toBe(0);
    expect(percentRemaining(200, 100)).toBe(0);
  });
});

describe("accelerate", () => {
  it("increases velocity with positive acceleration", () => {
    expect(accelerate(10, 5, 1)).toBe(15);
    expect(accelerate(10, 5, 0.5)).toBe(12.5);
  });

  it("decreases velocity with negative acceleration", () => {
    expect(accelerate(10, -5, 1)).toBe(5);
    expect(accelerate(10, -15, 1)).toBe(-5);
  });

  it("handles zero acceleration", () => {
    expect(accelerate(10, 0, 1)).toBe(10);
  });
});

describe("interpolate", () => {
  it("interpolates between values", () => {
    expect(interpolate(0, 100, 0)).toBe(0);
    expect(interpolate(0, 100, 1)).toBe(100);
    expect(interpolate(0, 100, 0.5)).toBe(50);
  });

  it("extrapolates beyond range", () => {
    expect(interpolate(0, 100, 2)).toBe(200);
    expect(interpolate(0, 100, -1)).toBe(-100);
  });
});

describe("easeIn", () => {
  it("starts slow and accelerates", () => {
    const result0 = easeIn(0, 100, 0);
    const result25 = easeIn(0, 100, 0.25);
    const result50 = easeIn(0, 100, 0.5);
    const result100 = easeIn(0, 100, 1);

    expect(result0).toBe(0);
    expect(result100).toBe(100);
    expect(result25).toBeLessThan(25);
    expect(result50).toBeLessThan(50);
  });
});

describe("easeOut", () => {
  it("starts fast and decelerates", () => {
    const result0 = easeOut(0, 100, 0);
    const result25 = easeOut(0, 100, 0.25);
    const result50 = easeOut(0, 100, 0.5);
    const result100 = easeOut(0, 100, 1);

    expect(result0).toBe(0);
    expect(result100).toBe(100);
    expect(result25).toBeGreaterThan(25);
    expect(result50).toBeGreaterThan(50);
  });
});

describe("easeInOut", () => {
  it("combines ease in and ease out", () => {
    const result0 = easeInOut(0, 100, 0);
    const result50 = easeInOut(0, 100, 0.5);
    const result100 = easeInOut(0, 100, 1);

    expect(result0).toBe(0);
    expect(result50).toBeCloseTo(50);
    expect(result100).toBe(100);
  });
});

describe("exponentialFog", () => {
  it("returns 1 at distance 0", () => {
    expect(exponentialFog(0, 5)).toBe(1);
  });

  it("decreases with distance", () => {
    const near = exponentialFog(0.1, 5);
    const far = exponentialFog(0.5, 5);
    expect(near).toBeGreaterThan(far);
  });

  it("decreases faster with higher density", () => {
    const lowDensity = exponentialFog(0.5, 1);
    const highDensity = exponentialFog(0.5, 10);
    expect(lowDensity).toBeGreaterThan(highDensity);
  });
});

describe("increase", () => {
  it("adds increment to start", () => {
    expect(increase(10, 5, 100)).toBe(15);
  });

  it("wraps around at max", () => {
    expect(increase(95, 10, 100)).toBe(5);
    expect(increase(99, 1, 100)).toBe(0);
  });

  it("handles negative results", () => {
    expect(increase(5, -10, 100)).toBe(95);
    expect(increase(0, -1, 100)).toBe(99);
  });
});

describe("overlap", () => {
  it("detects overlapping ranges", () => {
    expect(overlap(0, 10, 5, 10)).toBe(true);
    expect(overlap(0, 10, 8, 10)).toBe(true);
  });

  it("detects non-overlapping ranges", () => {
    expect(overlap(0, 10, 15, 10)).toBe(false);
    expect(overlap(0, 5, 10, 5)).toBe(false);
  });

  it("handles touching edges", () => {
    expect(overlap(0, 10, 10, 10)).toBe(true);
  });

  it("respects percent parameter", () => {
    expect(overlap(0, 10, 5, 10, 0.5)).toBe(true);
    expect(overlap(0, 10, 6, 10, 0.5)).toBe(false);
  });
});

describe("project", () => {
  it("projects a point to screen coordinates", () => {
    const p: ProjectablePoint = {
      world: { x: 0, y: 0, z: 100 },
      camera: { x: 0, y: 0, z: 0 },
      screen: { x: 0, y: 0, scale: 0 },
    };

    project(p, 0, 0, 0, 1, 800, 600, 2000);

    expect(p.camera.x).toBe(0);
    expect(p.camera.y).toBe(0);
    expect(p.camera.z).toBe(100);
    expect(p.screen.scale).toBeCloseTo(0.01);
    expect(typeof p.screen.x).toBe("number");
    expect(typeof p.screen.y).toBe("number");
  });

  it("handles offset camera position", () => {
    const p: ProjectablePoint = {
      world: { x: 100, y: 50, z: 200 },
      camera: { x: 0, y: 0, z: 0 },
      screen: { x: 0, y: 0, scale: 0 },
    };

    project(p, 50, 25, 100, 1, 800, 600, 2000);

    expect(p.camera.x).toBe(50);
    expect(p.camera.y).toBe(25);
    expect(p.camera.z).toBe(100);
  });

  it("handles undefined world coordinates", () => {
    const p: ProjectablePoint = {
      world: {},
      camera: { x: 0, y: 0, z: 0 },
      screen: { x: 0, y: 0, scale: 0 },
    };

    project(p, 0, 0, 0, 1, 800, 600, 2000);

    expect(p.camera.x).toBe(0);
    expect(p.camera.y).toBe(0);
    expect(p.camera.z).toBe(0);
  });
});
