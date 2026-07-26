import assert from "node:assert/strict";
import test from "node:test";

import {
  validateKpCanonicalAnimationConstruction,
  type KpCanonicalAnimationConstructionInput
} from "../src/authoring/canonical-animation-construction.ts";
import {
  findKpForbiddenPresentationAuthority
} from "../src/authoring/presentation-authority-firewall.ts";
import {
  validateKpGovernedSemanticAuthoringRequest
} from "../src/authoring/governed-semantic-request.ts";

test("rejects nested and normalized aliases for every forbidden authority", () => {
  const issues = findKpForbiddenPresentationAuthority({
    extension: {
      "DOM-fragment": "<span>x</span>",
      target_mathematics: "x = 3",
      geometryPlan: { width: 12 },
      motionTiming: "fast",
      styleRecipe: { color: "red" },
      renderer_mode: "glyph",
      accessibilityMarkup: { role: "math" },
      exportCode: "render()",
      backendInstructions: ["webgl"]
    }
  });

  assert.deepEqual(
    [...new Set(issues.map(({ authority }) => authority))].sort(),
    [
      "accessibility",
      "backend",
      "dom",
      "export",
      "geometry",
      "math-truth",
      "renderer",
      "style",
      "timing"
    ]
  );
  assert.ok(issues.some(({ path }) => path === "$.extension.DOM-fragment"));
  assert.ok(issues.some(({ path }) => path === "$.extension.renderer_mode"));
});

test("governed provider requests use the shared alias firewall", () => {
  const issues = validateKpGovernedSemanticAuthoringRequest({
    schemaVersion: "kp.governed-semantic-authoring-request.v1",
    id: "request.adversarial",
    title: "Adversarial request",
    visualRecipe: {
      layoutHint: "move upward",
      timing_table: [0, 1],
      targetLatex: "x=3"
    }
  });
  assert.deepEqual(
    issues
      .filter(({ code }) => code === "governed-schema.unsafe-authority")
      .map(({ path }) => path),
    [
      "$.visualRecipe",
      "$.visualRecipe.layoutHint",
      "$.visualRecipe.timing_table",
      "$.visualRecipe.targetLatex"
    ]
  );
});

test("durable construction rejects unknown presentation extensions", () => {
  const input = {
    id: "construction.adversarial",
    title: "Adversarial construction",
    semanticSource: {
      sourceId: "source",
      revisionId: "1",
      operationPacks: [{ packId: "kp.core", version: "1.0.0" }]
    },
    objects: [],
    operations: [],
    explanationIntents: [],
    composition: {
      id: "composition",
      kind: "sequence",
      operationStepIds: []
    },
    checkpoints: [],
    extension: {
      framePlan: [],
      visualAtoms: [],
      fontFamily: "KaTeX_Main"
    }
  } as unknown as KpCanonicalAnimationConstructionInput;
  const paths = validateKpCanonicalAnimationConstruction(input)
    .filter(({ code }) => code === "construction.unsafe-authority")
    .map(({ path }) => path);
  assert.deepEqual(paths, [
    "$.extension.framePlan",
    "$.extension.visualAtoms",
    "$.extension.fontFamily"
  ]);
});

test("semantic intent keys remain allowed", () => {
  assert.deepEqual(
    findKpForbiddenPresentationAuthority({
      expressionIds: ["expression.1"],
      roleBindings: { numerator: ["entity.x"] },
      focusIntent: { kind: "notice" },
      cadenceIntent: { kind: "together" },
      composition: { kind: "sequence" },
      checkpoints: ["source", "target"]
    }),
    []
  );
});
