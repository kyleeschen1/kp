import assert from "node:assert/strict";
import test from "node:test";

import { createKpSelectorAnnotatedLatex } from "../src/rendering/selector-annotated-latex.ts";
import { renderSelectorAnnotatedLatexToHtml } from "../src/rendering/katex-adapter.ts";

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

test("renderSelectorAnnotatedLatexToHtml emits measurable semantic KaTeX anchors", () => {
  const annotated = createKpSelectorAnnotatedLatex({
    id: "equation.rendered",
    expectedSelectorIds: ["lhs.x", "rhs.4"],
    segments: [
      { kind: "selector", selectorId: "lhs.x", latex: "x" },
      { kind: "latex", latex: "=" },
      { kind: "selector", selectorId: "rhs.4", latex: "4" }
    ]
  });

  const html = renderSelectorAnnotatedLatexToHtml(annotated);

  assert.match(html, /data-kp-motion-id="equation\.rendered\.lhs\.x"/);
  assert.match(html, /data-kp-motion-id="equation\.rendered\.rhs\.4"/);
});

test("selector-annotated LaTeX keeps trusted commands inside the KP boundary", () => {
  assert.throws(() => createKpSelectorAnnotatedLatex({
    id: "equation.untrusted",
    expectedSelectorIds: ["x"],
    segments: [{
      kind: "selector",
      selectorId: "x",
      latex: "\\htmlData{attacker=value}{x}"
    }]
  }), /cannot contain trusted HTML or URL commands/);
});
