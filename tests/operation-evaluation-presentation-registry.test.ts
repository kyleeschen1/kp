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
  kpOperationEvaluationExecutableProgramCompiler,
  kpOperationEvaluationExecutableProgramCompilers,
  kpOperationEvaluationPresentationPins,
  kpOperationEvaluationPaintContinuityCompilers,
  kpOperationEvaluationPresentationPlanCompilers,
  kpSharedJunctionPaintContinuityCompiler,
  requireKpCanonicalOperationEvaluationPresentation,
  resolveKpOperationEvaluationPresentation,
  resolveKpOperationEvaluationPresentationRoute,
  ruleFromKpResolvedOperationEvaluationPresentation,
  type KpOperationEvaluationPresentationEntry,
  type KpOperationEvaluationPresentationPack
} from "../src/animation/operation-evaluation-presentation-registry.ts";
import {
  isKpVerifiedExecutableSuccessorMotifProgram
} from "../src/animation/motifs/executable-successor-motif-program-validator.ts";
import {
  kpCoreOperationPresentationLawIds
} from "../src/animation/operation-presentation-law-types.ts";

test("canonical arithmetic evaluation resolves through one exact pinned motif", () => {
  for (const transformationKind of
    kpCanonicalOperationEvaluationTransformationKinds) {
    const resolution = resolveKpOperationEvaluationPresentation({
      transformationKind
    });

    assert.equal(resolution.status, "resolved");
    if (resolution.status !== "resolved") continue;
    assert.equal(resolution.certificate.motifKind, "successor-synthesis");
    assert.deepEqual(
      resolution.certificate.planCompiler,
      kpOperationEvaluationPresentationPlanCompilers[0]
    );
    assert.deepEqual(
      resolution.certificate.planCompiler.lawIds,
      kpCoreOperationPresentationLawIds
    );
    assert.deepEqual(
      resolution.certificate.executableProgramCompiler,
      kpOperationEvaluationExecutableProgramCompiler
    );
    assert.equal(
      resolution.certificate.executableProgramCompiler.program.kind,
      "operation-evaluation"
    );
    assert.equal(
      isKpVerifiedExecutableSuccessorMotifProgram(
        resolution.certificate.executableProgramCompiler.program
      ),
      true
    );
    assert.deepEqual(
      resolution.certificate.paintContinuityCompiler,
      kpSharedJunctionPaintContinuityCompiler
    );
    assert.equal(
      resolution.certificate.paintContinuityCompiler.boundaryLawId,
      "paint-continuity.t-epsilon-boundary"
    );
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
      transformationKind: "collectLikeTerms",
      semanticOperationId: "project.unknown-operation"
    }).status,
    "unknown-operation"
  );
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
        version: "5.0.0"
      }])
    }).status,
    "version-mismatch"
  );
  for (const [transformationKind, pins, resolutionStatus] of [
    ["evaluateUnknownOperation", undefined, "unknown-transformation"],
    [
      "simplifyConstantProduct",
      createKpOperationEvaluationPresentationPins([]),
      "missing-pin"
    ]
  ] as const) {
    const route = resolveKpOperationEvaluationPresentationRoute({
      transformationId: `transform.${resolutionStatus}`,
      transformationKind,
      pins
    });
    assert.equal(route.status, "explicit-static");
    if (route.status !== "explicit-static") continue;
    assert.equal(route.resolutionStatus, resolutionStatus);
    assert.equal(route.checkpoint.reason, "unsupported-presentation");
  }
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
    "successor-synthesis"
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

test("compound transformations dispatch each binding by semantic operation", () => {
  const sum = resolveKpOperationEvaluationPresentation({
    transformationKind: "collectLikeTerms",
    semanticOperationId: "kp.algebra.simplify-constant-sum"
  });
  const difference = resolveKpOperationEvaluationPresentation({
    transformationKind: "collectLikeTerms",
    semanticOperationId: "kp.algebra.simplify-constant-difference"
  });

  assert.equal(sum.status, "resolved");
  assert.equal(difference.status, "resolved");
  assert.equal(
    sum.status === "resolved" ? sum.certificate.transformationKind : undefined,
    "simplifyConstantSum"
  );
  assert.equal(
    difference.status === "resolved"
      ? difference.certificate.transformationKind
      : undefined,
    "simplifyConstantDifference"
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

  assert.throws(
    () => createKpOperationEvaluationPresentationRegistry({
      packs: [kpOperationEvaluationPresentationCorePack, extensionPack],
      entries: [
        ...kpOperationEvaluationPresentationCoreEntries,
        {
          ...extensionPresentationEntry(1),
          planCompiler: {
            id: "kp.presentation-plan-compiler.successor-synthesis",
            version: "2.0.0"
          }
        }
      ]
    }),
    /unknown or unpinned plan compiler/
  );

  assert.throws(
    () => createKpOperationEvaluationPresentationRegistry({
      packs: [kpOperationEvaluationPresentationCorePack, extensionPack],
      entries: [
        ...kpOperationEvaluationPresentationCoreEntries,
        {
          ...extensionPresentationEntry(1),
          executableProgramCompiler: {
            id: "project.executable-program-compiler.local-evaluation",
            version: "1.0.0"
          }
        }
      ]
    }),
    /unknown or unpinned executable program compiler/
  );

  assert.throws(
    () => createKpOperationEvaluationPresentationRegistry({
      packs: [kpOperationEvaluationPresentationCorePack, extensionPack],
      entries: [
        ...kpOperationEvaluationPresentationCoreEntries,
        {
          ...extensionPresentationEntry(1),
          paintContinuityCompiler: {
            id: "project.paint-continuity.hard-swap",
            version: "1.0.0"
          }
        }
      ]
    }),
    /unknown or unpinned paint continuity compiler/
  );
});

test("extensions cannot replace the core presentation law set", () => {
  const extensionPack = extensionPresentationPack(2);
  const registry = createKpOperationEvaluationPresentationRegistry({
    packs: [kpOperationEvaluationPresentationCorePack, extensionPack],
    entries: [
      ...kpOperationEvaluationPresentationCoreEntries,
      extensionPresentationEntry(2)
    ]
  });
  const resolution = resolveKpOperationEvaluationPresentation({
    registry,
    pins: createKpOperationEvaluationPresentationPins([
      ...kpOperationEvaluationPresentationPins.packs,
      { packId: extensionPack.id, version: extensionPack.version }
    ]),
    transformationKind: "evaluateProjectOperation2"
  });

  assert.equal(resolution.status, "resolved");
  if (resolution.status !== "resolved") return;
  assert.deepEqual(
    resolution.certificate.planCompiler.lawIds,
    kpCoreOperationPresentationLawIds
  );
  assert.equal(
    Object.isFrozen(resolution.certificate.planCompiler.lawIds),
    true
  );
});

test("extensions cannot replace the minted core executable program", () => {
  const extensionPack = extensionPresentationPack(3);
  const forgedProgram = JSON.parse(JSON.stringify(
    kpOperationEvaluationExecutableProgramCompiler.program
  ));
  // This cast is intentionally confined to the adversarial boundary: production
  // callers cannot attach a program to a compiler reference, while the runtime
  // registry still needs to prove it rejects an untyped extension that tries.
  const forgedCompiler = {
    id: kpOperationEvaluationExecutableProgramCompiler.id,
    version: kpOperationEvaluationExecutableProgramCompiler.version,
    program: forgedProgram
  } as unknown as KpOperationEvaluationPresentationEntry["executableProgramCompiler"];
  const registry = createKpOperationEvaluationPresentationRegistry({
    packs: [kpOperationEvaluationPresentationCorePack, extensionPack],
    entries: [
      ...kpOperationEvaluationPresentationCoreEntries,
      {
        ...extensionPresentationEntry(3),
        executableProgramCompiler: forgedCompiler
      }
    ]
  });
  const resolution = resolveKpOperationEvaluationPresentation({
    registry,
    pins: createKpOperationEvaluationPresentationPins([
      ...kpOperationEvaluationPresentationPins.packs,
      { packId: extensionPack.id, version: extensionPack.version }
    ]),
    transformationKind: "evaluateProjectOperation3"
  });

  assert.equal(resolution.status, "resolved");
  if (resolution.status !== "resolved") return;
  assert.equal(
    resolution.certificate.executableProgramCompiler.program,
    kpOperationEvaluationExecutableProgramCompiler.program
  );
  assert.notEqual(
    resolution.certificate.executableProgramCompiler.program,
    forgedProgram
  );
  assert.equal(
    isKpVerifiedExecutableSuccessorMotifProgram(
      resolution.certificate.executableProgramCompiler.program
    ),
    true
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
  assert.deepEqual(
    registry.paintContinuityCompilers,
    kpOperationEvaluationPaintContinuityCompilers
  );
  assert.deepEqual(
    registry.executableProgramCompilers,
    kpOperationEvaluationExecutableProgramCompilers
  );
  assert.equal(
    registry.executableProgramCompilers[0]?.program,
    kpOperationEvaluationExecutableProgramCompiler.program
  );
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
    motifKind: "successor-synthesis",
    planCompiler: {
      id: "kp.presentation-plan-compiler.successor-synthesis",
      version: "1.0.0"
    },
    executableProgramCompiler: {
      id: "kp.executable-program-compiler.operation-evaluation",
      version: "1.0.0"
    },
    paintContinuityCompiler: {
      id: "kp.paint-continuity-compiler.shared-junction",
      version: "1.0.0"
    },
    semanticOperationIds: [`project.operation-${index}`],
    definitionIds: [],
    canonicalOperationIds: ["kp.core.reorder"],
    trustedMotifIds: ["reorder"],
    summary: `Project operation ${index} reorders persistent terms.`
  };
}
