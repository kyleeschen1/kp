import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpGovernedRadicalSuccessionFixture
} from "../src/authoring/public-api.ts";
import {
  createKpGovernedExponentRadicalPromotionCandidate
} from "../src/authoring/governed-exponent-radical-promotion.ts";
import {
  projectKpNativeKatexSemanticPaintRelations
} from "../src/rendering/native-katex-scene-compositor.ts";

test("existing governed radical trace compiles into the v2 construction", () => {
  const fixture = createKpGovernedRadicalSuccessionFixture();
  const predecessor = createKpGovernedExponentRadicalPromotionCandidate()
    .recordedProviderResponses.find(
      ({ id }) => id === fixture.predecessorRequestId
    );
  const operation = fixture.compilation.construction.operations[0]!;
  const evidence = fixture.compilation.mathematicalVerification.operations[0]!;

  assert.ok(predecessor);
  assert.equal(predecessor.operationIntent.operationId,
    "kp.algebra.rewrite-power-as-root");
  assert.equal(predecessor.source.sourceId, fixture.request.source.sourceId);
  assert.equal(predecessor.source.revisionId, fixture.request.source.revisionId);
  assert.equal(operation.transformationId,
    "transform.generated.radical.square-root-as-power.rewrite-power-as-root");
  assert.equal(operation.definitionId,
    "definition.generated.radical.rewrite-power-as-root");
  assert.deepEqual(evidence.strictLawIds, [
    "law.arithmetic.rational-exponent-as-root"
  ]);
  assert.deepEqual(operation.lineage.map(({ relation }) => relation), [
    "role-change",
    "removal",
    "role-change",
    "role-change"
  ]);
});

test("radical fragments retain exact compiler-owned lineage", () => {
  const fixture = createKpGovernedRadicalSuccessionFixture();
  const { fragments } = fixture;

  assert.match(fragments.source.numeratorSelectorId, /exponent-numerator$/);
  assert.match(
    fragments.source.fractionRuleSelectorId,
    /exponent-fraction-line$/
  );
  assert.match(
    fragments.source.denominatorSelectorId,
    /exponent-denominator$/
  );
  assert.match(fragments.target.hookSelectorId, /radical-hook$/);
  assert.match(fragments.target.overbarSelectorId, /radical-overbar$/);
  assert.match(fragments.target.radicandSelectorId, /radicand$/);
  assert.equal(fragments.target.rootIndexSelectorId, undefined);
  assert.equal(fragments.target.radicandExponentSelectorId, undefined);

  const operation = fixture.compilation.construction.operations[0]!;
  const relations = projectKpNativeKatexSemanticPaintRelations({
    groups: operation.lineage.map((lineage) => ({
      id: lineage.id,
      kind: lineageKind(
        lineage.sourceEntityIds.length,
        lineage.targetEntityIds.length
      ),
      sourceEntityIds: lineage.sourceEntityIds,
      targetEntityIds: lineage.targetEntityIds
    }))
  });
  assert.deepEqual(relations.map(({ relation }) => relation), [
    "persist",
    "persist",
    "persist"
  ]);
  const durable = JSON.stringify({
    request: fixture.request,
    construction: fixture.compilation.construction,
    fragments: fixture.fragments
  });
  for (const forbidden of [
    "renderer-session",
    "sourceElement",
    "\"rect\"",
    "fontRevision",
    "viewportKey",
    "keyframes"
  ]) {
    assert.equal(durable.includes(forbidden), false, forbidden);
  }
});

function lineageKind(
  sourceCount: number,
  targetCount: number
):
  | "one-to-one"
  | "many-to-one"
  | "one-to-many"
  | "introduction"
  | "removal" {
  if (sourceCount === 0) return "introduction";
  if (targetCount === 0) return "removal";
  if (sourceCount > 1 && targetCount === 1) return "many-to-one";
  if (sourceCount === 1 && targetCount > 1) return "one-to-many";
  return "one-to-one";
}
