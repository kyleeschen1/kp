import assert from "node:assert/strict";
import test from "node:test";
import { createKpCommonFactorExample } from "../src/authoring/common-factor-author-check.ts";
import { prepareKpCommonFactorDraft } from "../src/authoring/common-factor-draft.ts";
import { assertKpCommonFactorPresentation, resolveKpCommonFactorPresentation } from "../src/authoring/common-factor-presentation.ts";
import { findKpRegisteredOperationPresentationPlan } from "../src/animation/operation-presentation-plan-types.ts";
import { projectKpReaderEquationRenderPlan } from "../src/reader/renderers/equation-render-plan.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import { assertKpCompleteFactoringChoreography, sampleKpFactoringChoreography } from "../src/animation/factoring-choreography.ts";

test("authored host and native dispatch share the resolver's complete operation plan", () => {
  const draft = prepareKpCommonFactorDraft(createKpCommonFactorExample());
  const binding = draft.presentation;
  assertKpCommonFactorPresentation(binding);
  assert.equal(binding.revisionId, draft.revisionId);
  assert.equal(binding.animation, draft.animation);
  assert.equal(binding.plan.choreography?.phaseIds.length, 7);
  assert.equal(binding.plan.choreography?.groupingArtifactIds.length, 2);
  const choreography = binding.plan.choreography;
  assertKpCompleteFactoringChoreography(choreography);
  assert.throws(() => sampleKpFactoringChoreography({ plan: { ...choreography }, progress: .5 }), TypeError);
  assert.equal(Object.isFrozen(choreography.addendPairs), true);
  const plan = projectKpReaderEquationRenderPlan({ animation: binding.animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({ animation: binding.animation, progress: .37 }) });
  assert.equal(plan.transitions[0]!.presentationPlan.planKind, "factoring");
  assert.equal(findKpRegisteredOperationPresentationPlan(binding.animation.transformations[0]!), binding.plan);
});

test("copied, serialized, unbound and mismatched compositions cannot mint presentation authority", () => {
  const draft = prepareKpCommonFactorDraft(createKpCommonFactorExample());
  for (const value of [draft.animation, draft.candidate, { ...draft.presentation }, JSON.parse(JSON.stringify(draft.presentation))])
    assert.throws(() => assertKpCommonFactorPresentation(value), TypeError);
  assert.throws(() => resolveKpCommonFactorPresentation({ ...draft,
    candidate: { ...draft.candidate, request: { ...draft.candidate.request, adjacencies: [] } } }), /two-state composition/);
  assert.throws(() => resolveKpCommonFactorPresentation({ ...draft,
    candidate: { ...draft.candidate, request: { ...draft.candidate.request,
      states: [{ ...draft.candidate.request.states[0], latex: "wrong" }, draft.candidate.request.states[1]] } } }), /two-state composition/);
});

test("valid multi-digit factors produce a presentation gap before a native host is authorized", () => {
  const source = createKpCommonFactorExample();
  assert.throws(() => prepareKpCommonFactorDraft({ ...source, states: [
    { ...source.states[0], latex: "12b+12c" }, { ...source.states[1], latex: "12(b+c)" }
  ] }), (error: unknown) => error instanceof Error && "code" in error && error.code === "unsupported-presentation");
});
