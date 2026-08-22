import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFiniteSumNativeEndpoints,
  kpDefaultFiniteSumLimitPlacement,
  kpCanonicalFiniteSumNativeEndpoints
} from "../src/rendering/finite-sum-native-endpoints.ts";
import {
  KP_CANONICAL_FINITE_SUM_SOURCE_LATEX,
  KP_CANONICAL_FINITE_SUM_TARGET_LATEX,
  kpCanonicalFiniteSumExpansionOperation
} from "../src/semantic/canonical-finite-sum-expansion.ts";

test("finite sum compiles to exact native KaTeX endpoints", () => {
  const [source, target] = kpCanonicalFiniteSumNativeEndpoints;
  assert.equal(source.annotated.rawLatex,
    KP_CANONICAL_FINITE_SUM_SOURCE_LATEX);
  assert.equal(target.annotated.rawLatex,
    KP_CANONICAL_FINITE_SUM_TARGET_LATEX);
  for (const endpoint of [source, target]) {
    assert.match(endpoint.nativeHtmlAndMathml, /class="katex-mathml"/u);
    assert.match(endpoint.nativeHtmlAndMathml, /class="katex-html"/u);
  }
});

test("finite sum limits default above and below but remain configurable", () => {
  assert.equal(kpDefaultFiniteSumLimitPlacement, "above-below");
  const [canonicalSource] = kpCanonicalFiniteSumNativeEndpoints;
  const [sideSource] = createKpFiniteSumNativeEndpoints({
    limitPlacement: "side"
  });

  assert.equal(canonicalSource.limitPlacement, "above-below");
  assert.match(canonicalSource.annotated.annotatedLatex,
    /\\mathop\{.*\}\\limits_/u);
  assert.equal(sideSource.limitPlacement, "side");
  assert.match(sideSource.annotated.annotatedLatex,
    /\\mathop\{.*\}\\nolimits_/u);
});

test("source and target bind every finite-binder role exactly once", () => {
  const [source, target] = kpCanonicalFiniteSumNativeEndpoints;
  assert.deepEqual(source.nodes.map(({ role }) => role), [
    "operator",
    "binder-declaration",
    "lower-bound",
    "upper-bound",
    "bound-reference",
    "body-template"
  ]);
  assert.deepEqual(target.nodes.map(({ role }) => role), [
    "instantiated-reference", "body-instance", "additive-connector",
    "instantiated-reference", "body-instance", "additive-connector",
    "instantiated-reference", "body-instance"
  ]);
  assert.equal(new Set([...source.nodes, ...target.nodes]
    .map(({ occurrenceId }) => occurrenceId)).size, 14);
});

test("each role has exactly one trusted native paint owner", () => {
  for (const endpoint of kpCanonicalFiniteSumNativeEndpoints) {
    for (const node of endpoint.nodes) {
      const occurrenceCount = endpoint.nativeHtmlAndMathml.match(
        new RegExp(
          `data-kp-motion-id="${escapeRegex(node.motionId)}"`,
          "gu"
        )
      )?.length ?? 0;
      assert.equal(occurrenceCount, 1, node.motionId);
    }
  }
});

test("one source template derives distinct target occurrences", () => {
  const [source, target] = kpCanonicalFiniteSumNativeEndpoints;
  const sourceIds = new Set(source.nodes.map(({ semanticId }) => semanticId));
  assert.ok(target.nodes.every(({ semanticId }) =>
    !sourceIds.has(semanticId)
  ));
  const targetIds = new Set(target.nodes.map(({ semanticId }) => semanticId));
  for (const edge of kpCanonicalFiniteSumExpansionOperation.lineage) {
    assert.ok(sourceIds.has(edge.sourceId));
    assert.ok(targetIds.has(edge.targetId));
  }
});

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
