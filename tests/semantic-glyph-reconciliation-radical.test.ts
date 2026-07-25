import assert from "node:assert/strict";
import test from "node:test";

import {
  projectKpCanonicalExecutionLineage
} from "../src/animation/canonical-operation-lineage-adapter.ts";
import {
  createKpRadicalSuccessionGlyphReconciliationAudit
} from "../src/animation/semantic-glyph-reconciliation-radical.ts";
import {
  checkKpAnimationAssetReferenceClosure,
  checkKpAnimationAssetSeekRewindLaw
} from "../src/animation/asset.ts";
import {
  createExponentRadicalRewriteAnimationAsset
} from "../src/animation/exponent-radical-adapter.ts";
import {
  createKpGovernedExponentRadicalPromotionCandidate
} from "../src/authoring/governed-exponent-radical-promotion.ts";
import {
  checkCorrespondenceMapRewindLaw
} from "../src/semantic/correspondence.ts";

test("radical succession audit binds only canonical selector identity", () => {
  const audit = createKpRadicalSuccessionGlyphReconciliationAudit();
  const lineage = projectKpCanonicalExecutionLineage(audit.execution);

  assert.equal(
    audit.animationId,
    "animation.generated.radical.square-root-as-power"
  );
  assert.equal(
    audit.execution.transformationId,
    "transform.generated.radical.square-root-as-power.rewrite-power-as-root"
  );
  assert.equal(
    audit.execution.operationSpecId,
    "kp.algebra.rewrite-power-as-root"
  );
  assert.deepEqual(
    lineage.groups.map(({ relation, sourceEntityIds, targetEntityIds }) => [
      relation,
      sourceEntityIds,
      targetEntityIds
    ]),
    [
      [
        "persist",
        ["expression.generated.radical.square-root-as-power.power.base"],
        ["expression.generated.radical.square-root-as-power.radical.radicand"]
      ],
      [
        "removal",
        [
          "expression.generated.radical.square-root-as-power.power.exponent-numerator"
        ],
        []
      ],
      [
        "representation-succession",
        [
          "expression.generated.radical.square-root-as-power.power.exponent-fraction-line"
        ],
        [
          "expression.generated.radical.square-root-as-power.radical.radical-overbar"
        ]
      ],
      [
        "representation-succession",
        [
          "expression.generated.radical.square-root-as-power.power.exponent-denominator"
        ],
        [
          "expression.generated.radical.square-root-as-power.radical.radical-hook"
        ]
      ]
    ]
  );
});

test("radical succession retains governed operation and reverse law", () => {
  const audit = createKpRadicalSuccessionGlyphReconciliationAudit();
  const candidate = createKpGovernedExponentRadicalPromotionCandidate();
  const request = candidate.recordedProviderResponses.find(
    ({ operationIntent }) =>
      operationIntent.operationId === "kp.algebra.rewrite-power-as-root"
  );
  const compilation = candidate.compilations.find(
    ({ plan }) =>
      plan.operation.operationId === audit.execution.operationSpecId
  );

  assert.ok(request);
  assert.ok(compilation);
  assert.equal(
    request.source.sourceId,
    audit.fixtureId
  );
  assert.deepEqual(compilation.plan.operation.canonicalComposition, [
    "kp.core.persist",
    "kp.core.substitute",
    "kp.core.wrap",
    "kp.core.eliminate"
  ]);
  assert.deepEqual(
    checkCorrespondenceMapRewindLaw(audit.execution.correspondenceMap),
    []
  );
});

test("radical succession fixture closes without renderer authority", () => {
  const audit = createKpRadicalSuccessionGlyphReconciliationAudit();
  const animation = createExponentRadicalRewriteAnimationAsset();

  assert.deepEqual(checkKpAnimationAssetReferenceClosure(animation).failures, []);
  assert.deepEqual(checkKpAnimationAssetSeekRewindLaw(animation).failures, []);
  assert.deepEqual(audit.requiredCapabilities, [
    "accessibility",
    "annotation",
    "direct-seek",
    "hover",
    "responsive",
    "rewind"
  ]);
  assert.equal(Object.isFrozen(audit), true);
  const forbiddenKeys = collectKeys(audit).filter((key) =>
    /^(?:domRect|computedStyle|paintAtoms?|keyframes?|rendererSession|webgl)$/i
      .test(key)
  );
  assert.deepEqual(forbiddenKeys, []);
});

function collectKeys(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(collectKeys);
  if (typeof value !== "object" || value === null) return [];
  return Object.entries(value).flatMap(([key, child]) => [
    key,
    ...collectKeys(child)
  ]);
}
