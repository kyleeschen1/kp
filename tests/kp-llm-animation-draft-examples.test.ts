import assert from "node:assert/strict";
import test from "node:test";
import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  compileKpLlmAnimationDraft
} from "../src/animation/llm-animation-draft-compiler.ts";
import {
  acceptedGeneratedAddZeroDraft,
  createAcceptedGeneratedAddZeroAnimationAsset,
  rejectedGeneratedAnimationDraftExamples
} from "../src/animation/llm-animation-draft-examples.ts";
import {
  createKpGenericSelectorAnnotatedLatex
} from "../src/editor/generic-semantic-latex.ts";

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
