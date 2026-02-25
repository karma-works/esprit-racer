import type { CameraConfig } from "./types";

export const createCamera = (
  fieldOfView: number,
  height: number,
): CameraConfig => {
  const depth = 1 / Math.tan(((fieldOfView / 2) * Math.PI) / 180);
  return {
    height,
    depth,
    fieldOfView,
  };
};

export const getPlayerZ = (
  cameraHeight: number,
  cameraDepth: number,
): number => {
  return cameraHeight * cameraDepth;
};

export const calculateResolution = (
  height: number,
  baseHeight: number = 480,
): number => {
  return height / baseHeight;
};
