import assert from "node:assert/strict";
import test from "node:test";

import {
  kpCanonicalLogProductNativeEndpoints
} from "../src/rendering/log-product-native-endpoints.ts";
import {
  kpCanonicalLogProductStates,
  listKpLogProductExpressionNodes
} from "../src/semantic/log-product-states.ts";

test("log-product states compile to exact native KaTeX endpoints", () => {
  assert.equal(kpCanonicalLogProductNativeEndpoints.length, 2);
  kpCanonicalLogProductNativeEndpoints.forEach((endpoint, index) => {
    const state = kpCanonicalLogProductStates[index]!;
    assert.equal(endpoint.stateId, state.id);
    assert.equal(endpoint.annotated.rawLatex, state.latex);
    assert.match(endpoint.nativeHtmlAndMathml, /class="katex-mathml"/);
    assert.match(endpoint.nativeHtmlAndMathml, /class="katex-html"/);
  });
});

test("every log-product occurrence has one stable native owner", () => {
  kpCanonicalLogProductNativeEndpoints.forEach((endpoint, index) => {
    const state = kpCanonicalLogProductStates[index]!;
    const expectedIds = listKpLogProductExpressionNodes(state)
      .map(({ id }) => id);
    const annotatedIds = endpoint.annotated.annotations
      .map(({ selectorId }) => selectorId);
    assert.deepEqual(new Set(annotatedIds), new Set(expectedIds));
    assert.equal(annotatedIds.length, expectedIds.length);
    assert.equal(endpoint.nodes.length, expectedIds.length);
    endpoint.nodes.forEach((node) => assert.match(
      endpoint.nativeHtmlAndMathml,
      new RegExp(`data-kp-motion-id="${escapeRegex(node.motionId)}"`)
    ));
  });
});

test("source application and target applications keep distinct semantic identity", () => {
  const [source, target] = kpCanonicalLogProductNativeEndpoints;
  const sourceWrapper = source!.nodes.find(
    ({ occurrenceId }) => occurrenceId === "source.log"
  );
  const targetWrappers = target!.nodes.filter(
    ({ kind }) => kind === "natural-log"
  );
  assert.equal(
    sourceWrapper?.semanticId,
    "semantic.log-product.wrapper.source"
  );
  assert.deepEqual(targetWrappers.map(({ semanticId }) => semanticId), [
    "semantic.log-product.wrapper.target-left",
    "semantic.log-product.wrapper.target-right"
  ]);
  assert.equal(
    targetWrappers.some(({ semanticId }) =>
      semanticId === sourceWrapper?.semanticId
    ),
    false
  );
});

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
