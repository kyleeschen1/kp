import {
  createKpTutorialCardManifest,
  type KpTutorialCapabilityDependency,
  type KpTutorialCardManifest,
  type KpTutorialDependencyManifest,
  type KpTutorialDependencySet
} from "./card-manifest.ts";
import { formatKpCapabilityKey } from "../semantic/capability-key.ts";
import {
  createKpCapabilityLoadPlan,
  type KpCapabilityLoadPlanDiagnostic
} from "../semantic/capability-loader-plan.ts";
import type { SemanticObjectRef } from "../semantic/animation.ts";

export type KpTutorialDependencyPhase = keyof KpTutorialDependencyManifest;

export type KpTutorialDependencyLoadStage =
  | "authoring"
  | "export"
  | "initial-render"
  | "interaction"
  | "preload";

export interface KpTutorialDependencyCounts {
  readonly semanticObjectCount: number;
  readonly transformationCount: number;
  readonly layoutCount: number;
  readonly timelineCount: number;
  readonly capabilityCount: number;
  readonly capabilityPackageCount: number;
  readonly assetCount: number;
}

export interface KpTutorialDependencyPlanDiagnostic {
  readonly path: string;
  readonly message: string;
}

export interface KpTutorialDependencyPlanPhase {
  readonly phase: KpTutorialDependencyPhase;
  readonly loadStage: KpTutorialDependencyLoadStage;
  readonly requiredForInitialRender: boolean;
  readonly semanticObjectIds: readonly string[];
  readonly transformationIds: readonly string[];
  readonly layoutIds: readonly string[];
  readonly timelineIds: readonly string[];
  readonly capabilityKeys: readonly string[];
  readonly capabilityPackageIds: readonly string[];
  readonly capabilityPackageKeys: readonly string[];
  readonly assetIds: readonly string[];
  readonly diagnostics: readonly KpTutorialDependencyPlanDiagnostic[];
  readonly counts: KpTutorialDependencyCounts;
}

export interface KpTutorialCardDependencyPlan {
  readonly manifestId: string;
  readonly phases: readonly KpTutorialDependencyPlanPhase[];
  readonly totals: KpTutorialDependencyCounts;
  readonly diagnostics: readonly KpTutorialDependencyPlanDiagnostic[];
}

const dependencyPhases: readonly KpTutorialDependencyPhase[] = [
  "critical",
  "prefetch",
  "interactive",
  "optional",
  "authorOnly"
];

export function createKpTutorialCardDependencyPlan(
  input: KpTutorialCardManifest
): KpTutorialCardDependencyPlan {
  const manifest = createKpTutorialCardManifest(input);
  const objectRefsById = new Map(
    manifest.semanticObjectRefs.map((ref) => [ref.objectId, ref])
  );
  const phases = dependencyPhases.flatMap((phase) => {
    const dependencySet = manifest.dependencies[phase];

    return dependencySet === undefined || dependencySetIsEmpty(dependencySet)
      ? []
      : [createDependencyPlanPhase(phase, dependencySet, objectRefsById)];
  });

  return {
    manifestId: manifest.id,
    phases,
    totals: dependencyTotals(phases),
    diagnostics: phases.flatMap((phase) => phase.diagnostics)
  };
}

export function dependencyCapabilityKey(
  capability: KpTutorialCapabilityDependency
): string {
  return formatKpCapabilityKey(capability);
}

function createDependencyPlanPhase(
  phase: KpTutorialDependencyPhase,
  dependencySet: KpTutorialDependencySet,
  objectRefsById: ReadonlyMap<string, SemanticObjectRef>
): KpTutorialDependencyPlanPhase {
  const assetIds = dependencySet.assets?.map((asset) => asset.id) ?? [];
  const capabilityKeys = dependencySet.capabilities.map(dependencyCapabilityKey);
  const capabilityPackageRequest = createCapabilityPackageRequest(
    phase,
    dependencySet,
    objectRefsById
  );
  const capabilityPackagePlan = createKpCapabilityLoadPlan({
    objectTypes: capabilityPackageRequest.objectTypes
  });
  const diagnostics = [
    ...capabilityPackageRequest.diagnostics,
    ...remapCapabilityLoadPlanDiagnostics(
      phase,
      capabilityPackageRequest.sources,
      capabilityPackagePlan.diagnostics
    )
  ];

  return {
    phase,
    loadStage: loadStageForPhase(phase),
    requiredForInitialRender: phase === "critical",
    semanticObjectIds: [...dependencySet.semanticObjectIds],
    transformationIds: [...dependencySet.transformationIds],
    layoutIds: [...dependencySet.layoutIds],
    timelineIds: [...dependencySet.timelineIds],
    capabilityKeys,
    capabilityPackageIds: [...capabilityPackagePlan.packageIds],
    capabilityPackageKeys: [...capabilityPackagePlan.capabilityKeys],
    assetIds,
    diagnostics,
    counts: dependencyCounts({
      semanticObjectIds: dependencySet.semanticObjectIds,
      transformationIds: dependencySet.transformationIds,
      layoutIds: dependencySet.layoutIds,
      timelineIds: dependencySet.timelineIds,
      capabilityKeys,
      capabilityPackageIds: capabilityPackagePlan.packageIds,
      assetIds
    })
  };
}

function createCapabilityPackageRequest(
  phase: KpTutorialDependencyPhase,
  dependencySet: KpTutorialDependencySet,
  objectRefsById: ReadonlyMap<string, SemanticObjectRef>
): {
  readonly objectTypes: readonly string[];
  readonly sources: readonly CapabilityPackageObjectTypeSource[];
  readonly diagnostics: readonly KpTutorialDependencyPlanDiagnostic[];
} {
  const objectTypes: string[] = [];
  const sources: CapabilityPackageObjectTypeSource[] = [];
  const diagnostics: KpTutorialDependencyPlanDiagnostic[] = [];

  dependencySet.semanticObjectIds.forEach((objectId, dependencyIndex) => {
    const objectType = objectRefsById.get(objectId)?.objectType;

    if (objectType === undefined) {
      diagnostics.push({
        path: `dependencies.${phase}.semanticObjectIds[${dependencyIndex}]`,
        message:
          `Semantic object ${objectId} has no objectType; capability package planning skipped it.`
      });
      return;
    }

    objectTypes.push(objectType);
    sources.push({ dependencyIndex, objectType });
  });

  return { objectTypes, sources, diagnostics };
}

interface CapabilityPackageObjectTypeSource {
  readonly dependencyIndex: number;
  readonly objectType: string;
}

function remapCapabilityLoadPlanDiagnostics(
  phase: KpTutorialDependencyPhase,
  sources: readonly CapabilityPackageObjectTypeSource[],
  diagnostics: readonly KpCapabilityLoadPlanDiagnostic[]
): readonly KpTutorialDependencyPlanDiagnostic[] {
  return diagnostics.map((diagnostic) => {
    const objectTypeIndex = objectTypeDiagnosticIndex(diagnostic.path);
    const source =
      objectTypeIndex === undefined ? undefined : sources[objectTypeIndex];

    return {
      path:
        source === undefined
          ? `dependencies.${phase}.capabilityPackages.${diagnostic.path}`
          : `dependencies.${phase}.semanticObjectIds[${source.dependencyIndex}].objectType`,
      message: diagnostic.message
    };
  });
}

function objectTypeDiagnosticIndex(path: string): number | undefined {
  const match = /^objectTypes\[(\d+)\]$/.exec(path);

  return match === null ? undefined : Number(match[1]);
}

function dependencyTotals(
  phases: readonly KpTutorialDependencyPlanPhase[]
): KpTutorialDependencyCounts {
  return dependencyCounts({
    semanticObjectIds: unique(phases.flatMap((phase) => phase.semanticObjectIds)),
    transformationIds: unique(phases.flatMap((phase) => phase.transformationIds)),
    layoutIds: unique(phases.flatMap((phase) => phase.layoutIds)),
    timelineIds: unique(phases.flatMap((phase) => phase.timelineIds)),
    capabilityKeys: unique(phases.flatMap((phase) => phase.capabilityKeys)),
    capabilityPackageIds: unique(
      phases.flatMap((phase) => phase.capabilityPackageIds)
    ),
    assetIds: unique(phases.flatMap((phase) => phase.assetIds))
  });
}

function dependencyCounts(input: {
  readonly semanticObjectIds: readonly string[];
  readonly transformationIds: readonly string[];
  readonly layoutIds: readonly string[];
  readonly timelineIds: readonly string[];
  readonly capabilityKeys: readonly string[];
  readonly capabilityPackageIds: readonly string[];
  readonly assetIds: readonly string[];
}): KpTutorialDependencyCounts {
  return {
    semanticObjectCount: input.semanticObjectIds.length,
    transformationCount: input.transformationIds.length,
    layoutCount: input.layoutIds.length,
    timelineCount: input.timelineIds.length,
    capabilityCount: input.capabilityKeys.length,
    capabilityPackageCount: input.capabilityPackageIds.length,
    assetCount: input.assetIds.length
  };
}

function loadStageForPhase(
  phase: KpTutorialDependencyPhase
): KpTutorialDependencyLoadStage {
  switch (phase) {
    case "critical":
      return "initial-render";
    case "prefetch":
      return "preload";
    case "interactive":
      return "interaction";
    case "optional":
      return "export";
    case "authorOnly":
      return "authoring";
  }
}

function dependencySetIsEmpty(dependencySet: KpTutorialDependencySet): boolean {
  return (
    dependencySet.semanticObjectIds.length === 0 &&
    dependencySet.transformationIds.length === 0 &&
    dependencySet.layoutIds.length === 0 &&
    dependencySet.timelineIds.length === 0 &&
    dependencySet.capabilities.length === 0 &&
    (dependencySet.assets?.length ?? 0) === 0
  );
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}
