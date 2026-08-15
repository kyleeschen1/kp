import assert from "node:assert/strict";
import test from "node:test";

import {
  kpCanonicalLogQuotientNativeEndpoints
} from "../src/rendering/log-quotient-native-endpoints.ts";
import {
  kpCanonicalLogQuotientStates,
  listKpLogQuotientExpressionNodes
} from "../src/semantic/log-quotient-states.ts";

test("log-quotient states compile to exact native KaTeX endpoints", () => {
  assert.equal(kpCanonicalLogQuotientNativeEndpoints.length, 2);
  kpCanonicalLogQuotientNativeEndpoints.forEach((endpoint, index) => {
    const state = kpCanonicalLogQuotientStates[index]!;
    assert.equal(endpoint.stateId, state.id);
    assert.equal(endpoint.annotated.rawLatex, state.latex);
    assert.match(endpoint.nativeHtmlAndMathml, /class="katex-mathml"/);
    assert.match(endpoint.nativeHtmlAndMathml, /class="katex-html"/);
  });
  assert.doesNotMatch(
    kpCanonicalLogQuotientNativeEndpoints[0]!.nativeHtmlAndMathml,
    /class="frac-line"/
  );
  assert.match(
    kpCanonicalLogQuotientNativeEndpoints[1]!.nativeHtmlAndMathml,
    /class="frac-line"/
  );
});

test("every textual occurrence and the native fraction rule have one owner", () => {
  kpCanonicalLogQuotientNativeEndpoints.forEach((endpoint, index) => {
    const state = kpCanonicalLogQuotientStates[index]!;
    const nodes = listKpLogQuotientExpressionNodes(state);
    const textIds = nodes
      .filter(({ kind }) => kind !== "fraction-bar")
      .map(({ id }) => id);
    const annotationIds = endpoint.annotated.annotations
      .map(({ selectorId }) => selectorId);
    assert.deepEqual(new Set(annotationIds), new Set(textIds));
    assert.equal(annotationIds.length, textIds.length);
    assert.equal(endpoint.nodes.length, nodes.length);
    endpoint.nodes
      .filter(({ kind }) => kind !== "fraction-bar")
      .forEach((node) => assert.match(
        endpoint.nativeHtmlAndMathml,
        new RegExp(`data-kp-motion-id="${escapeRegex(node.motionId)}"`)
      ));
  });
});

test("persistent wrapper identity is separate from endpoint occurrence identity", () => {
  const [source, target] = kpCanonicalLogQuotientNativeEndpoints;
  const sourceWrapper = source!.nodes.find(
    ({ semanticId }) => semanticId === "semantic.log-quotient.wrapper.persistent"
  );
  const targetWrapper = target!.nodes.find(
    ({ semanticId }) => semanticId === "semantic.log-quotient.wrapper.persistent"
  );
  assert.equal(sourceWrapper?.occurrenceId, "source.left.log");
  assert.equal(targetWrapper?.occurrenceId, "target.log");
  assert.equal(sourceWrapper?.semanticId, targetWrapper?.semanticId);
  assert.notEqual(
    sourceWrapper?.presentationGroupId,
    targetWrapper?.presentationGroupId
  );
  assert.equal(
    target!.nodes.find(({ occurrenceId }) => occurrenceId === "target.quotient.bar")
      ?.parentOccurrenceId,
    "target.quotient"
  );
});

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
