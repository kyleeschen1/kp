import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import primary from "../src/authoring/examples/composed-algebra-intuition.json" with { type: "json" };
import { checkKpComposedAlgebraProofV2 } from "../src/authoring/composed-algebra-proof-v2.ts";
import { resolveKpComposedAlgebraPresentationV2, assertKpComposedAlgebraPresentationV2 } from "../src/authoring/composed-algebra-presentation-v2.ts";
import { compileKpAnimationTransformationPhaseCohorts } from "../src/animation/transformation-phase-cohorts.ts";

test("complete presentation binds canonical owners with one invisible view handoff and no extra beat", () => {
  const checked = checkKpComposedAlgebraProofV2(primary), presentation = resolveKpComposedAlgebraPresentationV2(checked);
  assertKpComposedAlgebraPresentationV2(presentation);
  assert.deepEqual(presentation.steps.map(step => step.plan.planKind), ["factoring", "successor-synthesis", "distribution", "successor-synthesis"]);
  assert.deepEqual(presentation.steps.map(step => step.evaluationCertificates.length), [0, 1, 0, 1]);
  const catalogue = readFileSync(new URL("../src/editor/animation-library-metadata.generated.json", import.meta.url), "utf8");
  assert.ok(catalogue.includes(presentation.steps[2].canonicalReference));
  assert.equal(presentation.handoffs.length, 1);
  assert.equal(compileKpAnimationTransformationPhaseCohorts(presentation.animation).length, 4);
  assert.equal(presentation.checkpointProgress.length, 5);
  assert.equal(presentation.animation.timeline!.durationMs, presentation.steps.reduce((sum, step) => sum + step.animation.timeline!.durationMs!, 0));
  const shorter = resolveKpComposedAlgebraPresentationV2(checkKpComposedAlgebraProofV2({ ...primary, states: primary.states.slice(0, 4) }));
  assert.equal(shorter.steps.length, 3);
  assert.equal(shorter.checkpointProgress.length, 4);
});

test("presentation rejects copied or mutated authority and registers all proof kinds without local motion dispatch", () => {
  const checked = checkKpComposedAlgebraProofV2(primary);
  assert.throws(() => resolveKpComposedAlgebraPresentationV2({ ...checked }), /issued/);
  const presentation = resolveKpComposedAlgebraPresentationV2(checked);
  assert.throws(() => assertKpComposedAlgebraPresentationV2({ ...presentation }), /issued/);
  Object.defineProperty(presentation.animation, "title", { value: "Detached" });
  assert.throws(() => assertKpComposedAlgebraPresentationV2(presentation), /changed/);
  const source = readFileSync(new URL("../src/authoring/composed-algebra-presentation-v2.ts", import.meta.url), "utf8");
  assert.match(source, /defineKpSemanticOperationProjector/);
  assert.doesNotMatch(source, /switch\s*\(|correspondenceMap\s*:|durationMs\s*:/);
});
