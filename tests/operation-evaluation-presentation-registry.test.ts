import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpOperationEvaluationPresentationPack,
  createKpOperationEvaluationPresentationPins,
  createKpOperationEvaluationPresentationRegistry,
  kpCanonicalOperationEvaluationTransformationKinds,
  kpOperationEvaluationPresentationCoreEntries,
  kpOperationEvaluationPresentationCorePack,
  kpOperationEvaluationPresentationExtensionLimit,
  kpOperationEvaluationPresentationPins,
  requireKpCanonicalOperationEvaluationPresentation,
  resolveKpOperationEvaluationPresentation,
  ruleFromKpResolvedOperationEvaluationPresentation,
  type KpOperationEvaluationPresentationEntry,
  type KpOperationEvaluationPresentationPack
} from "../src/animation/operation-evaluation-presentation-registry.ts";

test("canonical arithmetic evaluation resolves through one exact pinned motif", () => {
  for (const transformationKind of
    kpCanonicalOperationEvaluationTransformationKinds) {
    const resolution = resolveKpOperationEvaluationPresentation({
      transformationKind
    });

    assert.equal(resolution.status, "resolved");
    if (resolution.status !== "resolved") continue;
    assert.equal(resolution.certificate.motifKind, "successor-synthesis");
    assert.equal(
      resolution.certificate.packVersion,
      kpOperationEvaluationPresentationCorePack.version
    );
    assert.equal(Object.isFrozen(resolution.certificate), true);
    assert.equal(Object.isFrozen(resolution.certificate.trustedMotifIds), true);

    const rule = ruleFromKpResolvedOperationEvaluationPresentation(
      resolution.certificate
    );
    assert.equal(rule.transformationKind, transformationKind);
    assert.deepEqual(rule.descriptor.motionPrimitiveIds, ["merge", "shift"]);
    assert.deepEqual(rule.descriptor.phaseIds, [
      "gather-contributors",
      "recognize-successor",
      "native-settle"
    ]);
    assert.ok(!rule.descriptor.motionPrimitiveIds.some(
      (primitive) => ["enter", "exit", "reveal", "vanish"].includes(primitive)
    ));
  }
});

test("resolution fails closed for unknown transformations and pin drift", () => {
  assert.equal(
    resolveKpOperationEvaluationPresentation({
      transformationKind: "evaluateUnknownOperation"
    }).status,
    "unknown-transformation"
  );
  assert.equal(
    resolveKpOperationEvaluationPresentation({
      transformationKind: "simplifyConstantProduct",
      pins: createKpOperationEvaluationPresentationPins([])
    }).status,
    "missing-pin"
  );
  assert.equal(
    resolveKpOperationEvaluationPresentation({
      transformationKind: "simplifyConstantProduct",
      pins: createKpOperationEvaluationPresentationPins([{
        packId: kpOperationEvaluationPresentationCorePack.id,
        version: "2.0.0"
      }])
    }).status,
    "version-mismatch"
  );
});

test("a bounded exact-pinned extension can add but cannot override a presentation", () => {
  const extensionPack = extensionPresentationPack(0);
  const extensionEntry = extensionPresentationEntry(0);
  const registry = createKpOperationEvaluationPresentationRegistry({
    packs: [kpOperationEvaluationPresentationCorePack, extensionPack],
    entries: [
      ...kpOperationEvaluationPresentationCoreEntries,
      extensionEntry
    ]
  });
  const resolution = resolveKpOperationEvaluationPresentation({
    registry,
    pins: createKpOperationEvaluationPresentationPins([
      ...kpOperationEvaluationPresentationPins.packs,
      { packId: extensionPack.id, version: extensionPack.version }
    ]),
    transformationKind: extensionEntry.transformationKind
  });

  assert.equal(resolution.status, "resolved");
  assert.equal(
    resolution.status === "resolved"
      ? resolution.certificate.motifKind
      : undefined,
    "semantic-reorder-and-group"
  );

  assert.throws(
    () => createKpOperationEvaluationPresentationRegistry({
      packs: [kpOperationEvaluationPresentationCorePack, extensionPack],
      entries: [
        ...kpOperationEvaluationPresentationCoreEntries,
        {
          ...extensionEntry,
          transformationKind: "simplifyConstantProduct"
        }
      ]
    }),
    /Duplicate operation-evaluation transformation simplifyConstantProduct/
  );
});

test("extensions require the exact core and shared motif vocabulary", () => {
  const unpinnedExtension = createKpOperationEvaluationPresentationPack({
    id: "project.unpinned-evaluation",
    scope: "extension",
    version: "1.0.0",
    title: "Unpinned evaluation",
    presentationIds: ["project.unpinned-evaluation.result"]
  });
  assert.throws(
    () => createKpOperationEvaluationPresentationRegistry({
      packs: [kpOperationEvaluationPresentationCorePack, unpinnedExtension],
      entries: [
        ...kpOperationEvaluationPresentationCoreEntries,
        {
          ...extensionPresentationEntry(0),
          id: "project.unpinned-evaluation.result",
          packId: unpinnedExtension.id
        }
      ]
    }),
    /requires exact dependency/
  );

  const extensionPack = extensionPresentationPack(1);
  assert.throws(
    () => createKpOperationEvaluationPresentationRegistry({
      packs: [kpOperationEvaluationPresentationCorePack, extensionPack],
      entries: [
        ...kpOperationEvaluationPresentationCoreEntries,
        {
          ...extensionPresentationEntry(1),
          motifKind: "project-local-fade"
        } as KpOperationEvaluationPresentationEntry
      ]
    }),
    /unknown shared motif project-local-fade/
  );
});

test("registry extension count has a deterministic upper bound", () => {
  const extensionPacks = Array.from(
    { length: kpOperationEvaluationPresentationExtensionLimit + 1 },
    (_, index) => extensionPresentationPack(index)
  );
  assert.throws(
    () => createKpOperationEvaluationPresentationRegistry({
      packs: [
        kpOperationEvaluationPresentationCorePack,
        ...extensionPacks
      ],
      entries: [
        ...kpOperationEvaluationPresentationCoreEntries,
        ...extensionPacks.map((_pack, index) =>
          extensionPresentationEntry(index)
        )
      ]
    }),
    /exceeds the 32-extension limit/
  );
});

test("registry snapshots inputs and canonical helpers return nominal certificates", () => {
  const presentationIds = ["project.snapshot-evaluation.result"];
  const extensionPack = createKpOperationEvaluationPresentationPack({
    id: "project.snapshot-evaluation",
    scope: "extension",
    version: "1.0.0",
    title: "Snapshot evaluation",
    presentationIds,
    dependencies: [{
      packId: kpOperationEvaluationPresentationCorePack.id,
      version: kpOperationEvaluationPresentationCorePack.version
    }]
  });
  presentationIds.push("project.snapshot-evaluation.mutated");
  const registry = createKpOperationEvaluationPresentationRegistry({
    packs: [kpOperationEvaluationPresentationCorePack, extensionPack],
    entries: [
      ...kpOperationEvaluationPresentationCoreEntries,
      {
        ...extensionPresentationEntry(0),
        id: "project.snapshot-evaluation.result",
        packId: extensionPack.id
      }
    ]
  });

  assert.deepEqual(registry.packs[1]?.presentationIds, [
    "project.snapshot-evaluation.result"
  ]);
  const certificate = requireKpCanonicalOperationEvaluationPresentation(
    "simplifyConstantProduct"
  );
  assert.equal(certificate.presentationId,
    "kp.presentation.operation-evaluation.product");
});

function extensionPresentationPack(
  index: number
): KpOperationEvaluationPresentationPack {
  return createKpOperationEvaluationPresentationPack({
    id: `project.evaluation-${index}`,
    scope: "extension",
    version: "1.0.0",
    title: `Evaluation extension ${index}`,
    presentationIds: [`project.evaluation-${index}.result`],
    dependencies: [{
      packId: kpOperationEvaluationPresentationCorePack.id,
      version: kpOperationEvaluationPresentationCorePack.version
    }]
  });
}

function extensionPresentationEntry(
  index: number
): KpOperationEvaluationPresentationEntry {
  return {
    id: `project.evaluation-${index}.result`,
    packId: `project.evaluation-${index}`,
    transformationKind: `evaluateProjectOperation${index}`,
    motifKind: "semantic-reorder-and-group",
    definitionIds: [],
    canonicalOperationIds: ["kp.core.reorder"],
    trustedMotifIds: ["reorder"],
    summary: `Project operation ${index} reorders persistent terms.`
  };
}
