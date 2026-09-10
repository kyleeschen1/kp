import assert from "node:assert/strict";
import test from "node:test";
import source from "../src/authoring/examples/composed-algebra-intuition.json" with { type: "json" };
import { checkKpComposedAlgebraPrefixV2 } from "../src/authoring/composed-algebra-prefix-v2.ts";
import { projectKpContextualConstantSum } from "../src/semantic/contextual-constant-sum-projection.ts";
import { createGeneratedDistributionTutorialFixture } from "../src/semantic/generated-algebra-tutorial-fixture.ts";
import { scalarEquation, scalarToken } from "../src/semantic/integer-multiple-equation-projection.ts";
import { composeKpSemanticOperationProjections } from "../src/semantic/semantic-operation-projection.ts";
import { normalizeKpScalarSumProductEndpoint } from "../src/authoring/common-factor-normalizer.ts";
import { sameKpStructuredExpressionTree } from "../src/semantic/structured-expression-rewrite.ts";
import { compileKpOperationPresentationContextBundles } from "../src/animation/operation-presentation-correspondence.ts";

test("same value and state id cannot silently authorize whole-group to member-selector handoff", () => {
  const checked = checkKpComposedAlgebraPrefixV2(source);
  const evaluation = projectKpContextualConstantSum(checked.prefix.chain.steps[1]);
  const whole = evaluation.endpoints[1];
  const canonical = createGeneratedDistributionTutorialFixture({ familyId: "generated.distribution",
    id: "handoff-probe", title: "Handoff probe", direction: "distribute", factor: "5", leftTerm: "x", rightTerm: "3" });
  const distributionSource = canonical.bundle.objects[0]!;
  // Deliberately align native state identity and spelling. The remaining
  // mismatch is ownership granularity, not a foreign fixture id or whitespace.
  const split = scalarEquation(whole.object.id, distributionSource.selectors.map((selector, index) =>
    scalarToken(whole.object.id, `member-${index}`, selector.label!,
      selector.kind as "factor" | "term" | "operator" | "delimiter")));
  const latex = (value: unknown) => (value as { latex: string }).latex;
  const tree = (value: unknown) => normalizeKpScalarSumProductEndpoint({ id: "probe", latex: latex(value) }, ["x"], "probe").structured.root;
  assert.ok(sameKpStructuredExpressionTree(tree(whole.object.value), tree(split.object.value)));
  assert.equal(whole.object.id, split.object.id);
  assert.equal(whole.tokens.length, 2);
  assert.equal(split.tokens.length, 6);
  assert.deepEqual(whole.tokens.map(token => token.latex), ["5", "(x+3)"]);
  // This is a boundary rejection probe, not a certified authored distribution
  // or browser rendering test. No endpoint may be selected merely by text.
  assert.throws(() => composeKpSemanticOperationProjections("unbound-handoff", [evaluation, {
    endpoints: [split, whole], transformation: canonical.transformations[0]!
  }]), /exact semantic endpoint/);
  assert.throws(() => compileKpOperationPresentationContextBundles({ transformationId: "unbound-refinement", records: [{
    id: "context-refinement", relation: "identity", sourceSelectorIds: [whole.tokens[1]!.id],
    targetSelectorIds: split.tokens.slice(1).map(token => token.id), summary: "Unbound whole-to-members identity candidate."
  }] }), /unsupported context/);
});

test("legacy juxtaposition fixture is not authority for an explicit numeric product", () => {
  const canonical = createGeneratedDistributionTutorialFixture({ familyId: "generated.distribution",
    id: "numeric-product-probe", title: "Numeric product probe", direction: "distribute", factor: "5", leftTerm: "x", rightTerm: "3" });
  const target = canonical.bundle.objects[1]!.value as { latex: string };
  const actual = normalizeKpScalarSumProductEndpoint({ id: "actual", latex: target.latex }, ["x"], "actual").structured.root;
  const intended = normalizeKpScalarSumProductEndpoint({ id: "intended", latex: "5x+5*3" }, ["x"], "intended").structured.root;
  assert.equal(sameKpStructuredExpressionTree(actual, intended), false);
});
