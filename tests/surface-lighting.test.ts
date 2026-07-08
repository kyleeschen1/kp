import { strict as assert } from "node:assert";
import test from "node:test";

import {
  DEFAULT_SURFACE_LIGHT,
  surfaceQuadFill
} from "../src/rendering/surface-lighting.ts";

test("surfaceQuadFill computes the default front-facing lighting color", () => {
  assert.equal(
    surfaceQuadFill({
      center: { x: 0, y: 0, z: 0 },
      depthHaze: 0,
      facing: "front",
      light: DEFAULT_SURFACE_LIGHT,
      normal: { x: 0, y: 0, z: 1 },
      viewDirection: { x: 0, y: 0, z: 1 },
      xDomain: [-3, 3],
      yDomain: [-3, 3]
    }),
    "hsl(197 58% 58%)"
  );
});

test("surfaceQuadFill keeps back-facing cells in a lighter blue family", () => {
  assert.equal(
    surfaceQuadFill({
      center: { x: 0, y: 0, z: 0 },
      depthHaze: 0.25,
      facing: "back",
      light: DEFAULT_SURFACE_LIGHT,
      normal: { x: 0, y: 0, z: 1 },
      viewDirection: { x: 0, y: 0, z: 1 },
      xDomain: [-3, 3],
      yDomain: [-3, 3]
    }),
    "hsl(215 46% 71%)"
  );
});

test("surfaceQuadFill uses custom ambient and diffuse intensity", () => {
  assert.equal(
    surfaceQuadFill({
      center: { x: 0, y: 0, z: 0 },
      depthHaze: 0,
      facing: "front",
      light: {
        direction: { x: -0.35, y: -0.45, z: 0.82 },
        ambient: 0.2,
        diffuse: 0,
        depthHaze: 1,
        specular: 0,
        rim: 0
      },
      normal: { x: 0, y: 0, z: 1 },
      viewDirection: { x: 0, y: 0, z: 1 },
      xDomain: [-3, 3],
      yDomain: [-3, 3]
    }),
    "hsl(197 58% 46%)"
  );
});

test("surfaceQuadFill adds specular brightness when light reflects toward the viewer", () => {
  assert.equal(
    surfaceQuadFill({
      center: { x: 0, y: 0, z: 0 },
      depthHaze: 0,
      facing: "front",
      light: {
        direction: { x: 0, y: 0, z: 1 },
        ambient: 0,
        diffuse: 0,
        depthHaze: 1,
        specular: 0.4,
        rim: 0
      },
      normal: { x: 0, y: 0, z: 1 },
      viewDirection: { x: 0, y: 0, z: 1 },
      xDomain: [-3, 3],
      yDomain: [-3, 3]
    }),
    "hsl(197 58% 50%)"
  );
});

test("surfaceQuadFill adds rim brightness at grazing view angles", () => {
  assert.equal(
    surfaceQuadFill({
      center: { x: 0, y: 0, z: 0 },
      depthHaze: 0,
      facing: "front",
      light: {
        direction: { x: 0, y: 0, z: 1 },
        ambient: 0,
        diffuse: 0,
        depthHaze: 1,
        specular: 0,
        rim: 0.4
      },
      normal: { x: 1, y: 0, z: 0 },
      viewDirection: { x: 0, y: 0, z: 1 },
      xDomain: [-3, 3],
      yDomain: [-3, 3]
    }),
    "hsl(197 58% 50%)"
  );
});
