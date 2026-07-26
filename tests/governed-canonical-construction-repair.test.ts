import assert from "node:assert/strict";
import test from "node:test";

import {
  createNumeratorSplitMergeEquationAnimationAsset
} from "../src/animation/numerator-split-merge-equation-adapter.ts";
import {
  planKpGovernedConstructionRepairs,
  type KpGovernedCanonicalConstructionRequest,
  type KpGovernedConstructionSourceAuthority
} from "../src/authoring/canonical-animation-public-api.ts";
import {
  numeratorSplitMergeEquationAssetIds
} from "../src/semantic/numerator-split-merge-equation-asset.ts";

const ids = numeratorSplitMergeEquationAssetIds;

test("repair taxonomy covers stale refs, composition, roles, and epistemic gaps", () => {
  const source = authority();
  const split = source.animation.transformations[0]!;
  const compromised: KpGovernedConstructionSourceAuthority = {
    ...source,
    animation: {
      ...source.animation,
      transformations: [{
        ...split,
        lawRefs: [{ id: "law.unverified", level: "lax" }],
        correspondenceMap: {
          ...split.correspondenceMap!,
          records: [{
            ...split.correspondenceMap!.records[0]!,
            sourceSelectorIds: [
              `${ids.split}.left.fraction.numerator.coefficient.2`
            ]
          }, ...split.correspondenceMap!.records.slice(1)]
        }
      }, ...source.animation.transformations.slice(1)]
    }
  };
  const input = request();
  const repairs = planKpGovernedConstructionRepairs({
    request: {
      ...input,
      source: {
        ...input.source,
        sourceId: "asset.stale",
        operationPacks: [{ packId: "kp.algebra", version: "0.0.1" }]
      },
      approvedObjectIds: [ids.combined, "object.unknown"],
      approvedOperationIds: [ids.splitTransform, "operation.unknown"],
      explanationPurpose: {
        kind: "notice",
        objectIds: [ids.combined],
        operationIds: [ids.splitTransform]
      },
      compositionIntent: {
        kind: "crossfade",
        operationIds: [ids.splitTransform]
      }
    } as unknown as KpGovernedCanonicalConstructionRequest,
    authority: compromised
  });
  const actionKinds = new Set(repairs.map(({ action }) => action.kind));

  assert.ok(actionKinds.has("sync-verified-source"));
  assert.ok(actionKinds.has("sync-operation-pack-pins"));
  assert.ok(actionKinds.has("choose-approved-object"));
  assert.ok(actionKinds.has("choose-approved-operation"));
  assert.ok(actionKinds.has("include-required-objects"));
  assert.ok(actionKinds.has("choose-supported-composition"));
  assert.ok(actionKinds.has("rebind-verified-roles"));
  assert.ok(actionKinds.has("resolve-epistemic-gap"));
});

test("repairs are deterministic suggestions and cannot substitute a renderer or animation", () => {
  const input = request();
  const source = authority();
  const broken = {
    request: {
      ...input,
      approvedObjectIds: [ids.combined],
      approvedOperationIds: [ids.splitTransform],
      explanationPurpose: {
        kind: "notice" as const,
        objectIds: [ids.combined],
        operationIds: [ids.splitTransform]
      },
      compositionIntent: {
        kind: "sequence" as const,
        operationIds: [ids.splitTransform]
      }
    },
    authority: source
  };
  const first = planKpGovernedConstructionRepairs(broken);
  const second = planKpGovernedConstructionRepairs(broken);

  assert.deepEqual(first, second);
  assert.equal(Object.isFrozen(first), true);
  assert.ok(first.every(({ owner }) =>
    owner === "provider-revision" || owner === "compiler-authority-review"
  ));
  const serialized = JSON.stringify(first);
  for (const forbidden of [
    "fallback",
    "replacementAnimation",
    "renderer",
    "timing",
    "geometry",
    "style"
  ]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});

function authority(): KpGovernedConstructionSourceAuthority {
  return {
    sourceId: "asset.numerator-split-merge-equation",
    revisionId: "1",
    operationPacks: [{ packId: "kp.algebra", version: "0.1.0" }],
    animation: createNumeratorSplitMergeEquationAnimationAsset()
  };
}

function request(): KpGovernedCanonicalConstructionRequest {
  return {
    schemaVersion: "kp.governed-semantic-authoring-request.v2",
    id: "request.fraction.round-trip",
    source: {
      kind: "verified-semantic-source",
      sourceId: "asset.numerator-split-merge-equation",
      revisionId: "1",
      operationPacks: [{ packId: "kp.algebra", version: "0.1.0" }]
    },
    approvedObjectIds: [ids.combined, ids.split],
    approvedOperationIds: [ids.splitTransform, ids.mergeTransform],
    explanationPurpose: {
      kind: "transmit",
      objectIds: [ids.combined, ids.split],
      operationIds: [ids.splitTransform, ids.mergeTransform]
    },
    detailLevel: "complete",
    compositionIntent: {
      kind: "sequence",
      operationIds: [ids.splitTransform, ids.mergeTransform]
    }
  };
}
