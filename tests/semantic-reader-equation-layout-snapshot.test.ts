import assert from "node:assert/strict";
import test from "node:test";

import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import {
  compileKpReaderEquationMaterialPlan,
  createKpReaderEquationLayoutSnapshot,
  projectKpReaderEquationRenderPlan,
  type KpReaderEquationMaterialPlan
} from "../src/reader/renderers/public-api.ts";

function materialPlan(): KpReaderEquationMaterialPlan {
  const animation = createLinearSolveAnimationAsset();
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    id: "runtime.reader.layout",
    animation,
    progress: 0.5
  });
  return compileKpReaderEquationMaterialPlan(
    projectKpReaderEquationRenderPlan({ animation, runtimeFrame })
  );
}

test("layout snapshots convert one explicit measurement pass to local geometry", () => {
  const plan = materialPlan();
  const transition = plan.transitions[0]!;
  const measurements = transition.anchors.map((anchor, index) => ({
    anchorId: anchor.id,
    rect: {
      left: 120 + index * 12,
      top: anchor.side === "source" ? 60 : 100,
      width: 10,
      height: 20
    }
  }));
  const snapshot = createKpReaderEquationLayoutSnapshot({
    materialPlan: plan,
    transitionId: transition.transitionId,
    revision: 3,
    coordinateSpaceId: "fixture.equation-stage",
    rootRect: { left: 100, top: 40, width: 320, height: 120 },
    measurements
  });

  assert.equal(snapshot.kind, "reader-equation-layout-snapshot");
  assert.equal(snapshot.revision, 3);
  assert.deepEqual(snapshot.measurementIdentity, {
    revision: 3,
    coordinateSpaceId: "fixture.equation-stage"
  });
  assert.deepEqual(snapshot.viewport, { width: 320, height: 120 });
  assert.deepEqual(snapshot.anchors[0]?.rect, {
    left: 20,
    top: 20,
    width: 10,
    height: 20
  });
  assert.deepEqual(snapshot.anchors[0]?.center, { x: 25, y: 30 });

  const cancellation = snapshot.owners.find((owner) =>
    owner.ownerId.endsWith(".left-inverses-cancel")
  );
  assert.deepEqual(cancellation?.sourceBounds, {
    left: 32,
    top: 20,
    width: 22,
    height: 20
  });
  assert.equal(cancellation?.targetBounds, undefined);
});

test("layout snapshots reject missing duplicate and zero-size anchor measurements", () => {
  const plan = materialPlan();
  const transition = plan.transitions[0]!;
  const measurements = transition.anchors.map((anchor, index) => ({
    anchorId: anchor.id,
    rect: { left: index * 10, top: 0, width: 8, height: 16 }
  }));
  const base = {
    materialPlan: plan,
    transitionId: transition.transitionId,
    revision: 0,
    coordinateSpaceId: "fixture.equation-stage",
    rootRect: { left: 0, top: 0, width: 200, height: 40 }
  };

  assert.throws(
    () => createKpReaderEquationLayoutSnapshot({
      ...base,
      measurements: measurements.slice(1)
    }),
    /missing measurement/
  );
  assert.throws(
    () => createKpReaderEquationLayoutSnapshot({
      ...base,
      measurements: [...measurements, measurements[0]!]
    }),
    /repeats measurement/
  );
  assert.throws(
    () => createKpReaderEquationLayoutSnapshot({
      ...base,
      measurements: measurements.map((measurement, index) =>
        index === 0
          ? { ...measurement, rect: { ...measurement.rect, width: 0 } }
          : measurement
      )
    }),
    /not measurably rendered/
  );
  assert.throws(
    () => createKpReaderEquationLayoutSnapshot({
      ...base,
      coordinateSpaceId: " ",
      measurements
    }),
    /coordinate-space id must be non-empty/
  );
});
