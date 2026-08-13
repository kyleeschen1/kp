import assert from "node:assert/strict";
import test from "node:test";

import { createKpTypeScriptFreeShippingAnimationAsset } from
  "../src/semantic/typescript-free-shipping-animation-asset.ts";
import { createKpTypeScriptRefactorSourceProjections } from
  "../src/semantic/typescript-refactor-source-projections.ts";

const exemplar = createKpTypeScriptFreeShippingAnimationAsset();
const projections = createKpTypeScriptRefactorSourceProjections(exemplar.semantics);

test("source projections preserve exact endpoints and stage caller replacement", () => {
  const before = projections[0]!;
  const helper = projections[1]!;
  const cost = projections[2]!;
  const final = projections[3]!;

  assert.equal(before.sourceText, exemplar.semantics.revisions[0]!.sourceText);
  assert.equal(final.sourceText, exemplar.semantics.revisions[1]!.sourceText);
  assert.match(helper.sourceText, /function qualifiesForFreeShipping/);
  assert.equal(count(helper.sourceText, "total >= 50"), 3);
  assert.equal(count(helper.sourceText, "qualifiesForFreeShipping(total)"), 0);
  assert.equal(count(cost.sourceText, "total >= 50"), 2);
  assert.equal(count(cost.sourceText, "qualifiesForFreeShipping(total)"), 1);
  assert.equal(count(final.sourceText, "total >= 50"), 1);
  assert.equal(count(final.sourceText, "qualifiesForFreeShipping(total)"), 2);
});

test("every projection entity points at its compiler-derived source fragment", () => {
  for (const projection of projections) {
    for (const entity of projection.entities) {
      const source = projection.sourceText.slice(
        entity.sourceRange.startOffset,
        entity.sourceRange.endOffset
      );
      if (entity.kind === "function") assert.match(source, new RegExp(`function ${entity.label}`));
      else assert.equal(source, entity.label);
    }
  }
});

function count(value: string, needle: string): number {
  return value.split(needle).length - 1;
}
