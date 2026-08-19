import type {
  TransformTreeVisualMotifRule
} from "./motifs/visual-motif-composition.ts";
import {
  equationVisualMotifDescriptors,
  type EquationMotionPrimitiveId,
  type EquationVisualMotifKind,
  type EquationVisualMotifPhaseId
} from "./motifs/visual-motif.ts";
import {
  kpCanonicalOperationEvaluationTransformationKinds,
  type KpCanonicalOperationEvaluationTransformationKind,
  type KpOperationEvaluationExecutableProgramCompilerDescriptor,
  type KpOperationEvaluationExecutableProgramCompilerRef,
  type KpOperationEvaluationPresentationEntry,
  type KpOperationEvaluationPaintContinuityCompilerDescriptor,
  type KpOperationEvaluationPaintContinuityCompilerRef,
  type KpOperationEvaluationPresentationPack,
  type KpOperationEvaluationPresentationPackDependency,
  type KpOperationEvaluationPresentationPackPin,
  type KpOperationEvaluationPresentationPlanCompilerDescriptor,
  type KpOperationEvaluationPresentationPlanCompilerRef,
  type KpOperationEvaluationPresentationPins,
  type KpOperationEvaluationPresentationRegistry,
  type KpOperationEvaluationPresentationResolution,
  type KpOperationEvaluationPresentationRoute,
  type KpResolvedOperationEvaluationPresentation
} from "./operation-evaluation-presentation-types.ts";
import {
  kpCoreOperationPresentationLawIds
} from "./operation-presentation-law-types.ts";
import {
  createKpExplicitStaticCheckpointPlan
} from "./operation-presentation-plan-types.ts";
import {
  isKpVerifiedExecutableSuccessorMotifProgram
} from "./motifs/executable-successor-motif-program-authority.ts";
import {
  createKpCanonicalOperationEvaluationExecutableProgram
} from "./motifs/operation-evaluation-executable-program.ts";
import {
  isKpExecutableMotifContinuityProgram
} from "./motifs/executable-motif-continuity-program.ts";
import {
  createKpCanonicalOperationEvaluationContinuityProgram
} from "./operation-evaluation-continuity-program.ts";
import {
  kpOperationEvaluationAuthorityDescriptors
} from "../semantic/operation-evaluation-authority.ts";

export {
  kpCanonicalOperationEvaluationTransformationKinds
} from "./operation-evaluation-presentation-types.ts";
export type {
  KpCanonicalOperationEvaluationTransformationKind,
  KpOperationEvaluationExecutableProgramCompilerDescriptor,
  KpOperationEvaluationExecutableProgramCompilerRef,
  KpOperationEvaluationPresentationEntry,
  KpOperationEvaluationPaintContinuityCompilerDescriptor,
  KpOperationEvaluationPaintContinuityCompilerRef,
  KpOperationEvaluationPresentationPack,
  KpOperationEvaluationPresentationPackDependency,
  KpOperationEvaluationPresentationPackPin,
  KpOperationEvaluationPresentationPlanCompilerDescriptor,
  KpOperationEvaluationPresentationPlanCompilerRef,
  KpOperationEvaluationPresentationPins,
  KpOperationEvaluationPresentationRegistry,
  KpOperationEvaluationPresentationResolution,
  KpOperationEvaluationPresentationRoute,
  KpResolvedOperationEvaluationPresentation
} from "./operation-evaluation-presentation-types.ts";

export const kpOperationEvaluationPresentationExtensionLimit = 32;
export const kpOperationEvaluationPresentationsPerPackLimit = 64;

export const kpSuccessorSynthesisPresentationPlanCompiler =
  Object.freeze({
    id: "kp.presentation-plan-compiler.successor-synthesis",
    version: "1.0.0",
    planKind: "successor-synthesis",
    motifKind: "successor-synthesis",
    lawIds: Object.freeze([...kpCoreOperationPresentationLawIds])
  } satisfies KpOperationEvaluationPresentationPlanCompilerDescriptor);

export const kpOperationEvaluationPresentationPlanCompilers:
  readonly KpOperationEvaluationPresentationPlanCompilerDescriptor[] =
  Object.freeze([kpSuccessorSynthesisPresentationPlanCompiler]);

export const kpOperationEvaluationExecutableProgramCompiler =
  Object.freeze({
    id: "kp.executable-program-compiler.operation-evaluation",
    version: "1.0.0",
    program: mintCanonicalOperationEvaluationProgram()
  } satisfies KpOperationEvaluationExecutableProgramCompilerDescriptor);

export const kpOperationEvaluationExecutableProgramCompilers:
  readonly KpOperationEvaluationExecutableProgramCompilerDescriptor[] =
  Object.freeze([kpOperationEvaluationExecutableProgramCompiler]);

export const kpBoundedSemanticContactPaintContinuityCompiler =
  Object.freeze({
    id: "kp.paint-continuity-compiler.bounded-semantic-contact",
    version: "2.0.0",
    transferTopology: "bounded-semantic-contact-co-presence",
    nonZeroPaint: "opaque",
    endpointSettlement: "native-source-and-target",
    boundaryLawId: "paint-continuity.t-epsilon-boundary",
    continuityProgram: mintCanonicalOperationEvaluationContinuityProgram(
      kpOperationEvaluationExecutableProgramCompiler.program
    )
  } satisfies KpOperationEvaluationPaintContinuityCompilerDescriptor);

export const kpOperationEvaluationPaintContinuityCompilers:
  readonly KpOperationEvaluationPaintContinuityCompilerDescriptor[] =
  Object.freeze([kpBoundedSemanticContactPaintContinuityCompiler]);

export const kpOperationEvaluationPresentationCorePack =
  createKpOperationEvaluationPresentationPack({
    id: "kp.presentation.operation-evaluation",
    scope: "core",
    version: "5.0.0",
    title: "KP operation-evaluation presentations",
    presentationIds: [
      "kp.presentation.operation-evaluation.product",
      "kp.presentation.operation-evaluation.quotient",
      "kp.presentation.operation-evaluation.difference",
      "kp.presentation.operation-evaluation.sum"
    ]
  });

export const kpOperationEvaluationPresentationCoreEntries:
  readonly KpOperationEvaluationPresentationEntry[] =
  kpOperationEvaluationAuthorityDescriptors.map((descriptor) => coreEntry({
    id: descriptor.presentationId,
    transformationKind: descriptor.transformationKind,
    semanticOperationIds: descriptor.semanticOperationIds,
    ...(descriptor.definitionId === undefined
      ? {}
      : { definitionId: descriptor.definitionId })
  }));

export const kpOperationEvaluationPresentationRegistry =
  createKpOperationEvaluationPresentationRegistry({
    packs: [kpOperationEvaluationPresentationCorePack],
    entries: kpOperationEvaluationPresentationCoreEntries
  });

export const kpOperationEvaluationPresentationPins =
  createKpOperationEvaluationPresentationPins([
    {
      packId: kpOperationEvaluationPresentationCorePack.id,
      version: kpOperationEvaluationPresentationCorePack.version
    }
  ]);

export function createKpOperationEvaluationPresentationPack(input: {
  readonly id: string;
  readonly scope: "core" | "extension";
  readonly version: string;
  readonly title: string;
  readonly presentationIds: readonly string[];
  readonly dependencies?:
    readonly KpOperationEvaluationPresentationPackDependency[] | undefined;
}): KpOperationEvaluationPresentationPack {
  requireNamespacedId(input.id, "pack id");
  requireExactVersion(input.version, `pack ${input.id} version`);
  if (input.title.trim().length === 0) {
    throw new Error(`Presentation pack ${input.id} title must not be empty.`);
  }
  if (input.presentationIds.length === 0) {
    throw new Error(`Presentation pack ${input.id} must declare a presentation.`);
  }
  if (input.presentationIds.length >
      kpOperationEvaluationPresentationsPerPackLimit) {
    throw new Error(
      `Presentation pack ${input.id} exceeds the ` +
      `${kpOperationEvaluationPresentationsPerPackLimit}-presentation limit.`
    );
  }
  requireUnique(input.presentationIds, `presentation id in pack ${input.id}`);
  input.presentationIds.forEach((id) => requireNamespacedId(id, "presentation id"));
  const dependencies = input.dependencies ?? [];
  requireUnique(
    dependencies.map(({ packId }) => packId),
    `dependency in pack ${input.id}`
  );
  dependencies.forEach((dependency) => {
    requireNamespacedId(dependency.packId, "dependency pack id");
    requireExactVersion(
      dependency.version,
      `dependency ${dependency.packId} version`
    );
    if (dependency.packId === input.id) {
      throw new Error(`Presentation pack ${input.id} must not depend on itself.`);
    }
  });
  if (input.scope === "core" &&
      input.id !== "kp.presentation.operation-evaluation") {
    throw new Error(
      "The core operation-evaluation presentation pack id must be " +
      "kp.presentation.operation-evaluation."
    );
  }
  if (input.scope === "extension" && !input.id.startsWith("project.")) {
    throw new Error("Extension presentation pack ids must start with project.");
  }

  return Object.freeze({
    kind: "operation-evaluation-presentation-pack",
    id: input.id,
    scope: input.scope,
    version: input.version,
    title: input.title,
    presentationIds: Object.freeze([...input.presentationIds]),
    dependencies: Object.freeze(
      dependencies.map((dependency) => Object.freeze({ ...dependency }))
    )
  });
}

export function createKpOperationEvaluationPresentationPins(
  packs: readonly KpOperationEvaluationPresentationPackPin[]
): KpOperationEvaluationPresentationPins {
  requireUnique(packs.map(({ packId }) => packId), "presentation pack pin");
  packs.forEach((pin) => {
    requireNamespacedId(pin.packId, "presentation pack pin id");
    requireExactVersion(pin.version, `presentation pack ${pin.packId} pin`);
  });
  return Object.freeze({
    schemaVersion: "kp.operation-evaluation-presentation-pins.v1",
    packs: Object.freeze(packs.map((pin) => Object.freeze({ ...pin })))
  });
}

export function createKpOperationEvaluationPresentationRegistry(input: {
  readonly packs: readonly KpOperationEvaluationPresentationPack[];
  readonly entries: readonly KpOperationEvaluationPresentationEntry[];
}): KpOperationEvaluationPresentationRegistry {
  const extensionCount = input.packs.filter(
    ({ scope }) => scope === "extension"
  ).length;
  // The bound keeps dynamic packs useful without turning registry resolution
  // into an unbounded plugin dispatch surface in reader hot paths.
  if (extensionCount > kpOperationEvaluationPresentationExtensionLimit) {
    throw new Error(
      `Operation-evaluation presentation registry exceeds the ` +
      `${kpOperationEvaluationPresentationExtensionLimit}-extension limit.`
    );
  }
  requireUnique(input.packs.map(({ id }) => id), "presentation pack");
  const packsById = new Map(input.packs.map((pack) => [pack.id, pack]));
  const core = packsById.get(kpOperationEvaluationPresentationCorePack.id);
  if (core === undefined ||
      core.scope !== "core" ||
      core.version !== kpOperationEvaluationPresentationCorePack.version) {
    throw new Error(
      "Operation-evaluation presentation registries require exact core pack " +
      `${kpOperationEvaluationPresentationCorePack.id}@` +
      `${kpOperationEvaluationPresentationCorePack.version}.`
    );
  }
  input.packs
    .filter(({ scope }) => scope === "extension")
    .forEach((pack) => {
      const corePins = pack.dependencies.filter(
        ({ packId }) => packId === core.id
      );
      if (corePins.length !== 1 ||
          corePins[0]?.version !== core.version) {
        throw new Error(
          `Extension pack ${pack.id}@${pack.version} requires exact dependency ` +
          `${core.id}@${core.version}.`
        );
      }
    });

  requireUnique(input.entries.map(({ id }) => id), "presentation");
  requireUnique(
    input.entries.map(({ transformationKind }) => transformationKind),
    "operation-evaluation transformation"
  );
  requireUnique(
    input.entries.flatMap(({ semanticOperationIds }) => semanticOperationIds),
    "operation-evaluation semantic operation"
  );
  const entriesById = new Map(input.entries.map((entry) => [entry.id, entry]));
  input.entries.forEach((entry) => {
    requireNamespacedId(entry.id, "presentation id");
    const pack = packsById.get(entry.packId);
    if (pack === undefined) {
      throw new Error(
        `Operation-evaluation presentation ${entry.id} references missing pack ` +
        `${entry.packId}.`
      );
    }
    if (!pack.presentationIds.includes(entry.id)) {
      throw new Error(
        `Operation-evaluation presentation ${entry.id} is not declared by pack ` +
        `${pack.id}.`
      );
    }
    if (entry.transformationKind.trim().length === 0) {
      throw new Error(`Presentation ${entry.id} transformation kind is empty.`);
    }
    if (entry.semanticOperationIds.length === 0) {
      throw new Error(
        `Presentation ${entry.id} must declare a semantic operation.`
      );
    }
    requireUnique(
      entry.semanticOperationIds,
      `semantic operation in presentation ${entry.id}`
    );
    entry.semanticOperationIds.forEach((id) =>
      requireNamespacedId(id, "semantic operation id")
    );
    if (!equationVisualMotifDescriptors.some(
      ({ kind }) => kind === entry.motifKind
    )) {
      throw new Error(
        `Presentation ${entry.id} references unknown shared motif ` +
        `${entry.motifKind}.`
      );
    }
    const planCompiler = resolvePlanCompiler(entry.planCompiler);
    if (planCompiler === undefined) {
      throw new Error(
        `Presentation ${entry.id} references unknown or unpinned plan ` +
        `compiler ${entry.planCompiler.id}@${entry.planCompiler.version}.`
      );
    }
    if (planCompiler.motifKind !== entry.motifKind) {
      throw new Error(
        `Presentation ${entry.id} motif ${entry.motifKind} does not match ` +
        `plan compiler ${planCompiler.id} motif ${planCompiler.motifKind}.`
      );
    }
    const executableProgramCompiler = resolveExecutableProgramCompiler(
      entry.executableProgramCompiler
    );
    if (executableProgramCompiler === undefined) {
      throw new Error(
        `Presentation ${entry.id} references unknown or unpinned executable ` +
        `program compiler ${entry.executableProgramCompiler.id}@` +
        `${entry.executableProgramCompiler.version}.`
      );
    }
    if (
      !isKpVerifiedExecutableSuccessorMotifProgram(
        executableProgramCompiler.program
      ) ||
      executableProgramCompiler.program.kind !== "operation-evaluation"
    ) {
      throw new Error(
        `Presentation ${entry.id} requires one verified operation-evaluation ` +
        "executable program."
      );
    }
    const paintContinuityCompiler = resolvePaintContinuityCompiler(
      entry.paintContinuityCompiler
    );
    if (paintContinuityCompiler === undefined) {
      throw new Error(
        `Presentation ${entry.id} references unknown or unpinned paint ` +
        `continuity compiler ${entry.paintContinuityCompiler.id}@` +
        `${entry.paintContinuityCompiler.version}.`
      );
    }
    if (
      !isKpExecutableMotifContinuityProgram(
        paintContinuityCompiler.continuityProgram
      ) ||
      paintContinuityCompiler.continuityProgram.program !==
        executableProgramCompiler.program ||
      paintContinuityCompiler.continuityProgram.programKind !==
        "operation-evaluation" ||
      paintContinuityCompiler.continuityProgram.topology !==
        "bounded-semantic-contact-co-presence"
    ) {
      throw new Error(
        `Presentation ${entry.id} requires continuity compiled from its ` +
        "exact executable operation-evaluation program."
      );
    }
    requireNonempty(entry.canonicalOperationIds, entry.id, "canonical operation");
    requireNonempty(entry.trustedMotifIds, entry.id, "trusted motif");
    requireUnique(entry.definitionIds, `definition id in presentation ${entry.id}`);
    if (entry.summary.trim().length === 0) {
      throw new Error(`Presentation ${entry.id} summary must not be empty.`);
    }
  });
  input.packs.forEach((pack) => {
    pack.presentationIds.forEach((presentationId) => {
      const entry = entriesById.get(presentationId);
      if (entry === undefined || entry.packId !== pack.id) {
        throw new Error(
          `Presentation pack ${pack.id} has no owned entry ${presentationId}.`
        );
      }
    });
  });
  kpCanonicalOperationEvaluationTransformationKinds.forEach(
    (transformationKind) => {
      const entry = input.entries.find(
        (candidate) => candidate.transformationKind === transformationKind
      );
      if (entry === undefined || entry.packId !== core.id) {
        throw new Error(
          `Core presentation pack must own ${transformationKind}.`
        );
      }
    }
  );

  return Object.freeze({
    kind: "operation-evaluation-presentation-registry",
    schemaVersion: "kp.operation-evaluation-presentation-registry.v5",
    packs: Object.freeze(input.packs.map(clonePack)),
    entries: Object.freeze(input.entries.map(cloneEntry)),
    planCompilers: Object.freeze(
      kpOperationEvaluationPresentationPlanCompilers.map(clonePlanCompiler)
    ),
    executableProgramCompilers: Object.freeze(
      kpOperationEvaluationExecutableProgramCompilers.map(
        cloneExecutableProgramCompiler
      )
    ),
    paintContinuityCompilers: Object.freeze(
      kpOperationEvaluationPaintContinuityCompilers.map(
        clonePaintContinuityCompiler
      )
    )
  });
}

export function resolveKpOperationEvaluationPresentation(input: {
  readonly transformationKind: string;
  readonly semanticOperationId?: string | undefined;
  readonly registry?: KpOperationEvaluationPresentationRegistry | undefined;
  readonly pins?: KpOperationEvaluationPresentationPins | undefined;
}): KpOperationEvaluationPresentationResolution {
  const registry = input.registry ?? kpOperationEvaluationPresentationRegistry;
  const pins = input.pins ?? kpOperationEvaluationPresentationPins;
  const entry = input.semanticOperationId === undefined
    ? registry.entries.find(
        ({ transformationKind }) =>
          transformationKind === input.transformationKind
      )
    : registry.entries.find(({ semanticOperationIds }) =>
        semanticOperationIds.includes(input.semanticOperationId!)
      );
  if (entry === undefined) {
    if (input.semanticOperationId !== undefined) {
      return {
        status: "unknown-operation",
        transformationKind: input.transformationKind,
        message:
          `Unknown operation-evaluation semantic operation ` +
          `${input.semanticOperationId}.`
      };
    }
    return {
      status: "unknown-transformation",
      transformationKind: input.transformationKind,
      message:
        `Unknown operation-evaluation transformation ` +
        `${input.transformationKind}.`
    };
  }
  const pack = registry.packs.find(({ id }) => id === entry.packId)!;
  const pin = pins.packs.find(({ packId }) => packId === pack.id);
  if (pin === undefined) {
    return {
      status: "missing-pin",
      transformationKind: input.transformationKind,
      message:
        `Operation-evaluation transformation ${input.transformationKind} ` +
        `requires a project pin for ${pack.id}.`
    };
  }
  if (pin.version !== pack.version) {
    return {
      status: "version-mismatch",
      transformationKind: input.transformationKind,
      message:
        `Operation-evaluation transformation ${input.transformationKind} ` +
        `requires ${pack.id}@${pack.version}, but the project pins ` +
        `${pin.version}.`
    };
  }
  return {
    status: "resolved",
    certificate: resolvedCertificate(pack, entry)
  };
}

export function requireKpCanonicalOperationEvaluationPresentation(
  transformationKind: KpCanonicalOperationEvaluationTransformationKind
): KpResolvedOperationEvaluationPresentation {
  const resolution = resolveKpOperationEvaluationPresentation({
    transformationKind
  });
  if (resolution.status !== "resolved") {
    throw new Error(resolution.message);
  }
  return resolution.certificate;
}

export function resolveKpOperationEvaluationPresentationRoute(input: {
  readonly transformationId: string;
  readonly transformationKind: string;
  readonly semanticOperationId?: string | undefined;
  readonly registry?: KpOperationEvaluationPresentationRegistry | undefined;
  readonly pins?: KpOperationEvaluationPresentationPins | undefined;
}): KpOperationEvaluationPresentationRoute {
  const resolution = resolveKpOperationEvaluationPresentation(input);
  if (resolution.status === "resolved") return resolution;
  return Object.freeze({
    status: "explicit-static",
    resolutionStatus: resolution.status,
    checkpoint: createKpExplicitStaticCheckpointPlan({
      transformationId: input.transformationId,
      reason: "unsupported-presentation",
      summary: resolution.message
    })
  });
}

export function ruleFromKpResolvedOperationEvaluationPresentation(
  certificate: KpResolvedOperationEvaluationPresentation
): TransformTreeVisualMotifRule<
  EquationVisualMotifKind,
  EquationMotionPrimitiveId,
  EquationVisualMotifPhaseId
> {
  const descriptor = equationVisualMotifDescriptors.find(
    ({ kind }) => kind === certificate.motifKind
  );
  if (descriptor === undefined) {
    throw new Error(
      `Resolved presentation ${certificate.presentationId} references ` +
      `missing motif ${certificate.motifKind}.`
    );
  }
  return {
    transformationKind: certificate.transformationKind,
    descriptor,
    definitionIds: [...certificate.definitionIds],
    canonicalOperationIds: [...certificate.canonicalOperationIds],
    trustedMotifIds: [...certificate.trustedMotifIds],
    summary: certificate.summary
  };
}

function coreEntry(input: {
  readonly id: string;
  readonly transformationKind:
    KpCanonicalOperationEvaluationTransformationKind;
  readonly semanticOperationIds: readonly string[];
  readonly definitionId?: string | undefined;
}): KpOperationEvaluationPresentationEntry {
  return Object.freeze({
    id: input.id,
    packId: "kp.presentation.operation-evaluation",
    transformationKind: input.transformationKind,
    motifKind: "successor-synthesis",
    planCompiler: Object.freeze({
      id: kpSuccessorSynthesisPresentationPlanCompiler.id,
      version: kpSuccessorSynthesisPresentationPlanCompiler.version
    }),
    executableProgramCompiler: Object.freeze({
      id: kpOperationEvaluationExecutableProgramCompiler.id,
      version: kpOperationEvaluationExecutableProgramCompiler.version
    }),
    paintContinuityCompiler: Object.freeze({
      id: kpBoundedSemanticContactPaintContinuityCompiler.id,
      version: kpBoundedSemanticContactPaintContinuityCompiler.version
    }),
    semanticOperationIds: Object.freeze([...input.semanticOperationIds]),
    definitionIds: Object.freeze(
      input.definitionId === undefined ? [] : [input.definitionId]
    ),
    canonicalOperationIds: Object.freeze([
      "kp.core.persist",
      "kp.core.merge"
    ]),
    trustedMotifIds: Object.freeze(["persist", "merge"]),
    summary:
      "Opaque operands and their operator gather into one exact successor."
  });
}

function resolvedCertificate(
  pack: KpOperationEvaluationPresentationPack,
  entry: KpOperationEvaluationPresentationEntry
): KpResolvedOperationEvaluationPresentation {
  return Object.freeze({
    schemaVersion: "kp.resolved-operation-evaluation-presentation.v5",
    presentationId: entry.id,
    transformationKind: entry.transformationKind,
    packId: pack.id,
    packVersion: pack.version,
    motifKind: entry.motifKind,
    planCompiler: clonePlanCompiler(resolvePlanCompiler(entry.planCompiler)!),
    executableProgramCompiler: cloneExecutableProgramCompiler(
      resolveExecutableProgramCompiler(entry.executableProgramCompiler)!
    ),
    paintContinuityCompiler: clonePaintContinuityCompiler(
      resolvePaintContinuityCompiler(entry.paintContinuityCompiler)!
    ),
    semanticOperationIds: Object.freeze([...entry.semanticOperationIds]),
    definitionIds: Object.freeze([...entry.definitionIds]),
    canonicalOperationIds: Object.freeze([...entry.canonicalOperationIds]),
    trustedMotifIds: Object.freeze([...entry.trustedMotifIds]),
    summary: entry.summary
  }) as KpResolvedOperationEvaluationPresentation;
}

function clonePack(
  pack: KpOperationEvaluationPresentationPack
): KpOperationEvaluationPresentationPack {
  return Object.freeze({
    ...pack,
    presentationIds: Object.freeze([...pack.presentationIds]),
    dependencies: Object.freeze(
      pack.dependencies.map((dependency) => Object.freeze({ ...dependency }))
    )
  });
}

function cloneEntry(
  entry: KpOperationEvaluationPresentationEntry
): KpOperationEvaluationPresentationEntry {
  return Object.freeze({
    ...entry,
    planCompiler: Object.freeze({ ...entry.planCompiler }),
    executableProgramCompiler: Object.freeze({
      ...entry.executableProgramCompiler
    }),
    paintContinuityCompiler: Object.freeze({
      ...entry.paintContinuityCompiler
    }),
    semanticOperationIds: Object.freeze([...entry.semanticOperationIds]),
    definitionIds: Object.freeze([...entry.definitionIds]),
    canonicalOperationIds: Object.freeze([...entry.canonicalOperationIds]),
    trustedMotifIds: Object.freeze([...entry.trustedMotifIds])
  });
}

function resolvePlanCompiler(
  ref: KpOperationEvaluationPresentationPlanCompilerRef
): KpOperationEvaluationPresentationPlanCompilerDescriptor | undefined {
  return kpOperationEvaluationPresentationPlanCompilers.find(
    ({ id, version }) => id === ref.id && version === ref.version
  );
}

function resolvePaintContinuityCompiler(
  ref: KpOperationEvaluationPaintContinuityCompilerRef
): KpOperationEvaluationPaintContinuityCompilerDescriptor | undefined {
  return kpOperationEvaluationPaintContinuityCompilers.find(
    ({ id, version }) => id === ref.id && version === ref.version
  );
}

function resolveExecutableProgramCompiler(
  ref: KpOperationEvaluationExecutableProgramCompilerRef
): KpOperationEvaluationExecutableProgramCompilerDescriptor | undefined {
  return kpOperationEvaluationExecutableProgramCompilers.find(
    ({ id, version }) => id === ref.id && version === ref.version
  );
}

function clonePlanCompiler(
  compiler: KpOperationEvaluationPresentationPlanCompilerDescriptor
): KpOperationEvaluationPresentationPlanCompilerDescriptor {
  return Object.freeze({
    ...compiler,
    lawIds: Object.freeze([...compiler.lawIds])
  });
}

function clonePaintContinuityCompiler(
  compiler: KpOperationEvaluationPaintContinuityCompilerDescriptor
): KpOperationEvaluationPaintContinuityCompilerDescriptor {
  // The nominal continuity program is runtime authority. Copying the visible
  // descriptor fields must not create another executable continuity route.
  return Object.freeze({
    ...compiler,
    continuityProgram: compiler.continuityProgram
  });
}

function cloneExecutableProgramCompiler(
  compiler: KpOperationEvaluationExecutableProgramCompilerDescriptor
): KpOperationEvaluationExecutableProgramCompilerDescriptor {
  // Retaining the already frozen minted program preserves its private runtime
  // authority; cloning or serializing it would intentionally lose authority.
  return Object.freeze({
    id: compiler.id,
    version: compiler.version,
    program: compiler.program
  });
}

function mintCanonicalOperationEvaluationProgram() {
  return createKpCanonicalOperationEvaluationExecutableProgram();
}

function mintCanonicalOperationEvaluationContinuityProgram(
  program: ReturnType<typeof mintCanonicalOperationEvaluationProgram>
): KpOperationEvaluationPaintContinuityCompilerDescriptor[
  "continuityProgram"
] {
  return createKpCanonicalOperationEvaluationContinuityProgram(program);
}

function requireNamespacedId(value: string, label: string): void {
  if (!/^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+$/.test(value)) {
    throw new Error(
      `${label} ${value || "<empty>"} must be a lowercase namespaced id.`
    );
  }
}

function requireExactVersion(value: string, label: string): void {
  if (!/^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/.test(value)) {
    throw new Error(`${label} must be an exact semantic version.`);
  }
}

function requireUnique(values: readonly string[], label: string): void {
  const seen = new Set<string>();
  values.forEach((value) => {
    if (seen.has(value)) throw new Error(`Duplicate ${label} ${value}.`);
    seen.add(value);
  });
}

function requireNonempty(
  values: readonly string[],
  presentationId: string,
  label: string
): void {
  if (values.length === 0) {
    throw new Error(`Presentation ${presentationId} requires a ${label}.`);
  }
  requireUnique(values, `${label} in presentation ${presentationId}`);
}
