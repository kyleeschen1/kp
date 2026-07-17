import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  kpOrganicSubtleStyleRef,
  kpRestrainedEditorialStyleRef
} from "../src/animation/gestalt-base-styles.ts";
import {
  createKpEditorAnimationGestaltInspection,
  parseKpEditorGestaltStyleRef
} from "../src/editor/animation-gestalt-inspector.ts";
import { createKpEditorAnimationLibrary } from "../src/editor/animation-library.ts";
import { createKpEditorAnimationPlayerState } from "../src/editor/animation-player-state.ts";

test("editor inspection exposes the resolved style and semantic choreography graph", () => {
  const catalog = createKpAnimationAssets();
  const descriptor = createKpEditorAnimationLibrary().find(
    (candidate) =>
      candidate.animationId === "animation.linear-solve.solve-x"
  )!;
  const animation = catalog.find(
    (candidate) => candidate.id === descriptor.animationId
  )!;
  const state = createKpEditorAnimationPlayerState({
    descriptor,
    animation,
    catalog,
    progress: 0.5,
    playbackStatus: "paused"
  });
  const inspection = createKpEditorAnimationGestaltInspection({
    animation,
    state,
    selectedStyle: kpOrganicSubtleStyleRef
  });

  assert.equal(inspection.status, "ready");
  assert.equal(inspection.selectedStyleKey, "kp.organic-subtle@1.0.0");
  assert.match(inspection.resolvedChainLabel, /kp\.organic-subtle@1\.0\.0/);
  assert.match(inspection.choreographyPlanId ?? "", /^choreography\./);
  assert.match(inspection.envelopePhaseLabel, /orient|reflow|act|settle|release/);
  assert.notEqual(inspection.focusGroupLabel, "unavailable");
  assert.match(inspection.salienceLabel, /\d+ nodes · \d+ transfers/);
  assert.match(inspection.traversalLabel, /rank/);
  assert.match(inspection.capabilityLabel, /^compatible/);
  assert.deepEqual(inspection.warnings, []);
});

test("style substitution changes realization only and keeps the inspected plan stable", () => {
  const catalog = createKpAnimationAssets();
  const descriptor = createKpEditorAnimationLibrary().find(
    (candidate) =>
      candidate.animationId ===
      "animation.generated.linear-algebra.dot-product.three-vector"
  )!;
  const animation = catalog.find(
    (candidate) => candidate.id === descriptor.animationId
  )!;
  const state = createKpEditorAnimationPlayerState({
    descriptor,
    animation,
    catalog,
    progress: 0.42,
    playbackStatus: "paused"
  });
  const organic = createKpEditorAnimationGestaltInspection({
    animation,
    state,
    selectedStyle: kpOrganicSubtleStyleRef
  });
  const restrained = createKpEditorAnimationGestaltInspection({
    animation,
    state,
    selectedStyle: kpRestrainedEditorialStyleRef
  });

  assert.equal(organic.choreographyPlanId, restrained.choreographyPlanId);
  assert.equal(organic.envelopePhaseLabel, restrained.envelopePhaseLabel);
  assert.equal(organic.salienceLabel, restrained.salienceLabel);
  assert.equal(organic.traversalLabel, restrained.traversalLabel);
  assert.notEqual(
    organic.resolvedStyle.fingerprint,
    restrained.resolvedStyle.fingerprint
  );
  assert.notDeepEqual(organic.channels, restrained.channels);
  assert.equal(restrained.resolvedStyle.pinnedStyle.id, "kp.organic-subtle");
  assert.equal(
    restrained.resolvedStyle.selectedStyle.id,
    "kp.restrained-editorial"
  );
});

test("radical inspection exposes one salience transfer per fragment succession", () => {
  const catalog = createKpAnimationAssets();
  const descriptor = createKpEditorAnimationLibrary().find(
    (candidate) =>
      candidate.animationId ===
      "animation.generated.radical.square-root-as-power"
  )!;
  const animation = catalog.find(
    (candidate) => candidate.id === descriptor.animationId
  )!;
  const state = createKpEditorAnimationPlayerState({
    descriptor,
    animation,
    catalog,
    progress: 0.55,
    playbackStatus: "paused"
  });
  const inspection = createKpEditorAnimationGestaltInspection({
    animation,
    state,
    selectedStyle: kpOrganicSubtleStyleRef
  });

  assert.match(
    inspection.choreographyPlanId ?? "",
    /rewrite-power-as-root/
  );
  assert.equal(inspection.salienceLabel, "4 nodes · 2 transfers");
  assert.equal(inspection.traversalLabel, "execution · 1 ranks");
});

test("unmigrated surfaces expose honest warnings and invalid style pins fall back", () => {
  const catalog = createKpAnimationAssets();
  const descriptor = createKpEditorAnimationLibrary().find(
    (candidate) => candidate.renderTargetKinds.includes("graph")
  )!;
  const animation = catalog.find(
    (candidate) => candidate.id === descriptor.animationId
  )!;
  const state = createKpEditorAnimationPlayerState({
    descriptor,
    animation,
    catalog,
    progress: 0.4
  });
  const inspection = createKpEditorAnimationGestaltInspection({
    animation,
    state,
    selectedStyle: parseKpEditorGestaltStyleRef("untrusted.style@9.0.0")
  });

  assert.equal(inspection.selectedStyleKey, "kp.organic-subtle@1.0.0");
  assert.equal(inspection.status, "warning");
  assert.ok(inspection.warnings.some((warning) =>
    warning.includes("not yet been migrated")
  ));
  assert.ok(inspection.warnings.some((warning) =>
    warning.includes("No gestalt renderer capability declaration")
  ));
});
