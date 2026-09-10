import assert from "node:assert/strict";
import test from "node:test";
import { normalizeKpScalarSumProductEndpoint } from "../src/authoring/common-factor-normalizer.ts";
import { bindKpStructuredExpressionRoles } from "../src/semantic/structured-expression-role-binding.ts";
import { kpDistributionRewriteRoleIds as roles, kpDistributionRewriteRoleSpecs,
  verifyKpDistributionRewrite, verifyKpOrientedDistributionRewrite,
  type KpDistributionOrientation } from "../src/semantic/structured-expression-rewrite.ts";

function bindings(from: string, to: string, orientation: KpDistributionOrientation) {
  const source = normalizeKpScalarSumProductEndpoint({ id: "source", latex: from }, ["x"], "source").structured;
  const target = normalizeKpScalarSumProductEndpoint({ id: "target", latex: to }, ["x"], "target").structured;
  const root = source.root, expanded = target.root;
  assert.equal(root.kind, "product"); assert.equal(expanded.kind, "sum");
  if (root.kind !== "product" || expanded.kind !== "sum") throw Error("fixture shape");
  const fi = orientation === "left" ? 0 : 1, ai = 1 - fi;
  const factor = root.factors[fi]!, sum = root.factors[ai]!;
  if (sum.kind !== "sum") throw Error("fixture sum");
  const products = expanded.terms.map(n => { if (n.kind !== "product") throw Error("fixture product"); return n; });
  return bindKpStructuredExpressionRoles({ contractId: "test.oriented-distribution", expressions: { source, target },
    roles: kpDistributionRewriteRoleSpecs, bindings: {
      [roles.sourceRoot]: root.id, [roles.commonFactor]: factor.id, [roles.sourceGroupedSum]: sum.id,
      [roles.sourceAddends]: sum.terms.map(n => n.id), [roles.targetRoot]: expanded.id,
      [roles.distributedTerms]: products.map(n => n.id), [roles.factorCopies]: products.map(n => n.factors[fi]!.id),
      [roles.distributedAddends]: products.map(n => n.factors[ai]!.id)
    } });
}

test("explicit distribution orientation preserves whole compound subtrees and authored order", () => {
  for (const [orientation, from, to] of [
    ["left", "5(x+3)", "5x+5*3"],
    ["right", "(2+3)(x+3)", "2(x+3)+3(x+3)"],
    ["left", "(x+3)(2+3)", "(x+3)*2+(x+3)*3"]
  ] as const) {
    const bound = bindings(from, to, orientation);
    const result = verifyKpOrientedDistributionRewrite({ bindings: bound, orientation });
    assert.equal(result.ok, true);
    if (!result.ok) throw Error("expected proof");
    assert.equal(result.verification.orientation, orientation);
    assert.equal(result.verification.lineage[0]!.targetSubtreeIds.length, 2);
    assert.equal(verifyKpOrientedDistributionRewrite({ bindings: bound, orientation: orientation === "left" ? "right" : "left" }).ok, false);
    const legacy = verifyKpDistributionRewrite(bound);
    assert.equal(legacy.ok, orientation === "left");
    if (legacy.ok) {
      const { orientation: omitted, ...unoriented } = result.verification;
      assert.deepEqual(unoriented, legacy.verification);
      assert.equal("orientation" in legacy.verification, false);
    }
  }
});

test("oriented proof rejects changed, swapped and commuted subtrees rather than sampling equality", () => {
  for (const to of ["2(x+3)+3(x+4)", "3(x+3)+2(x+3)", "2(3+x)+3(x+3)", "(x+3)*2+3(x+3)"]) {
    const result = verifyKpOrientedDistributionRewrite({ bindings: bindings("(2+3)(x+3)", to, "right"), orientation: "right" });
    assert.equal(result.ok, false, to);
  }
  const bound = bindings("(2+3)(x+3)", "2(x+3)+3(x+3)", "right");
  // Runtime callers cannot use an unknown string as an implicit right orientation.
  assert.equal(verifyKpOrientedDistributionRewrite({ bindings: bound, orientation: "auto" as KpDistributionOrientation }).ok, false);
});
