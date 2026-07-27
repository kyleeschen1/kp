import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFoldableSignedTermGroupingCertificate
} from "../src/semantic/foldable-distribution-operation-certificates.ts";

test("signed-term gathering preserves every complete term identity", () => {
  const certificate = createKpFoldableSignedTermGroupingCertificate();

  assert.deepEqual(certificate.sourceTermIds, [
    "distributed.term-3x",
    "distributed.constant-6",
    "distributed.term-2x",
    "distributed.negative-2"
  ]);
  assert.deepEqual(certificate.targetTermIds, [
    "grouped.term-3x",
    "grouped.term-2x",
    "grouped.constant-6",
    "grouped.negative-2"
  ]);
  assert.equal(
    certificate.transformation.correspondenceMap!.records.filter(
      ({ relation }) => relation === "identity"
    ).length,
    4
  );
  assert.equal(
    certificate.sourceToTarget["distributed.negative-2"],
    "grouped.negative-2"
  );
});

test("coefficient and signed-constant groups partition the target terms", () => {
  const certificate = createKpFoldableSignedTermGroupingCertificate();
  const members = certificate.groups.flatMap(({ memberIds }) => memberIds);

  assert.deepEqual(certificate.groups, [
    {
      id: "group.foldable-distribution.coefficients",
      kind: "coefficient-terms",
      memberIds: ["grouped.term-3x", "grouped.term-2x"]
    },
    {
      id: "group.foldable-distribution.constants",
      kind: "signed-constants",
      memberIds: ["grouped.constant-6", "grouped.negative-2"]
    }
  ]);
  assert.deepEqual(new Set(members), new Set(certificate.targetTermIds));
});

test("grouping uses core reflow and grouping without paint replacement", () => {
  const certificate = createKpFoldableSignedTermGroupingCertificate();

  assert.deepEqual(certificate.canonicalOperationIds, [
    "kp.core.reorder",
    "kp.core.group"
  ]);
  assert.deepEqual(certificate.presentation, {
    requiredMotif: "semantic-reorder-and-group",
    termPaintPolicy: "opaque-identity-through-reflow",
    groupingPolicy: "establish-after-reflow",
    geometryAuthority: "reader-layout"
  });
  assert.equal(JSON.stringify(certificate).includes("fade"), false);
});
