import { strict as assert } from "node:assert";
import test from "node:test";

import {
  projectPointToShadowPlane,
  projectQuadToShadowPlane
} from "../src/rendering/surface-shadow.ts";

test("projectPointToShadowPlane casts a point opposite the light direction onto a z plane", () => {
  assert.deepEqual(
    projectPointToShadowPlane({
      lightDirection: { x: 1, y: 0, z: 1 },
      planeZ: 0,
      point: { x: 0, y: 0, z: 2 }
    }),
    { x: -2, y: 0, z: 0 }
  );
});

test("projectPointToShadowPlane rejects lights that cannot reach the z plane", () => {
  assert.equal(
    projectPointToShadowPlane({
      lightDirection: { x: 1, y: 0, z: 0 },
      planeZ: 0,
      point: { x: 0, y: 0, z: 2 }
    }),
    undefined
  );
});

test("projectQuadToShadowPlane projects every quad corner", () => {
  assert.deepEqual(
    projectQuadToShadowPlane({
      corners: [
        { x: 0, y: 0, z: 2 },
        { x: 1, y: 0, z: 2 },
        { x: 1, y: 1, z: 1 },
        { x: 0, y: 1, z: 1 }
      ],
      lightDirection: { x: 0, y: 0, z: 1 },
      planeZ: -1
    }),
    [
      { x: 0, y: 0, z: -1 },
      { x: 1, y: 0, z: -1 },
      { x: 1, y: 1, z: -1 },
      { x: 0, y: 1, z: -1 }
    ]
  );
});
