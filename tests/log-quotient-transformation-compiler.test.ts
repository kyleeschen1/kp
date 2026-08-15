import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpLogQuotientOperation,
  isKpCompiledLogQuotientOperation,
  kpCanonicalCompiledLogQuotientOperation
} from "../src/semantic/log-quotient-transformation-compiler.ts";
import {
  kpCanonicalLogQuotientContract,
  type KpLogQuotientContract
} from "../src/semantic/log-quotient-contract.ts";
import { listKpLogQuotientExpressionNodes } from "../src/semantic/log-quotient-states.ts";

test("quotient compiler mints nominal authority over total correspondence", () => {
  const compiled = kpCanonicalCompiledLogQuotientOperation;
  assert.equal(isKpCompiledLogQuotientOperation(compiled), true);
  assert.equal(isKpCompiledLogQuotientOperation({ ...compiled }), false);
  const records = compiled.transformation.correspondenceMap?.records ?? [];
  assert.deepEqual(records.map(({ relation }) => relation), [
    "role-change",
    "identity",
    "role-change",
    "role-change",
    "role-change",
    "role-change",
    "fan-in",
    "removal",
    "introduction"
  ]);
  assert.deepEqual(
    [...records.flatMap(({ sourceSelectorIds }) => sourceSelectorIds)].sort(),
    listKpLogQuotientExpressionNodes(compiled.contract.source)
      .map(({ id }) => id).sort()
  );
  assert.deepEqual(
    [...records.flatMap(({ targetSelectorIds }) => targetSelectorIds)].sort(),
    listKpLogQuotientExpressionNodes(compiled.contract.target)
      .map(({ id }) => id).sort()
  );
});

test("x and y move into numerator and denominator while one ln wrapper persists", () => {
  const records = kpCanonicalCompiledLogQuotientOperation
    .transformation.correspondenceMap?.records ?? [];
  assert.deepEqual(
    records.find(({ id }) => id.endsWith("x-to-numerator"))?.targetSelectorIds,
    ["target.numerator.x"]
  );
  assert.deepEqual(
    records.find(({ id }) => id.endsWith("y-to-denominator"))?.targetSelectorIds,
    ["target.denominator.y"]
  );
  assert.deepEqual(
    records.find(({ id }) => id.endsWith("persistent-operator")),
    {
      id: "correspondence.log-quotient.persistent-operator",
      relation: "identity",
      sourceSelectorIds: ["source.left.log.operator"],
      targetSelectorIds: ["target.log.operator"],
      summary: "The same ln operator remains visible throughout the quotient rewrite."
    }
  );
});

test("difference fan-in derives a quotient without identifying minus and fraction bar", () => {
  const records = kpCanonicalCompiledLogQuotientOperation
    .transformation.correspondenceMap?.records ?? [];
  const derivation = records.find(({ relation }) => relation === "fan-in");
  assert.deepEqual(derivation?.sourceSelectorIds, [
    "source.difference",
    "source.subtract"
  ]);
  assert.deepEqual(derivation?.targetSelectorIds, ["target.quotient"]);
  assert.equal(
    records.some((record) =>
      record.sourceSelectorIds.includes("source.subtract") &&
      record.targetSelectorIds.includes("target.quotient.bar") &&
      (record.relation === "identity" || record.relation === "role-change")
    ),
    false
  );
  assert.deepEqual(
    records.find(({ id }) => id.endsWith("introduce-fraction-bar"))?.targetSelectorIds,
    ["target.quotient.bar"]
  );
});

test("rewind correspondence reconstructs every source occurrence exactly once", () => {
  const compiled = kpCanonicalCompiledLogQuotientOperation;
  assert.deepEqual(
    compiled.rewindRecords.flatMap(({ fromSelectorIds }) => fromSelectorIds).sort(),
    listKpLogQuotientExpressionNodes(compiled.contract.target)
      .map(({ id }) => id).sort()
  );
  assert.deepEqual(
    compiled.rewindRecords.flatMap(({ toSelectorIds }) => toSelectorIds).sort(),
    listKpLogQuotientExpressionNodes(compiled.contract.source)
      .map(({ id }) => id).sort()
  );
});

test("compiler rejects a forged subtraction-to-fraction-bar identity", () => {
  const targetNodes = listKpLogQuotientExpressionNodes(
    kpCanonicalLogQuotientContract.target
  );
  const forgedBar = targetNodes.find(({ kind }) => kind === "fraction-bar");
  assert.ok(forgedBar !== undefined);
  const forged = {
    ...kpCanonicalLogQuotientContract,
    target: {
      ...kpCanonicalLogQuotientContract.target,
      root: {
        ...kpCanonicalLogQuotientContract.target.root,
        argument: {
          ...(kpCanonicalLogQuotientContract.target.root.kind === "natural-log"
            ? kpCanonicalLogQuotientContract.target.root.argument
            : {}),
          bar: {
            ...forgedBar,
            semanticId: "semantic.log-quotient.operator.subtract"
          }
        }
      }
    }
  } as unknown as KpLogQuotientContract;
  assert.throws(
    () => compileKpLogQuotientOperation(forged),
    /rejects subtraction-to-fraction-bar identity/
  );
});
