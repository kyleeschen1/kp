import assert from "node:assert/strict";
import test from "node:test";

import {
  defineKpHomomorphicCausalPhaseGrammar,
  kpCanonicalHomomorphicCausalPhaseGrammar,
  kpHomomorphicCausalPhaseIds
} from "../src/domain-ir/homomorphic-causal-phases.ts";
import { kpCanonicalLogProductSemanticMotionPrecedence } from
  "../src/semantic/log-product-semantic-motion.ts";
import { kpCanonicalLogQuotientSemanticMotionPrecedence } from
  "../src/semantic/log-quotient-semantic-motion.ts";

test("homomorphic crossover exposes one ordered causal vocabulary", () => {
  const grammar = kpCanonicalHomomorphicCausalPhaseGrammar;
  assert.deepEqual(grammar.phases.map(({ id }) => id), [
    kpHomomorphicCausalPhaseIds.orient,
    kpHomomorphicCausalPhaseIds.releaseSourceSyntax,
    kpHomomorphicCausalPhaseIds.transferPayload,
    kpHomomorphicCausalPhaseIds.receiveTargetApplications,
    kpHomomorphicCausalPhaseIds.resolveTargetConnector,
    kpHomomorphicCausalPhaseIds.settleTarget,
    kpHomomorphicCausalPhaseIds.yieldNativeTarget
  ]);
  assert.deepEqual(grammar.invariants, [
    "payload-semantic-identity-persists",
    "application-lineage-does-not-imply-occurrence-identity",
    "connector-derivation-does-not-imply-glyph-identity",
    "native-target-owns-settlement",
    "presentation-policy-remains-caller-local"
  ]);
});

test("target application and connector resolution share one causal tier", () => {
  const grammar = kpCanonicalHomomorphicCausalPhaseGrammar;
  const successors = grammar.edges
    .filter(({ beforePhaseId }) =>
      beforePhaseId === kpHomomorphicCausalPhaseIds.transferPayload)
    .map(({ afterPhaseId }) => afterPhaseId);
  assert.deepEqual(successors, [
    kpHomomorphicCausalPhaseIds.receiveTargetApplications,
    kpHomomorphicCausalPhaseIds.resolveTargetConnector
  ]);
  assert.ok(grammar.edges.some(({ beforePhaseId, afterPhaseId }) =>
    beforePhaseId === kpHomomorphicCausalPhaseIds.receiveTargetApplications &&
    afterPhaseId === kpHomomorphicCausalPhaseIds.settleTarget));
  assert.ok(grammar.edges.some(({ beforePhaseId, afterPhaseId }) =>
    beforePhaseId === kpHomomorphicCausalPhaseIds.resolveTargetConnector &&
    afterPhaseId === kpHomomorphicCausalPhaseIds.settleTarget));
});

test("grammar rejects missing phases duplicate responsibilities and cycles", () => {
  const grammar = kpCanonicalHomomorphicCausalPhaseGrammar;
  assert.throws(() => defineKpHomomorphicCausalPhaseGrammar({
    ...grammar,
    phases: grammar.phases.slice(1)
  }), /every canonical phase/u);
  assert.throws(() => defineKpHomomorphicCausalPhaseGrammar({
    ...grammar,
    phases: grammar.phases.map((phase, index) => index === 1
      ? { ...phase, responsibility: grammar.phases[0]!.responsibility }
      : phase)
  }), /distinct semantic responsibilities/u);
  assert.throws(() => defineKpHomomorphicCausalPhaseGrammar({
    ...grammar,
    edges: [...grammar.edges, {
      beforePhaseId: kpHomomorphicCausalPhaseIds.yieldNativeTarget,
      afterPhaseId: kpHomomorphicCausalPhaseIds.orient
    }]
  }), /acyclic/u);
});

test("causal grammar owns no caller presentation policy", () => {
  const serialized = JSON.stringify(kpCanonicalHomomorphicCausalPhaseGrammar);
  for (const forbidden of [
    "durationMs",
    "timingWindow",
    "geometry",
    "coordinates",
    "motionPath",
    "opacity",
    "scale",
    "cardinality",
    "renderer"
  ]) assert.equal(serialized.includes(forbidden), false, forbidden);
});

test("existing product and quotient semantic precedence remains unchanged", () => {
  assert.deepEqual(
    kpCanonicalLogProductSemanticMotionPrecedence.events.map(({ id }) => id),
    [
      "event.log-product.orient",
      "event.log-product.arrive",
      "event.log-product.release-shells",
      "event.log-product.depart",
      "event.log-product.attach-target",
      "event.log-product.settle",
      "event.log-product.native-target-ready"
    ]
  );
  assert.deepEqual(
    kpCanonicalLogQuotientSemanticMotionPrecedence.events.map(({ id }) => id),
    [
      "event.log-quotient.orient",
      "event.log-quotient.clear-enclosures",
      "event.log-quotient.arguments-depart",
      "event.log-quotient.arguments-arrive",
      "event.log-quotient.target-attachment",
      "event.log-quotient.native-target-ready"
    ]
  );
});
