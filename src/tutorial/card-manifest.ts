import {
  createLinearSolveSynchronizedPanelLayoutSample,
  type KpLayoutObjectKind
} from "../layout/synchronized-panel.ts";
import {
  createSemanticObjectRef,
  createSemanticTransformationRef,
  type SemanticObjectRef,
  type SemanticTransformationRef
} from "../semantic/animation.ts";

export interface KpTutorialCardManifest {
  readonly id: string;
  readonly title: string;
  readonly version: 1;
  readonly rootLayoutId: string;
  readonly semanticObjectRefs: readonly SemanticObjectRef[];
  readonly transformationRefs: readonly SemanticTransformationRef[];
  readonly layoutRefs: readonly KpTutorialLayoutRef[];
  readonly timelineRefs: readonly KpTutorialTimelineRef[];
  readonly checks: readonly KpTutorialCardCheck[];
  readonly exportProfiles: readonly KpTutorialExportProfile[];
  readonly dependencies: KpTutorialDependencyManifest;
  readonly fallback: KpTutorialFallbackSpec;
  readonly summary?: string | undefined;
}

export interface KpTutorialLayoutRef {
  readonly id: string;
  readonly kind: KpLayoutObjectKind;
  readonly rootLayoutId: string;
  readonly childIds: readonly string[];
  readonly sharedClockId?: string | undefined;
  readonly summary?: string | undefined;
}

export type KpTutorialTimelineKind =
  | "animation-motion-plan"
  | "external-clock"
  | "layout-shared-clock";

export interface KpTutorialTimelineRef {
  readonly id: string;
  readonly kind: KpTutorialTimelineKind;
  readonly clockId?: string | undefined;
  readonly motionPlanId?: string | undefined;
  readonly layoutId?: string | undefined;
  readonly durationMs?: number | undefined;
  readonly beatCount?: number | undefined;
  readonly sampleable?: boolean | undefined;
  readonly reversible?: boolean | undefined;
  readonly summary?: string | undefined;
}

export type KpTutorialCheckKind =
  | "dependency-closure"
  | "manifest-integrity"
  | "reversible-timeline"
  | "sampleable-timeline"
  | "selector-preservation";

export type KpTutorialCheckRequirement = "recommended" | "required";

export interface KpTutorialCardCheck {
  readonly id: string;
  readonly kind: KpTutorialCheckKind;
  readonly requirement: KpTutorialCheckRequirement;
  readonly targetIds: readonly string[];
  readonly summary: string;
}

export type KpTutorialExportKind =
  | "gif"
  | "iframe"
  | "interactive-card"
  | "step-sequence"
  | "video";

export type KpTutorialExportTarget = "browser" | "media" | "static";

export type KpTutorialExportSettingValue =
  | boolean
  | null
  | number
  | string
  | readonly string[];

export interface KpTutorialExportProfile {
  readonly id: string;
  readonly kind: KpTutorialExportKind;
  readonly target: KpTutorialExportTarget;
  readonly settings?: Readonly<Record<string, KpTutorialExportSettingValue>>;
}

export interface KpTutorialDependencyManifest {
  readonly critical: KpTutorialDependencySet;
  readonly prefetch?: KpTutorialDependencySet | undefined;
  readonly interactive?: KpTutorialDependencySet | undefined;
  readonly optional?: KpTutorialDependencySet | undefined;
  readonly authorOnly?: KpTutorialDependencySet | undefined;
}

export interface KpTutorialDependencySet {
  readonly semanticObjectIds: readonly string[];
  readonly transformationIds: readonly string[];
  readonly layoutIds: readonly string[];
  readonly timelineIds: readonly string[];
  readonly capabilities: readonly KpTutorialCapabilityDependency[];
  readonly assets?: readonly KpTutorialAssetDependency[] | undefined;
}

export interface KpTutorialCapabilityDependency {
  readonly library: string;
  readonly capability: string;
  readonly objectType?: string | undefined;
  readonly mode?: string | undefined;
}

export interface KpTutorialAssetDependency {
  readonly id: string;
  readonly kind: "audio" | "data" | "font" | "image" | "texture" | "video";
  readonly url?: string | undefined;
  readonly integrity?: string | undefined;
  readonly sizeBytes?: number | undefined;
}

export interface KpTutorialFallbackSpec {
  readonly strategy: "placeholder" | "static-snapshot" | "text-only" | "typed-error";
  readonly preservesLayout: boolean;
  readonly message?: string | undefined;
}

export interface KpTutorialManifestDiagnostic {
  readonly path: string;
  readonly message: string;
}

export function createKpTutorialCardManifest(
  input: KpTutorialCardManifest
): KpTutorialCardManifest {
  return {
    id: input.id,
    title: input.title,
    version: input.version,
    rootLayoutId: input.rootLayoutId,
    semanticObjectRefs: input.semanticObjectRefs.map(createSemanticObjectRef),
    transformationRefs: input.transformationRefs.map((ref) =>
      createSemanticTransformationRef(ref)
    ),
    layoutRefs: input.layoutRefs.map(cloneLayoutRef),
    timelineRefs: input.timelineRefs.map(cloneTimelineRef),
    checks: input.checks.map(cloneCheck),
    exportProfiles: input.exportProfiles.map(cloneExportProfile),
    dependencies: cloneDependencyManifest(input.dependencies),
    fallback: { ...input.fallback },
    ...(input.summary === undefined ? {} : { summary: input.summary })
  };
}

export function createLinearSolveTutorialCardManifest(): KpTutorialCardManifest {
  const layout = createLinearSolveSynchronizedPanelLayoutSample();
  const equationStateIds = [
    "equation.linear-solve.initial",
    "equation.linear-solve.after-subtract",
    "equation.linear-solve.left-simplified",
    "equation.linear-solve.solved"
  ] as const;
  const [
    initialEquationId,
    afterSubtractEquationId,
    leftSimplifiedEquationId,
    solvedEquationId
  ] = equationStateIds;
  const timelineId = "timeline.linear-solve.shared";
  const transformationIds = [
    "transform.linear-solve.subtract-both-sides-3",
    "transform.linear-solve.cancel-left-additive-inverse",
    "transform.linear-solve.simplify-right-difference"
  ] as const;
  const [
    subtractBothSidesTransformationId,
    cancelTransformationId,
    simplifyTransformationId
  ] = transformationIds;

  return createKpTutorialCardManifest({
    id: "tutorial.linear-solve.card",
    title: "Solve x + 3 = 7",
    version: 1,
    rootLayoutId: layout.id,
    summary:
      "Portable tutorial capsule for scrubbing an equation solve and graph view from one semantic clock.",
    semanticObjectRefs: [
      ...equationStateIds.map((objectId) =>
        createSemanticObjectRef({ objectId, objectType: "equation" })
      ),
      createSemanticObjectRef({
        objectId: "saddle-orbit-graph",
        objectType: "graph-3d"
      })
    ],
    transformationRefs: [
      createSemanticTransformationRef({
        id: subtractBothSidesTransformationId,
        kind: "equation.subtract-both-sides",
        sourceObjectIds: [initialEquationId],
        targetObjectIds: [afterSubtractEquationId],
        preserves: ["structure", "value"],
        summary: "Subtract 3 from both sides while preserving equation value."
      }),
      createSemanticTransformationRef({
        id: cancelTransformationId,
        kind: "equation.cancel",
        sourceObjectIds: [afterSubtractEquationId],
        targetObjectIds: [leftSimplifiedEquationId],
        preserves: ["value"],
        summary: "Cancel +3 and -3 on the left side."
      }),
      createSemanticTransformationRef({
        id: simplifyTransformationId,
        kind: "equation.simplify",
        sourceObjectIds: [leftSimplifiedEquationId],
        targetObjectIds: [solvedEquationId],
        preserves: ["value"],
        summary: "Simplify 7 - 3 into 4."
      })
    ],
    layoutRefs: [
      {
        id: layout.id,
        kind: "synchronized-panel",
        rootLayoutId: layout.rootLayoutId,
        childIds: layout.layoutObjects
          .filter((object) => object.id === layout.rootLayoutId)
          .flatMap((object) => object.childIds),
        sharedClockId: layout.sharedClockId,
        summary: layout.title
      }
    ],
    timelineRefs: [
      {
        id: timelineId,
        kind: "layout-shared-clock",
        clockId: layout.sharedClockId,
        layoutId: layout.id,
        durationMs: 2400,
        beatCount: 50,
        sampleable: true,
        reversible: true,
        summary:
          "Shared normalized clock sampled by equation animation, graph view, and controls."
      }
    ],
    checks: [
      {
        id: "check.linear-solve.manifest-integrity",
        kind: "manifest-integrity",
        requirement: "required",
        targetIds: [layout.id, timelineId],
        summary: "All manifest references resolve before the card can ship."
      },
      {
        id: "check.linear-solve.selector-preservation",
        kind: "selector-preservation",
        requirement: "required",
        targetIds: transformationIds,
        summary:
          "Persisted equation and graph selectors must survive every semantic transform."
      },
      {
        id: "check.linear-solve.sampleable-timeline",
        kind: "sampleable-timeline",
        requirement: "required",
        targetIds: [timelineId],
        summary:
          "The shared timeline must render the same frame for direct seek, forward playback, and rewind."
      },
      {
        id: "check.linear-solve.dependency-closure",
        kind: "dependency-closure",
        requirement: "recommended",
        targetIds: [layout.id, timelineId],
        summary:
          "Runtime dependencies should describe critical, interactive, optional, and fallback loading."
      }
    ],
    exportProfiles: [
      {
        id: "export.linear-solve.card",
        kind: "interactive-card",
        target: "browser",
        settings: { controls: true, maxWidthPx: 720 }
      },
      {
        id: "export.linear-solve.iframe",
        kind: "iframe",
        target: "browser",
        settings: { responsive: true }
      },
      {
        id: "export.linear-solve.gif",
        kind: "gif",
        target: "media",
        settings: { fps: 30, loop: true, maxWidthPx: 640 }
      },
      {
        id: "export.linear-solve.steps",
        kind: "step-sequence",
        target: "static",
        settings: { includeCheckpoints: true }
      }
    ],
    dependencies: {
      critical: {
        semanticObjectIds: equationStateIds,
        transformationIds,
        layoutIds: [layout.id],
        timelineIds: [timelineId],
        capabilities: [
          { library: "kp.semantic", capability: "document.read" },
          {
            library: "kp.layout",
            capability: "sample.synchronized-panel"
          },
          {
            library: "kp.equation",
            capability: "render.katex",
            objectType: "equation"
          }
        ]
      },
      interactive: {
        semanticObjectIds: ["saddle-orbit-graph"],
        transformationIds: [],
        layoutIds: [layout.id],
        timelineIds: [timelineId],
        capabilities: [
          {
            library: "kp.graph",
            capability: "render.webgl",
            mode: "surface.mesh",
            objectType: "graph-3d"
          }
        ]
      },
      optional: {
        semanticObjectIds: [],
        transformationIds: [],
        layoutIds: [],
        timelineIds: [timelineId],
        capabilities: [
          { library: "kp.export", capability: "encode.gif" },
          { library: "kp.export", capability: "render.step-sequence" }
        ]
      }
    },
    fallback: {
      strategy: "static-snapshot",
      preservesLayout: true,
      message:
        "Show static equation and graph snapshots when the interactive runtime is unavailable."
    }
  });
}

export function validateKpTutorialCardManifest(
  manifest: KpTutorialCardManifest
): readonly KpTutorialManifestDiagnostic[] {
  const diagnostics: KpTutorialManifestDiagnostic[] = [];
  const semanticObjectIds = collectUniqueIds(
    manifest.semanticObjectRefs,
    "semanticObjectRefs",
    (ref) => ref.objectId,
    diagnostics
  );
  const transformationIds = collectUniqueIds(
    manifest.transformationRefs,
    "transformationRefs",
    (ref) => ref.id,
    diagnostics
  );
  const layoutIds = collectUniqueIds(
    manifest.layoutRefs,
    "layoutRefs",
    (ref) => ref.id,
    diagnostics
  );
  const timelineIds = collectUniqueIds(
    manifest.timelineRefs,
    "timelineRefs",
    (ref) => ref.id,
    diagnostics
  );

  collectUniqueIds(manifest.checks, "checks", (check) => check.id, diagnostics);
  collectUniqueIds(
    manifest.exportProfiles,
    "exportProfiles",
    (profile) => profile.id,
    diagnostics
  );

  if (manifest.id.trim() === "") {
    diagnostics.push({ path: "id", message: "Tutorial card id is required." });
  }

  if (manifest.title.trim() === "") {
    diagnostics.push({
      path: "title",
      message: "Tutorial card title is required."
    });
  }

  if (manifest.version !== 1) {
    diagnostics.push({
      path: "version",
      message: "Tutorial card manifest version must be 1."
    });
  }

  if (!layoutIds.has(manifest.rootLayoutId)) {
    diagnostics.push({
      path: "rootLayoutId",
      message: `Root layout ${manifest.rootLayoutId} is not declared.`
    });
  }

  manifest.transformationRefs.forEach((ref, transformationIndex) => {
    ref.sourceObjectIds.forEach((objectId, objectIndex) => {
      if (!semanticObjectIds.has(objectId)) {
        diagnostics.push({
          path: `transformationRefs[${transformationIndex}].sourceObjectIds[${objectIndex}]`,
          message: `Transformation ${ref.id} references undeclared semantic object ${objectId}.`
        });
      }
    });
    ref.targetObjectIds.forEach((objectId, objectIndex) => {
      if (!semanticObjectIds.has(objectId)) {
        diagnostics.push({
          path: `transformationRefs[${transformationIndex}].targetObjectIds[${objectIndex}]`,
          message: `Transformation ${ref.id} references undeclared semantic object ${objectId}.`
        });
      }
    });
  });

  manifest.timelineRefs.forEach((timeline, index) => {
    if (timeline.layoutId !== undefined && !layoutIds.has(timeline.layoutId)) {
      diagnostics.push({
        path: `timelineRefs[${index}].layoutId`,
        message: `Timeline ${timeline.id} references undeclared layout ${timeline.layoutId}.`
      });
    }
  });

  validateDependencySet(
    manifest.dependencies.critical,
    "dependencies.critical",
    semanticObjectIds,
    transformationIds,
    layoutIds,
    timelineIds,
    diagnostics
  );
  validateOptionalDependencySet(
    manifest.dependencies.prefetch,
    "dependencies.prefetch",
    semanticObjectIds,
    transformationIds,
    layoutIds,
    timelineIds,
    diagnostics
  );
  validateOptionalDependencySet(
    manifest.dependencies.interactive,
    "dependencies.interactive",
    semanticObjectIds,
    transformationIds,
    layoutIds,
    timelineIds,
    diagnostics
  );
  validateOptionalDependencySet(
    manifest.dependencies.optional,
    "dependencies.optional",
    semanticObjectIds,
    transformationIds,
    layoutIds,
    timelineIds,
    diagnostics
  );
  validateOptionalDependencySet(
    manifest.dependencies.authorOnly,
    "dependencies.authorOnly",
    semanticObjectIds,
    transformationIds,
    layoutIds,
    timelineIds,
    diagnostics
  );

  const addressableIds = new Set([
    ...semanticObjectIds,
    ...transformationIds,
    ...layoutIds,
    ...timelineIds,
    ...manifest.exportProfiles.map((profile) => profile.id)
  ]);

  manifest.checks.forEach((check, checkIndex) => {
    check.targetIds.forEach((targetId, targetIndex) => {
      if (!addressableIds.has(targetId)) {
        diagnostics.push({
          path: `checks[${checkIndex}].targetIds[${targetIndex}]`,
          message: `Check ${check.id} references undeclared target ${targetId}.`
        });
      }
    });
  });

  return diagnostics;
}

function cloneLayoutRef(ref: KpTutorialLayoutRef): KpTutorialLayoutRef {
  return {
    id: ref.id,
    kind: ref.kind,
    rootLayoutId: ref.rootLayoutId,
    childIds: [...ref.childIds],
    ...(ref.sharedClockId === undefined ? {} : { sharedClockId: ref.sharedClockId }),
    ...(ref.summary === undefined ? {} : { summary: ref.summary })
  };
}

function cloneTimelineRef(ref: KpTutorialTimelineRef): KpTutorialTimelineRef {
  return {
    id: ref.id,
    kind: ref.kind,
    ...(ref.clockId === undefined ? {} : { clockId: ref.clockId }),
    ...(ref.motionPlanId === undefined ? {} : { motionPlanId: ref.motionPlanId }),
    ...(ref.layoutId === undefined ? {} : { layoutId: ref.layoutId }),
    ...(ref.durationMs === undefined ? {} : { durationMs: ref.durationMs }),
    ...(ref.beatCount === undefined ? {} : { beatCount: ref.beatCount }),
    ...(ref.sampleable === undefined ? {} : { sampleable: ref.sampleable }),
    ...(ref.reversible === undefined ? {} : { reversible: ref.reversible }),
    ...(ref.summary === undefined ? {} : { summary: ref.summary })
  };
}

function cloneCheck(check: KpTutorialCardCheck): KpTutorialCardCheck {
  return {
    id: check.id,
    kind: check.kind,
    requirement: check.requirement,
    targetIds: [...check.targetIds],
    summary: check.summary
  };
}

function cloneExportProfile(
  profile: KpTutorialExportProfile
): KpTutorialExportProfile {
  return {
    id: profile.id,
    kind: profile.kind,
    target: profile.target,
    ...(profile.settings === undefined
      ? {}
      : { settings: cloneExportSettings(profile.settings) })
  };
}

function cloneExportSettings(
  settings: Readonly<Record<string, KpTutorialExportSettingValue>>
): Readonly<Record<string, KpTutorialExportSettingValue>> {
  return Object.fromEntries(
    Object.entries(settings).map(([key, value]) => [
      key,
      Array.isArray(value) ? [...value] : value
    ])
  );
}

function cloneDependencyManifest(
  manifest: KpTutorialDependencyManifest
): KpTutorialDependencyManifest {
  return {
    critical: cloneDependencySet(manifest.critical),
    ...(manifest.prefetch === undefined
      ? {}
      : { prefetch: cloneDependencySet(manifest.prefetch) }),
    ...(manifest.interactive === undefined
      ? {}
      : { interactive: cloneDependencySet(manifest.interactive) }),
    ...(manifest.optional === undefined
      ? {}
      : { optional: cloneDependencySet(manifest.optional) }),
    ...(manifest.authorOnly === undefined
      ? {}
      : { authorOnly: cloneDependencySet(manifest.authorOnly) })
  };
}

function cloneDependencySet(
  dependencySet: KpTutorialDependencySet
): KpTutorialDependencySet {
  return {
    semanticObjectIds: [...dependencySet.semanticObjectIds],
    transformationIds: [...dependencySet.transformationIds],
    layoutIds: [...dependencySet.layoutIds],
    timelineIds: [...dependencySet.timelineIds],
    capabilities: dependencySet.capabilities.map((capability) => ({
      ...capability
    })),
    ...(dependencySet.assets === undefined
      ? {}
      : {
          assets: dependencySet.assets.map((asset) => ({ ...asset }))
        })
  };
}

function collectUniqueIds<T>(
  records: readonly T[],
  path: string,
  getId: (record: T) => string,
  diagnostics: KpTutorialManifestDiagnostic[]
): Set<string> {
  const ids = new Set<string>();
  const seen = new Set<string>();

  records.forEach((record, index) => {
    const id = getId(record);
    ids.add(id);

    if (id.trim() === "") {
      diagnostics.push({
        path: `${path}[${index}].id`,
        message: `${path}[${index}] id is required.`
      });
      return;
    }

    if (seen.has(id)) {
      diagnostics.push({
        path: `${path}[${index}].id`,
        message: `Duplicate id ${id}.`
      });
      return;
    }

    seen.add(id);
  });

  return ids;
}

function validateOptionalDependencySet(
  dependencySet: KpTutorialDependencySet | undefined,
  path: string,
  semanticObjectIds: ReadonlySet<string>,
  transformationIds: ReadonlySet<string>,
  layoutIds: ReadonlySet<string>,
  timelineIds: ReadonlySet<string>,
  diagnostics: KpTutorialManifestDiagnostic[]
): void {
  if (dependencySet === undefined) {
    return;
  }

  validateDependencySet(
    dependencySet,
    path,
    semanticObjectIds,
    transformationIds,
    layoutIds,
    timelineIds,
    diagnostics
  );
}

function validateDependencySet(
  dependencySet: KpTutorialDependencySet,
  path: string,
  semanticObjectIds: ReadonlySet<string>,
  transformationIds: ReadonlySet<string>,
  layoutIds: ReadonlySet<string>,
  timelineIds: ReadonlySet<string>,
  diagnostics: KpTutorialManifestDiagnostic[]
): void {
  validateReferencedIds(
    dependencySet.semanticObjectIds,
    `${path}.semanticObjectIds`,
    semanticObjectIds,
    "semantic object",
    diagnostics
  );
  validateReferencedIds(
    dependencySet.transformationIds,
    `${path}.transformationIds`,
    transformationIds,
    "transformation",
    diagnostics
  );
  validateReferencedIds(
    dependencySet.layoutIds,
    `${path}.layoutIds`,
    layoutIds,
    "layout",
    diagnostics
  );
  validateReferencedIds(
    dependencySet.timelineIds,
    `${path}.timelineIds`,
    timelineIds,
    "timeline",
    diagnostics
  );
}

function validateReferencedIds(
  ids: readonly string[],
  path: string,
  declaredIds: ReadonlySet<string>,
  label: string,
  diagnostics: KpTutorialManifestDiagnostic[]
): void {
  ids.forEach((id, index) => {
    if (!declaredIds.has(id)) {
      diagnostics.push({
        path: `${path}[${index}]`,
        message: `Dependency references undeclared ${label} ${id}.`
      });
    }
  });
}
