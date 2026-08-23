import assert from "node:assert/strict";
import test from "node:test";
import {
  createKpReaderCompositorGeometryCacheIdentity,
  createKpReaderCompositorPurePlanCache
} from "../src/reader/runtime/public-api.ts";

const identity = (revision: number) =>
  createKpReaderCompositorGeometryCacheIdentity({
    transitionId: "fixture.transition",
    renderPlanId: "fixture.render",
    materialPlanId: "fixture.material",
    fontRevision: 1,
    typographyCacheKey: "fixture.typography",
    measurementIdentity: {
      coordinateSpaceId: "fixture.stage",
      revision
    },
    layoutApplicationId: "fixture.layout",
    surfaceWidthPx: 800,
    surfaceHeightPx: 600,
    devicePixelRatio: 1,
    motionMode: "continuous",
    presentationGeometryRevision: "fixture.presentation"
  });

test("pure-plan cache is bounded and keyed only by branded geometry identity", () => {
  const cache = createKpReaderCompositorPurePlanCache<{ id: number }>(2);
  cache.set(identity(1), { id: 1 });
  cache.set(identity(2), { id: 2 });
  assert.equal(cache.get(identity(1))?.id, 1);

  cache.set(identity(3), { id: 3 });
  assert.equal(cache.get(identity(2)), undefined);
  assert.equal(cache.get(identity(1))?.id, 1);
  assert.equal(cache.get(identity(3))?.id, 3);
  assert.equal(cache.size, 2);

  cache.clear();
  assert.equal(cache.size, 0);
});
