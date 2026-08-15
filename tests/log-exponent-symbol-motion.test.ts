import assert from "node:assert/strict";
import test from "node:test";

import {
  kpCanonicalLogExponentSymbolMotionPlans
} from "../src/animation/log-exponent-symbol-motion.ts";
import {
  compileKpSymbolMotionContract,
  isKpCompiledSymbolMotionContract
} from "../src/animation/symbol-motion-contract.ts";
import {
  kpCanonicalLogExponentTransformationTree
} from "../src/semantic/log-exponent-transformation-tree.ts";

test("symbol motion plans bind canonical motifs and total lifecycle authority", () => {
  assert.equal(kpCanonicalLogExponentSymbolMotionPlans.length, 3);
  assert.ok(kpCanonicalLogExponentSymbolMotionPlans.every(({ contract }) =>
    isKpCompiledSymbolMotionContract(contract)
  ));
  const apply = kpCanonicalLogExponentSymbolMotionPlans[0]!.contract;
  assert.equal(
    apply.canonicalMotifs[0]?.canonicalOperationId,
    "kp.core.wrap"
  );
  assert.equal(apply.canonicalMotifs[0]?.synchronization, "together");
  const extraction = kpCanonicalLogExponentSymbolMotionPlans[1]!.contract;
  const x = extraction.continuants.find(({ correspondenceRecordId }) =>
    correspondenceRecordId ===
      "correspondence.extract-exponent.unknown-x"
  );
  assert.equal(x?.presence, "continuous-opaque");
  assert.equal(x?.metricTransition, "interpolate-to-target-metrics");
  assert.ok(extraction.continuants.some(({ correspondenceRecordId }) =>
    correspondenceRecordId ===
      "correspondence.extract-exponent.log-left-operator"
  ));
  assert.ok(extraction.rigidCompounds.some(({ id }) =>
    id.endsWith("extract-exponent.residual-log-two")
  ));
});

test("unchanged logarithm subtrees compile as rigid motion units", () => {
  const division = kpCanonicalLogExponentSymbolMotionPlans[2]!.contract;
  assert.deepEqual(
    division.rigidCompounds.map(({ id, topology, routing }) => ({
      id,
      topology,
      routing
    })),
    [
      {
        id: "motion-unit.transformation.log-exponent.divide-by-log-base.log-seven",
        topology: "preserve-relative-geometry",
        routing: "single-motion-unit"
      },
      {
        id: "motion-unit.transformation.log-exponent.divide-by-log-base.log-two",
        topology: "preserve-relative-geometry",
        routing: "single-motion-unit"
      }
    ]
  );
});

test("symbol motion compilation fails closed when correspondence is omitted", () => {
  const transformation =
    kpCanonicalLogExponentTransformationTree.operations[0]!.transformation;
  assert.throws(() => compileKpSymbolMotionContract({
    id: "symbol-motion.incomplete",
    transformation,
    continuants: []
  }), /does not cover the same semantic set/);
});
