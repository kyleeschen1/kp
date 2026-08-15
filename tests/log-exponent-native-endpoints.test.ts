import assert from "node:assert/strict";
import test from "node:test";

import {
  kpCanonicalLogExponentNativeEndpoints
} from "../src/rendering/log-exponent-native-endpoints.ts";
import {
  kpCanonicalLogExponentSolveStates,
  listKpLogExponentExpressionNodes
} from "../src/semantic/log-exponent-solve-states.ts";

test("canonical log-exponent states compile to exact accessible native KaTeX endpoints", () => {
  assert.equal(kpCanonicalLogExponentNativeEndpoints.length, 4);
  kpCanonicalLogExponentNativeEndpoints.forEach((endpoint, index) => {
    const state = kpCanonicalLogExponentSolveStates[index]!;
    assert.equal(endpoint.stateId, state.id);
    assert.equal(endpoint.accessibleText, state.latex);
    assert.equal(endpoint.annotated.rawLatex, state.latex);
    assert.match(endpoint.nativeHtmlAndMathml, /class="katex-mathml"/);
    assert.match(endpoint.nativeHtmlAndMathml, /class="katex-html"/);
  });
});

test("every semantic occurrence owns one nested native endpoint selector", () => {
  kpCanonicalLogExponentNativeEndpoints.forEach((endpoint, index) => {
    const state = kpCanonicalLogExponentSolveStates[index]!;
    const expected = listKpLogExponentExpressionNodes(state).map(({ id }) => id);
    const actual = endpoint.annotated.annotations.map(({ selectorId }) => selectorId);
    assert.deepEqual(new Set(actual), new Set(expected));
    assert.equal(actual.length, expected.length);
    assert.equal(endpoint.nodes.length, expected.length);
    endpoint.nodes.forEach((node) => {
      assert.match(
        endpoint.nativeHtmlAndMathml,
        new RegExp(`data-kp-motion-id="${escapeRegex(node.motionId)}"`)
      );
    });
  });
});

test("endpoint presentation groups retain semantic identity apart from occurrence identity", () => {
  const endpoints = kpCanonicalLogExponentNativeEndpoints;
  const sourceX = endpoints[0]!.nodes.find(
    ({ semanticId }) => semanticId === "semantic.unknown.x"
  );
  const solvedX = endpoints[3]!.nodes.find(
    ({ semanticId }) => semanticId === "semantic.unknown.x"
  );
  assert.equal(sourceX?.occurrenceId, "source.exponent");
  assert.equal(solvedX?.occurrenceId, "solved.left");
  assert.equal(sourceX?.semanticId, solvedX?.semanticId);
  assert.notEqual(sourceX?.presentationGroupId, solvedX?.presentationGroupId);
  assert.equal(
    endpoints[3]!.nodes.find(({ occurrenceId }) => occurrenceId === "solved.denominator")
      ?.parentOccurrenceId,
    "solved.denominator.log"
  );
});

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
