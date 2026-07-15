import assert from "node:assert/strict";
import test from "node:test";

import { resolveKpKatexStructuralArtifactBindings } from "../src/rendering/katex-structural-artifact-binding.ts";

test("resolveKpKatexStructuralArtifactBindings binds structural tokens to semantic artifacts", () => {
  const result = resolveKpKatexStructuralArtifactBindings({
    stateId: "equation.fraction-target",
    specs: [
      {
        artifactSelectorId: "fraction.bar",
        ownerSelectorId: "fraction.expression",
        kind: "fraction-bar"
      },
      {
        artifactSelectorId: "matrix.left-bracket",
        ownerSelectorId: "matrix.expression",
        kind: "left-delimiter",
        expectedText: "["
      }
    ],
    tokens: [
      {
        tokenId: "token.frac-line",
        text: "structural:frac-line",
        signature: "frac-line"
      },
      {
        tokenId: "token.left-bracket",
        text: "[",
        signature: "delimsizing mopen"
      }
    ]
  });

  assert.deepEqual(result, {
    bindings: [
      {
        artifactSelectorId: "fraction.bar",
        ownerSelectorId: "fraction.expression",
        kind: "fraction-bar",
        motionId: "equation.fraction-target.fraction.bar",
        tokenId: "token.frac-line"
      },
      {
        artifactSelectorId: "matrix.left-bracket",
        ownerSelectorId: "matrix.expression",
        kind: "left-delimiter",
        motionId: "equation.fraction-target.matrix.left-bracket",
        tokenId: "token.left-bracket"
      }
    ],
    diagnostics: []
  });
});

test("structural artifact binding diagnoses missing tokens and invalid delimiter specs", () => {
  const result = resolveKpKatexStructuralArtifactBindings({
    stateId: "equation.invalid",
    specs: [
      {
        artifactSelectorId: "radical.line",
        ownerSelectorId: "radical.expression",
        kind: "radical-line"
      },
      {
        artifactSelectorId: "matrix.right-bracket",
        ownerSelectorId: "matrix.expression",
        kind: "right-delimiter"
      }
    ],
    tokens: []
  });

  assert.deepEqual(result.diagnostics.map((diagnostic) => diagnostic.code), [
    "katex-artifact.token-not-found",
    "katex-artifact.invalid-spec"
  ]);
});
