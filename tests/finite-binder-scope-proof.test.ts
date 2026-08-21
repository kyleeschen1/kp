import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFiniteBinderSemanticId,
  type KpFiniteBinderSource
} from "../src/domain-ir/finite-binder-vocabulary.ts";
import {
  proveKpFiniteBinderScope
} from "../src/semantic/finite-binder-scope-proof.ts";
import {
  normalizeKpFiniteSumSourceEndpoint
} from "../src/semantic/finite-sum-endpoint-normalizer.ts";

function canonicalSource(): KpFiniteBinderSource {
  const normalized = normalizeKpFiniteSumSourceEndpoint(
    "\\sum_{i=1}^{3} a_i"
  );
  assert.equal(normalized.status, "normalized");
  if (normalized.status !== "normalized") {
    throw new Error("Canonical source did not normalize.");
  }
  return normalized.endpoint.semantic;
}

test("canonical binder reference is locally owned and capture-safe", () => {
  const source = canonicalSource();
  const result = proveKpFiniteBinderScope(source);
  assert.equal(result.status, "verified");
  if (result.status !== "verified") return;

  assert.deepEqual(result.proof.boundReferenceIds,
    source.body.references.map(({ id }) => id));
  assert.deepEqual(result.proof.freeSymbols, ["a"]);
  assert.equal(result.proof.substitutionDomain, "closed-integer");
  assert.equal(result.proof.captureAvoidance,
    "proved-by-closed-substitution");
});

test("local binder explicitly shadows an enclosing declaration", () => {
  const source = canonicalSource();
  const outerI = createKpFiniteBinderSemanticId("outer.scope.i");
  const outerA = createKpFiniteBinderSemanticId("outer.scope.a");
  const result = proveKpFiniteBinderScope(source, [
    { id: outerI, symbol: "i" },
    { id: outerA, symbol: "a" }
  ]);
  assert.equal(result.status, "verified");
  if (result.status !== "verified") return;
  assert.deepEqual(result.proof.shadowedEnclosingDeclarationIds, [outerI]);
  assert.deepEqual(result.proof.freeSymbols, ["a"]);
});

test("scope proof rejects a captured or misspelled reference", () => {
  const source = canonicalSource();
  const foreign = createKpFiniteBinderSemanticId("foreign.scope.i");
  const unowned = proveKpFiniteBinderScope({
    ...source,
    body: {
      ...source.body,
      references: [{ ...source.body.references[0]!, bindsTo: foreign }]
    }
  });
  assert.deepEqual(
    unowned.status === "illegal" ? unowned.diagnostic.code : undefined,
    "finite-binder-scope.unowned-reference"
  );

  const misspelled = proveKpFiniteBinderScope({
    ...source,
    body: {
      ...source.body,
      references: [{ ...source.body.references[0]!, symbol: "j" }]
    }
  });
  assert.deepEqual(
    misspelled.status === "illegal" ? misspelled.diagnostic.code : undefined,
    "finite-binder-scope.reference-symbol-mismatch"
  );
});

test("scope proof rejects duplicate reference and context identities", () => {
  const source = canonicalSource();
  const reference = source.body.references[0]!;
  const duplicatedReference = proveKpFiniteBinderScope({
    ...source,
    body: { ...source.body, references: [reference, reference] }
  });
  assert.equal(
    duplicatedReference.status === "illegal"
      ? duplicatedReference.diagnostic.code
      : undefined,
    "finite-binder-scope.duplicate-reference"
  );

  const outerId = createKpFiniteBinderSemanticId("outer.scope.i");
  const duplicatedContext = proveKpFiniteBinderScope(source, [
    { id: outerId, symbol: "i" },
    { id: outerId, symbol: "j" }
  ]);
  assert.equal(
    duplicatedContext.status === "illegal"
      ? duplicatedContext.diagnostic.code
      : undefined,
    "finite-binder-scope.ambiguous-enclosing-declaration"
  );
});

test("scope proof contains no range lineage or presentation policy", () => {
  const proof = proveKpFiniteBinderScope(canonicalSource());
  assert.doesNotMatch(
    JSON.stringify(proof),
    /rangeValues|targetTerm|lineage|trajectory|keyframe|opacity|duration/u
  );
});
