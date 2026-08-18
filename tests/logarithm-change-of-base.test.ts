import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  evaluateKpLogarithmChangeOfBaseCorpus,
  kpLogarithmChangeOfBaseCorpus
} from "../src/semantic/logarithm-change-of-base-corpus.ts";
import {
  isKpVerifiedLogarithmChangeOfBase,
  kpCanonicalLogarithmChangeOfBase,
  KpLogarithmChangeOfBaseSemanticError,
  verifyKpLogarithmChangeOfBase,
  type KpLogarithmChangeOfBaseDraft
} from "../src/semantic/logarithm-change-of-base.ts";

test("canonical change of base preserves the base and argument by identity", () => {
  const contract = kpCanonicalLogarithmChangeOfBase;
  assert.equal(isKpVerifiedLogarithmChangeOfBase(contract), true);
  assert.deepEqual(contract.correspondence.map(({ id, relation }) => ({
    id,
    relation
  })), [
    { id: "correspondence.change-of-base.argument", relation: "identity" },
    { id: "correspondence.change-of-base.base", relation: "identity" },
    { id: "correspondence.change-of-base.operators", relation: "derivation" },
    { id: "correspondence.change-of-base.quotient", relation: "derivation" },
    { id: "correspondence.change-of-base.division", relation: "introduction" }
  ]);
  assert.deepEqual(
    contract.correspondence.slice(0, 2).map((record) => [
      record.sourceEntityIds,
      record.targetEntityIds
    ]),
    [
      [["source.log-base-two.argument-seven"],
        ["target.numerator.argument-seven"]],
      [["source.log-base-two.base"], ["target.denominator.argument-two"]]
    ]
  );
  assert.equal(Object.isFrozen(contract), true);
  assert.equal(Object.isFrozen(contract.correspondence), true);
});

test("reverse authority is exact and refuses arbitrary logarithm ratios", () => {
  assert.deepEqual(kpCanonicalLogarithmChangeOfBase.reverseLimits, {
    kind: "exact-change-of-base-collapse",
    fromStateId: "state.logarithm.change-base.target",
    toStateId: "state.logarithm.change-base.source",
    requiredLawId: "law.logarithm.change-of-base",
    requiredTargetFunction: "natural-logarithm",
    requiredIdentityCorrespondenceIds: [
      "correspondence.change-of-base.argument",
      "correspondence.change-of-base.base"
    ],
    forbiddenGeneralizations: [
      "mismatched-target-logarithm-functions",
      "arbitrary-logarithm-ratio",
      "missing-domain-evidence"
    ]
  });
});

test("fixed semantic corpus covers numeric symbolic and invalid domains", () => {
  const report = evaluateKpLogarithmChangeOfBaseCorpus();
  assert.equal(report.corpusId, "corpus.equation.logarithm-base.v1");
  assert.equal(report.status, "passed");
  assert.equal(report.cases.length, 9);
  assert.deepEqual(report.cases.map(({ actualStatus }) => actualStatus), [
    "verified",
    "verified",
    "verified",
    "rejected",
    "rejected",
    "rejected",
    "rejected",
    "rejected",
    "rejected"
  ]);
  assert.equal(kpLogarithmChangeOfBaseCorpus.liveModelEvidence, false);
  assert.deepEqual(
    evaluateKpLogarithmChangeOfBaseCorpus(),
    evaluateKpLogarithmChangeOfBaseCorpus()
  );
});

test("missing truth and presentation authority fail closed", () => {
  const canonical = draftFromCanonical();
  const denominatorArgument = canonical.target.denominator.argument;
  assert.equal(denominatorArgument.kind, "number");
  if (denominatorArgument.kind !== "number") return;
  assert.throws(() => verifyKpLogarithmChangeOfBase({
    ...canonical,
    domainEvidence: {
      ...canonical.domainEvidence,
      sourceArgumentPositiveEvidenceId: ""
    }
  }), exactCode("change-of-base.missing-evidence"));
  assert.throws(() => verifyKpLogarithmChangeOfBase({
    ...canonical,
    durationMs: 900
  } as KpLogarithmChangeOfBaseDraft),
  exactCode("change-of-base.unexpected-field"));
  assert.throws(() => verifyKpLogarithmChangeOfBase({
    ...canonical,
    target: {
      ...canonical.target,
      denominator: {
        ...canonical.target.denominator,
        argument: {
          ...denominatorArgument,
          value: 3
        }
      }
    }
  }), exactCode("change-of-base.identity-mismatch"));
});

test("semantic authority imports no renderer timing or DOM", async () => {
  const source = await readFile(new URL(
    "../src/semantic/logarithm-change-of-base.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(source,
    /(?:from\s+["'][^"']*rendering|durationMs:|keyframes:|geometry:|HTMLElement|SVGElement|requestAnimationFrame\()/u);
});

function draftFromCanonical(): KpLogarithmChangeOfBaseDraft {
  const contract = kpCanonicalLogarithmChangeOfBase;
  return {
    schemaVersion: contract.schemaVersion,
    id: contract.id,
    operationAuthority: contract.operationAuthority,
    lawAuthority: contract.lawAuthority,
    source: contract.source,
    target: contract.target,
    domainEvidence: contract.domainEvidence
  };
}

function exactCode(code: string) {
  return (error: unknown) => error instanceof
    KpLogarithmChangeOfBaseSemanticError && error.code === code;
}
