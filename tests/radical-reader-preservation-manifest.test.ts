import assert from "node:assert/strict";
import test from "node:test";

import {
  createExponentRadicalRewriteAnimationAsset
} from "../src/animation/exponent-radical-adapter.ts";
import {
  createKpGovernedRadicalSuccessionFixture
} from "../src/authoring/governed-radical-succession-fixture.ts";
import {
  kpRadicalSuccessionPreservationManifest as manifest
} from "../src/reader/compiler/radical-succession-preservation-manifest.ts";
import {
  getGeneratedRadicalTutorialFixtureSpec
} from "../src/semantic/generated-algebra-fixture-registry.ts";
import {
  createGeneratedRadicalTutorialFixture
} from "../src/semantic/generated-algebra-tutorial-fixture.ts";

test("radical reader manifest freezes existing semantic and governed authority", () => {
  const animation = createExponentRadicalRewriteAnimationAsset();
  const governed = createKpGovernedRadicalSuccessionFixture();

  assert.equal(animation.id, manifest.animation.id);
  assert.deepEqual(
    animation.bundle.objects.map(({ id }) => id),
    manifest.animation.stateIds
  );
  assert.deepEqual(
    animation.bundle.objects.map(({ value }) => (value as { latex: string }).latex),
    manifest.animation.latex
  );
  assert.deepEqual(
    animation.transformations.map(({ id }) => id),
    manifest.animation.transformationIds
  );
  assert.deepEqual(
    animation.transformations.map(({ definitionId }) => definitionId),
    manifest.animation.definitionIds
  );
  assert.deepEqual(
    animation.transformations.flatMap(({ correspondenceMap }) =>
      correspondenceMap!.records.map(({ relation }) => relation)
    ),
    manifest.animation.lineageRelations
  );
  assert.deepEqual(animation.timeline, {
    id: manifest.animation.timelineId,
    durationMs: manifest.animation.durationMs,
    beatCount: manifest.animation.beatCount
  });
  assert.equal(animation.layout?.id, manifest.presentation.layoutId);
  assert.equal(animation.layout?.kind, manifest.presentation.layoutKind);
  assert.deepEqual(
    governed.compilation.mathematicalVerification.operations[0]?.strictLawIds,
    manifest.animation.strictLawIds
  );
});

test("radical reader focus contract covers every existing structural selector", () => {
  const animation = createExponentRadicalRewriteAnimationAsset();
  const selectorIds = animation.bundle.objects.flatMap(
    ({ selectors }) => selectors.map(({ id }) => id)
  );
  assert.deepEqual(selectorIds, manifest.focusSelectorIds);
  assert.equal(manifest.presentation.nativeEndpointAuthority, "native-katex");
  assert.equal(manifest.presentation.canonicalPaintPolicy, "exclusive-when-active");
  assert.equal(
    manifest.presentation.compatibilityPaintPolicy,
    "empty-when-canonical-active"
  );
});

test("radical reader preserves generated learning and export artifacts", () => {
  const spec = getGeneratedRadicalTutorialFixtureSpec(
    "generated.radical.square-root-as-power"
  );
  assert.ok(spec);
  const fixture = createGeneratedRadicalTutorialFixture(spec);
  const animation = createExponentRadicalRewriteAnimationAsset();

  assert.ok(fixture.flashcards.some(
    ({ id }) => id === manifest.learningArtifacts.existingCardId
  ));
  assert.ok(animation.exportTargets.some(
    ({ id }) => id === manifest.learningArtifacts.exportTargetId
  ));
  assert.equal(
    manifest.learningArtifacts.readerClozePolicy,
    "preserve-existing-generated-card"
  );
});

test("radical reader contract preserves semantic DOM and old editor boundary", () => {
  assert.equal(manifest.accessibility.semanticDomOwner, "reader");
  assert.equal(manifest.accessibility.nativeMathml, true);
  assert.equal(manifest.accessibility.movingPaintAriaHidden, true);
  assert.equal(manifest.accessibility.movingPaintInert, true);
  assert.equal(manifest.compatibility.existingReaderBudgetsMayIncrease, false);
  assert.match(
    manifest.compatibility.preservedEditorRepresentationId,
    /^editor-animation\.sample\.animation\.radical-rewrite/
  );
  assert.match(
    manifest.compatibility.preservedResidualDecision,
    /radical-cross-renderer-handoff-residual\.md$/
  );
});
