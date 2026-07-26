import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpGovernedFractionFanOutExemplar
} from "../src/authoring/governed-fraction-fan-out-exemplar.ts";
import {
  validateKpGovernedSemanticAuthoringRequest
} from "../src/authoring/governed-semantic-request.ts";
import {
  createKpOpaqueFractionFanOutFixture
} from "../src/semantic/fraction-fan-out-fixture.ts";
import {
  listKpStructuredExpressionSubtrees
} from "../src/semantic/structured-expression.ts";

test("recorded provider response is grounded in the verified fraction fixture", () => {
  const fixture = createKpOpaqueFractionFanOutFixture();
  const exemplar = createKpGovernedFractionFanOutExemplar();
  const fixtureEntityIds = [
    ...listKpStructuredExpressionSubtrees(fixture.source).map(({ id }) => id),
    ...listKpStructuredExpressionSubtrees(fixture.target).map(({ id }) => id)
  ];

  assert.deepEqual(exemplar.sourceAuthority.entityIds, fixtureEntityIds);
  assert.deepEqual(exemplar.sourceAuthority.expressionIds, [
    fixture.source.root.id,
    fixture.target.root.id
  ]);
  assert.deepEqual(exemplar.sourceAuthority.evidenceIds, [
    fixture.normalFormPlan.rewriteLawId,
    fixture.normalFormPlan.intentId
  ]);
  assert.equal(
    exemplar.recordedProviderResponse.normalFormIntent.sourceExpressionId,
    fixture.normalFormPlan.sourceRootId
  );
  assert.equal(
    exemplar.recordedProviderResponse.normalFormIntent.targetExpressionId,
    fixture.normalFormPlan.targetRootId
  );
});

test("governed exemplar compiles provider intent into deterministic compiler-owned policy", () => {
  const first = createKpGovernedFractionFanOutExemplar();
  const second = createKpGovernedFractionFanOutExemplar();
  const { plan } = first.compilation;

  assert.equal(first.compilation.fingerprint, second.compilation.fingerprint);
  assert.match(first.compilation.fingerprint, /^fnv1a64:[a-f0-9]{16}$/);
  assert.equal(plan.operation.operationId, "kp.algebra.distribute-multiplication");
  assert.deepEqual(plan.operation.canonicalComposition, [
    "kp.core.persist",
    "kp.core.fan-out",
    "kp.core.eliminate",
    "kp.core.reorder"
  ]);
  assert.deepEqual(plan.operation.governance.pacing, {
    kind: "per-descendant",
    semanticUnitCount: 2
  });
  assert.ok(plan.operation.governance.lawIds.length > 0);
  assert.deepEqual(plan.provenance.source.evidenceIds, [
    "kp.algebra.distribute.v1",
    "fixture.fraction-fan-out.two-thirds-x-plus-six.distributed-sum"
  ]);
  assert.deepEqual(plan.provenance.provider, first.providerProvenance);
  assert.ok(Object.isFrozen(first));
  assert.ok(Object.isFrozen(plan.operation.governance));
});

test("provider-shaped response contains no presentation or unchecked math authority", () => {
  const exemplar = createKpGovernedFractionFanOutExemplar();
  const forbiddenKeys = collectKeys(exemplar.recordedProviderResponse)
    .filter((key) => /^(?:latex|dom|html|svg|css|pixels?|coordinates?|x|y|path|keyframes?|timing|durationMs|easing|typography|renderer|selectorId)$/i.test(key));

  assert.deepEqual(forbiddenKeys, []);
  assert.deepEqual(exemplar.authorityAudit.explicitlyExcluded, [
    "raw mathematical text",
    "DOM, HTML, SVG, and CSS",
    "geometry and coordinates",
    "timing and keyframes",
    "typography",
    "renderer selection"
  ]);
  assert.equal("rendering" in exemplar.compilation.plan, false);
  assert.equal("timing" in exemplar.compilation.plan, false);
});

test("governed provider requests reject every renderer authority layer", () => {
  const request = createKpGovernedFractionFanOutExemplar()
    .recordedProviderResponse;
  const unsafe = {
    ...request,
    fragments: [{ paint: "glyph" }],
    geometry: { rect: { left: 12 } },
    timingTable: [{ progress: 0.5 }],
    style: { computedStyle: { font: "KaTeX_Main" } },
    renderer: { dom: "<span>x</span>" }
  };
  const issues = validateKpGovernedSemanticAuthoringRequest(unsafe);

  for (const field of [
    "fragments",
    "paint",
    "geometry",
    "rect",
    "timingTable",
    "style",
    "computedStyle",
    "font",
    "renderer",
    "dom"
  ]) {
    assert.ok(issues.some(({ code, path }) =>
      code === "governed-schema.unsafe-authority" &&
      path.endsWith(field)
    ), field);
  }
});

function collectKeys(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(collectKeys);
  if (typeof value !== "object" || value === null) return [];
  return Object.entries(value).flatMap(([key, child]) => [key, ...collectKeys(child)]);
}
