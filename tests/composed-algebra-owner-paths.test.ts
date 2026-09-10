import assert from "node:assert/strict";
import test from "node:test";
import primary from "../src/authoring/examples/composed-algebra-primary.json" with { type: "json" };
import { checkKpComposedAlgebraProof } from "../src/authoring/composed-algebra-proof.ts";
import { resolveKpComposedAlgebraPresentation } from "../src/authoring/composed-algebra-presentation.ts";
import { createDistributionExpansionAnimationAsset } from "../src/animation/distribution-adapter.ts";
import { createKpConstantProductEvaluationAnimationAsset } from "../src/animation/operation-evaluation-adapter.ts";
import { composeKpEquationOperationAssets } from "../src/animation/compose-equation-operation-assets.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import { projectKpReaderEquationRenderPlan } from "../src/reader/renderers/equation-render-plan.ts";

test("mixed-chain owner inventory executes canonical operation planners without claiming composition", () => {
  const retained = resolveKpComposedAlgebraPresentation(checkKpComposedAlgebraProof(primary));
  const distribution = createDistributionExpansionAnimationAsset();
  const product = createKpConstantProductEvaluationAnimationAsset({ id: "mixed-owner-probe", left: 5, right: 3 });
  const cases = [
    [retained.steps[0].animation, "factoring"],
    [retained.steps[1].animation, "successor-synthesis"],
    [distribution, "distribution"],
    [product, "successor-synthesis"]
  ] as const;
  for (const [animation, kind] of cases) {
    const plan = projectKpReaderEquationRenderPlan({ animation,
      runtimeFrame: sampleKpAnimationRuntimeFrame({ animation, progress: .5, direction: "forward" }) });
    assert.deepEqual(plan.diagnostics, []);
    assert.equal(plan.transitions.length, 1);
    assert.equal(plan.transitions[0]!.semanticStatus, "ready");
    assert.equal(plan.transitions[0]!.presentationPlan.planKind, kind);
  }
  // Having both motifs available cannot license a connection between foreign
  // source states. The authored bridge must provide exact endpoint authority.
  assert.throws(() => composeKpEquationOperationAssets("unbound-mixed-chain", "Unbound",
    [retained.steps[1].animation, distribution]), /exact adjacent native state identities/);
  assert.throws(() => composeKpEquationOperationAssets("unbound-product-context", "Unbound",
    [distribution, product]), /exact adjacent native state identities/);
});

test("legacy source cannot silently acquire distribution by appending states", () => {
  assert.throws(() => checkKpComposedAlgebraProof({ ...primary,
    states: [...primary.states, { id: "extra", latex: "5x+5*3", narration: "Distribute" }]
  }), /three/i);
});
