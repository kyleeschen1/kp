import assert from "node:assert/strict";
import test from "node:test";
import primary from "../src/authoring/examples/composed-algebra-intuition.json" with { type: "json" };
import { checkKpComposedAlgebraPrefixV2 } from "../src/authoring/composed-algebra-prefix-v2.ts";
import { verifyKpComposedGroupPartition } from "../src/semantic/composed-algebra-group-partition.ts";
import { bindKpComposedGroupEndpointHandoff, createKpEquationEndpointHandoffResolver, isKpVerifiedEquationEndpointHandoff } from "../src/semantic/equation-endpoint-handoff.ts";
import { projectKpContextualConstantSum } from "../src/semantic/contextual-constant-sum-projection.ts";
import { scalarEquation, scalarToken } from "../src/semantic/integer-multiple-equation-projection.ts";
import { composeKpSemanticOperationProjections, type KpSemanticOperationProjection } from "../src/semantic/semantic-operation-projection.ts";
import { createKpSemanticTransformation } from "../src/semantic/asset-transformation.ts";
import { createKpAssetBundle } from "../src/semantic/asset.ts";
import { createKpAnimationAsset } from "../src/animation/asset.ts";
import { composeKpEquationOperationAssets } from "../src/animation/compose-equation-operation-assets.ts";
import { resolveKpComposedAlgebraPresentation } from "../src/authoring/composed-algebra-presentation.ts";
import { createEditableSemanticTransformationTree, createSemanticTransformationLeaf } from "../src/semantic/transformation-composition.ts";
import { createSemanticTransformationRef } from "../src/semantic/animation.ts";
import { compileKpAnimationTransformationPhaseCohorts } from "../src/animation/transformation-phase-cohorts.ts";

function fixture() {
  const checked = checkKpComposedAlgebraPrefixV2(primary), evaluation = checked.prefix.chain.steps[1];
  const group = evaluation.preservedContext;
  if (group.kind !== "sum") throw Error("fixture");
  const handoff = bindKpComposedGroupEndpointHandoff(verifyKpComposedGroupPartition({ evaluation,
    groupId: group.id, memberIds: [group.terms[0]!.id, group.terms[1]!.id] }));
  const source = handoff.target, id = "test.handoff.endpoint";
  const target = scalarEquation(id, source.tokens.map((token, i) => scalarToken(id, `token-${i}`, token.latex, token.kind)));
  // A test-only identity phase isolates composition. This does not assert
  // canonical distribution integration or compositor certification.
  const transformation = createKpSemanticTransformation({ id: "test.handoff.identity", title: "Identity probe", transformType: "testIdentity",
    preserves: ["value"],
    sourceObjectIds: [source.object.id], targetObjectIds: [target.object.id], correspondenceMap: { id: "test.handoff.map",
      records: source.tokens.map((token, i) => ({ id: `test.handoff.identity.${i}`, relation: "identity", sourceSelectorIds: [token.id],
        targetSelectorIds: [target.tokens[i]!.id], summary: "Preserve this view member." })) } });
  const after: KpSemanticOperationProjection = { endpoints: [source, target], transformation };
  const before = projectKpContextualConstantSum(evaluation);
  const beforeAnimation = resolveKpComposedAlgebraPresentation(checked.prefix).steps[1].animation;
  const afterAnimation = createKpAnimationAsset({ id: "animation.test.handoff", title: "Composition probe",
    bundle: createKpAssetBundle({ id: "asset.test.handoff", title: "Probe", objects: [source.object, target.object] }),
    transformations: [transformation], transformationTree: createEditableSemanticTransformationTree({ root: createSemanticTransformationLeaf(
      createSemanticTransformationRef({ id: transformation.id, kind: transformation.transformType,
        sourceObjectIds: transformation.sourceObjectIds, targetObjectIds: transformation.targetObjectIds, preserves: transformation.preserves })) }),
    timeline: { id: "timeline.test.handoff", durationMs: 100 }, presentationProfile: beforeAnimation.presentationProfile,
    renderTargets: [{ id: "render.test.handoff", kind: "equation", objectIds: [source.object.id, target.object.id], transformationIds: [transformation.id] }] });
  return { checked, evaluation, handoff, before, after, beforeAnimation, afterAnimation };
}

test("issued whole/member views cover the same state while preserving the whole carrier", () => {
  const { handoff, before } = fixture();
  assert.ok(isKpVerifiedEquationEndpointHandoff(handoff));
  assert.deepEqual(handoff.source, before.endpoints[1]);
  assert.deepEqual(handoff.source.tokens.map(token => token.latex), ["5", "(x+3)"]);
  assert.deepEqual(handoff.target.tokens.map(token => token.latex), ["5", "(", "x", "+", "3", ")"]);
  assert.notEqual(handoff.source.object.id, handoff.target.object.id);
  assert.deepEqual(handoff.coverage.flatMap(item => item.targetSelectorIds), handoff.target.tokens.map(token => token.id));
  assert.ok(Object.isFrozen(handoff.target.object.value) && Object.isFrozen(handoff.coverage[1]!.targetSelectorIds));
});

test("semantic and timed composition require the exact handoff and add no phase or stop", () => {
  const f = fixture();
  assert.throws(() => composeKpSemanticOperationProjections("unbound", [f.before, f.after]), /exact semantic endpoint/);
  assert.throws(() => composeKpEquationOperationAssets("unbound", "Unbound", [f.beforeAnimation, f.afterAnimation]), /exact adjacent/);
  const semantic = composeKpSemanticOperationProjections("bound", [f.before, f.after], [f.handoff]);
  assert.equal(semantic.transformations.length, 2);
  assert.equal(semantic.tokens.length, 3);
  assert.equal(semantic.bundle.objects.length, 4);
  const composed = composeKpEquationOperationAssets("bound", "Bound", [f.beforeAnimation, f.afterAnimation], [f.handoff]);
  assert.equal(compileKpAnimationTransformationPhaseCohorts(composed.animation).length, 2);
  assert.equal(composed.checkpointProgress.length, 3);
  assert.equal(composed.animation.timeline!.durationMs, f.beforeAnimation.timeline!.durationMs! + 100);
});

test("copied, stale, duplicate, unused, reversed and token-tampered handoffs are rejected", () => {
  const f = fixture();
  assert.throws(() => createKpEquationEndpointHandoffResolver([{ ...f.handoff }]), /issued/);
  assert.throws(() => createKpEquationEndpointHandoffResolver([f.handoff, f.handoff]), /duplicate/);
  assert.throws(() => createKpEquationEndpointHandoffResolver([f.handoff]).finish(), /unused/);
  const resolver = createKpEquationEndpointHandoffResolver([f.handoff]);
  assert.equal(resolver.connect(f.handoff.target.object, f.handoff.source.object), false);
  assert.equal(resolver.connect({ ...f.handoff.source.object, title: "Changed" }, f.handoff.target.object), false);
  assert.equal(resolver.connect(f.handoff.source.object, f.handoff.target.object), true);
  assert.throws(() => resolver.connect(f.handoff.source.object, f.handoff.target.object), /multiple/);
  resolver.finish();
  const changed = { ...f.after, endpoints: [{ ...f.after.endpoints[0], tokens: [] }, f.after.endpoints[1]] as const };
  assert.throws(() => composeKpSemanticOperationProjections("tampered", [f.before, changed], [f.handoff]), /exact semantic endpoint/);
  assert.throws(() => composeKpEquationOperationAssets("unused", "Unused", [f.beforeAnimation, f.afterAnimation], [f.handoff, fixture().handoff]), /exact adjacent/);
});
