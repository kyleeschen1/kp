import assert from "node:assert/strict";
import test from "node:test";
import {
  createKpReaderCompositorGeometryCacheIdentity,
  type KpReaderCompositorGeometryCacheIdentityInput
} from "../src/reader/runtime/equation-compositor-geometry-cache-identity.ts";

const baseline: KpReaderCompositorGeometryCacheIdentityInput = {
  transitionId: "fraction.step.normalize",
  renderPlanId: "render.fraction",
  materialPlanId: "material.fraction",
  fontRevision: 1,
  measurementIdentity: {
    coordinateSpaceId: "fraction.stage",
    revision: 3
  },
  layoutApplicationId: "layout.two-row.3",
  viewportWidthPx: 390,
  viewportHeightPx: 844,
  devicePixelRatio: 2,
  motionMode: "continuous",
  presentationGeometryRevision: "presentation.standard.1"
};

if (false) {
  // @ts-expect-error Device pixel ratio is a mandatory invalidation authority.
  createKpReaderCompositorGeometryCacheIdentity({
    transitionId: "fixture.transition",
    renderPlanId: "fixture.render",
    materialPlanId: "fixture.material",
    fontRevision: 1,
    measurementIdentity: baseline.measurementIdentity,
    layoutApplicationId: "fixture.layout",
    viewportWidthPx: 800,
    viewportHeightPx: 600,
    motionMode: "continuous",
    presentationGeometryRevision: "fixture.presentation"
  });
}

test("every geometry authority invalidates the compositor cache identity", () => {
  const baselineKey =
    createKpReaderCompositorGeometryCacheIdentity(baseline).key;
  const variants: readonly KpReaderCompositorGeometryCacheIdentityInput[] = [
    { ...baseline, transitionId: "fraction.step.cancel" },
    { ...baseline, renderPlanId: "render.fraction.2" },
    { ...baseline, materialPlanId: "material.fraction.2" },
    { ...baseline, fontRevision: 2 },
    {
      ...baseline,
      measurementIdentity: {
        ...baseline.measurementIdentity,
        coordinateSpaceId: "fraction.stage.2"
      }
    },
    {
      ...baseline,
      measurementIdentity: {
        ...baseline.measurementIdentity,
        revision: 4
      }
    },
    { ...baseline, layoutApplicationId: "layout.single-row.3" },
    { ...baseline, viewportWidthPx: 391 },
    { ...baseline, viewportHeightPx: 845 },
    { ...baseline, devicePixelRatio: 1 },
    { ...baseline, motionMode: "essential" },
    {
      ...baseline,
      presentationGeometryRevision: "presentation.standard.2"
    }
  ];

  assert.equal(new Set(variants.map((variant) =>
    createKpReaderCompositorGeometryCacheIdentity(variant).key
  )).size, variants.length);
  for (const variant of variants) {
    assert.notEqual(
      createKpReaderCompositorGeometryCacheIdentity(variant).key,
      baselineKey
    );
  }
});

test("invalid geometry authority cannot produce a cache identity", () => {
  assert.throws(
    () => createKpReaderCompositorGeometryCacheIdentity({
      ...baseline,
      layoutApplicationId: " "
    }),
    /non-empty authority ids/
  );
  assert.throws(
    () => createKpReaderCompositorGeometryCacheIdentity({
      ...baseline,
      viewportWidthPx: 0
    }),
    /positive viewport width/
  );
  assert.throws(
    () => createKpReaderCompositorGeometryCacheIdentity({
      ...baseline,
      measurementIdentity: {
        ...baseline.measurementIdentity,
        revision: -1
      }
    }),
    /non-negative font and measurement revisions/
  );
});
