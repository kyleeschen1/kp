import assert from "node:assert/strict";
import test from "node:test";
import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  compileKpLlmAnimationDraft
} from "../src/animation/llm-animation-draft-compiler.ts";
import {
  acceptedGeneratedAddZeroDraft,
  acceptedGeneratedSubstitutionDraft,
  createAcceptedGeneratedAddZeroAnimationAsset,
  createAcceptedGeneratedSubstitutionAnimationAsset,
  rejectedGeneratedAnimationDraftExamples
} from "../src/animation/llm-animation-draft-examples.ts";
import {
  createKpGenericSelectorAnnotatedLatex
} from "../src/editor/generic-semantic-latex.ts";
import { readKpVersionedLlmAnimationDraft } from "../src/animation/llm-animation-draft-v2.ts";

test("accepted generated equation example compiles and is available to the editor catalog", () => {
  const result = compileKpLlmAnimationDraft(acceptedGeneratedAddZeroDraft);
  assert.equal(result.status, "accepted");
  const animation = createAcceptedGeneratedAddZeroAnimationAsset();
  assert.ok(createKpAnimationAssets().some((candidate) => candidate.id === animation.id));
  assert.deepEqual(animation.dashboard?.tags, [
    "animation",
    "equation",
    "generated",
    "llm-authored"
  ]);
});

test("generated substitution compiles into the editor with explicit value lineage", () => {
  const result = compileKpLlmAnimationDraft(acceptedGeneratedSubstitutionDraft);
  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") return;
  assert.deepEqual(
    result.transitionIrs[0]?.relations.map((relation) => relation.lifecycle),
    ["split", "exit", "persist", "persist", "persist"]
  );
  const animation = createAcceptedGeneratedSubstitutionAnimationAsset();
  assert.ok(createKpAnimationAssets().some((candidate) => candidate.id === animation.id));
  assert.equal(animation.transformations[0]?.transformType, "substituteValue");
});

test("rejected generated examples carry diagnostics and repair guidance", () => {
  for (const example of rejectedGeneratedAnimationDraftExamples) {
    const result = compileKpLlmAnimationDraft(example.draft);
    assert.equal(result.status, "rejected", example.id);
    assert.ok(
      result.diagnostics.some((diagnostic) => diagnostic.code === example.expectedCode),
      `${example.id} should report ${example.expectedCode}`
    );
    assert.ok(example.repair.length > 20);
  }
});

test("generic semantic LaTeX binds ordered LLM selector labels without renderer markup", () => {
  const state = acceptedGeneratedAddZeroDraft.objects[0]!;
  assert.ok("latex" in state);
  if (!("latex" in state)) return;
  const annotated = createKpGenericSelectorAnnotatedLatex({
    objectId: state.id,
    latex: state.latex,
    selectors: state.selectors
  });
  assert.equal(annotated?.rawLatex, state.latex);
  assert.equal(annotated?.annotations.length, state.selectors.length);
  assert.match(annotated?.annotatedLatex ?? "", /kp-motion-id/);
});

test("the accepted v1 example migrates to a registered v2 derivation graph", () => {
  const result = readKpVersionedLlmAnimationDraft(acceptedGeneratedAddZeroDraft);
  assert.equal(result.status, "migrated-v1");
  if (result.status !== "migrated-v1") return;
  assert.equal(result.draft.states.length, 2);
  assert.deepEqual(
    result.draft.derivations[0]?.operations.map((operation) => operation.operationId),
    ["kp.core.persist", "kp.core.eliminate", "kp.core.persist", "kp.core.persist"]
  );
});
