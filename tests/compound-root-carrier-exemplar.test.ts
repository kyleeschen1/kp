import assert from "node:assert/strict";
import test from "node:test";

import {
  isKpVerifiedCompoundRootCarrierExemplar,
  kpCompoundRootCarrierExemplar
} from "../src/semantic/compound-root-carrier-exemplar.ts";
import {
  certifyKpRootPersistentSubtree,
  KpRootPersistentSubtreeError
} from "../src/semantic/root-persistent-subtree-certificate.ts";

test("compound root exemplar proves real principal-root normalization", () => {
  const exemplar = kpCompoundRootCarrierExemplar;
  assert.equal(isKpVerifiedCompoundRootCarrierExemplar(exemplar), true);
  assert.equal(exemplar.states[0].latex, "\\sqrt{(x+1)^{2}}");
  assert.equal(exemplar.states[1].latex, "\\lvertx+1\\rvert");
  assert.deepEqual(exemplar.domainEvidence, {
    carrierDomain: "real",
    carrierRealEvidenceId: "evidence.root.x-plus-one.real"
  });
  assert.equal(exemplar.plan.operationClass,
    "compound-carrier-normalization");
  assert.equal(exemplar.plan.execution, "atomic");
});

test("deep certificate preserves carrier and all three ordered children", () => {
  const certificate = kpCompoundRootCarrierExemplar.subtreeCertificate;
  assert.deepEqual(certificate.correspondences.map(({ path, semanticId }) =>
    ({ path, semanticId })), [
    { path: [], semanticId: "semantic.expression.x-plus-one" },
    { path: [0], semanticId: "semantic.variable.x" },
    { path: [1], semanticId: "semantic.operator.plus" },
    { path: [2], semanticId: "semantic.value.one" }
  ]);
  assert.ok(certificate.correspondences.every(({ sourceEntityId,
    targetEntityId }) => sourceEntityId !== targetEntityId));
});

test("absolute-value enclosure is introduced rather than falsely persisted", () => {
  const dispositions = kpCompoundRootCarrierExemplar.plan.dispositions;
  assert.deepEqual(dispositions.map(({ kind }) => kind),
    ["persist", "consume", "introduce"]);
  assert.deepEqual(dispositions[2]?.targetEntityIds,
    ["target.absolute-value"]);
  assert.ok(dispositions.every(({ sourceEntityIds }) =>
    !sourceEntityIds.includes("target.absolute-value")));
});

test("deep certification rejects one changed child despite matching root IDs", () => {
  const exemplar = kpCompoundRootCarrierExemplar;
  const source = exemplar.states[0].carrier;
  const target = exemplar.states[1].carrier;
  const changedTarget = {
    ...target,
    children: [
      target.children[0]!,
      { ...target.children[1]!, occurrence: {
        ...target.children[1]!.occurrence,
        semanticId: "semantic.operator.minus"
      } },
      target.children[2]!
    ]
  };
  assert.throws(() => certifyKpRootPersistentSubtree({
    id: "certificate.root.invalid-child",
    plan: exemplar.plan,
    source,
    target: changedTarget
  }), (error) => error instanceof KpRootPersistentSubtreeError &&
    error.code === "root-subtree.identity-mismatch");
});
