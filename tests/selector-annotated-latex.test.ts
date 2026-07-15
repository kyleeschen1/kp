import assert from "node:assert/strict";
import test from "node:test";

import { createKpSelectorAnnotatedLatex } from "../src/rendering/selector-annotated-latex.ts";

test("createKpSelectorAnnotatedLatex derives stable motion ids from semantic selectors", () => {
  const annotated = createKpSelectorAnnotatedLatex({
    id: "equation.before",
    expectedSelectorIds: ["lhs.x", "relation.equals", "rhs.7"],
    segments: [
      { kind: "selector", selectorId: "lhs.x", latex: "x" },
      { kind: "latex", latex: "+3" },
      { kind: "selector", selectorId: "relation.equals", latex: "=" },
      { kind: "selector", selectorId: "rhs.7", latex: "7" }
    ]
  });

  assert.equal(annotated.rawLatex, "x+3=7");
  assert.equal(
    annotated.annotatedLatex,
    "\\htmlData{kp-motion-id=equation.before.lhs.x}{x}+3" +
      "\\htmlData{kp-motion-id=equation.before.relation.equals}{=}" +
      "\\htmlData{kp-motion-id=equation.before.rhs.7}{7}"
  );
  assert.deepEqual(annotated.annotations.map((annotation) => [
    annotation.selectorId,
    annotation.motionId
  ]), [
    ["lhs.x", "equation.before.lhs.x"],
    ["relation.equals", "equation.before.relation.equals"],
    ["rhs.7", "equation.before.rhs.7"]
  ]);
});

test("createKpSelectorAnnotatedLatex rejects missing duplicate and unsafe selectors", () => {
  assert.throws(() => createKpSelectorAnnotatedLatex({
    id: "equation.missing",
    expectedSelectorIds: ["x", "equals"],
    segments: [{ kind: "selector", selectorId: "x", latex: "x" }]
  }), /leaves selector equals unannotated/);

  assert.throws(() => createKpSelectorAnnotatedLatex({
    id: "equation.duplicate",
    expectedSelectorIds: ["x"],
    segments: [
      { kind: "selector", selectorId: "x", latex: "x" },
      { kind: "selector", selectorId: "x", latex: "x" }
    ]
  }), /repeats selector x/);

  assert.throws(() => createKpSelectorAnnotatedLatex({
    id: "equation.unsafe",
    expectedSelectorIds: ["x}"],
    segments: [{ kind: "selector", selectorId: "x}", latex: "x" }]
  }), /data-attribute-safe id/);
});
