import {
  createKpTutorialCardManifest,
  type KpTutorialCapabilityDependency,
  type KpTutorialCardManifest,
  type KpTutorialDependencyManifest,
  type KpTutorialDependencySet
} from "./card-manifest.ts";
import { formatKpCapabilityKey } from "../semantic/capability-key.ts";

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
  readonly assetCount: number;
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
  readonly assetIds: readonly string[];
  readonly counts: KpTutorialDependencyCounts;
}

export interface KpTutorialCardDependencyPlan {
  readonly manifestId: string;
  readonly phases: readonly KpTutorialDependencyPlanPhase[];
  readonly totals: KpTutorialDependencyCounts;
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
  const phases = dependencyPhases.flatMap((phase) => {
    const dependencySet = manifest.dependencies[phase];

    return dependencySet === undefined || dependencySetIsEmpty(dependencySet)
      ? []
      : [createDependencyPlanPhase(phase, dependencySet)];
  });

  return {
    manifestId: manifest.id,
    phases,
    totals: dependencyTotals(phases)
  };
}

export function dependencyCapabilityKey(
  capability: KpTutorialCapabilityDependency
): string {
  return formatKpCapabilityKey(capability);
}

function createDependencyPlanPhase(
  phase: KpTutorialDependencyPhase,
  dependencySet: KpTutorialDependencySet
): KpTutorialDependencyPlanPhase {
  const assetIds = dependencySet.assets?.map((asset) => asset.id) ?? [];
  const capabilityKeys = dependencySet.capabilities.map(dependencyCapabilityKey);

  return {
    phase,
    loadStage: loadStageForPhase(phase),
    requiredForInitialRender: phase === "critical",
    semanticObjectIds: [...dependencySet.semanticObjectIds],
    transformationIds: [...dependencySet.transformationIds],
    layoutIds: [...dependencySet.layoutIds],
    timelineIds: [...dependencySet.timelineIds],
    capabilityKeys,
    assetIds,
    counts: dependencyCounts({
      semanticObjectIds: dependencySet.semanticObjectIds,
      transformationIds: dependencySet.transformationIds,
      layoutIds: dependencySet.layoutIds,
      timelineIds: dependencySet.timelineIds,
      capabilityKeys,
      assetIds
    })
  };
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
    assetIds: unique(phases.flatMap((phase) => phase.assetIds))
  });
}

function dependencyCounts(input: {
  readonly semanticObjectIds: readonly string[];
  readonly transformationIds: readonly string[];
  readonly layoutIds: readonly string[];
  readonly timelineIds: readonly string[];
  readonly capabilityKeys: readonly string[];
  readonly assetIds: readonly string[];
}): KpTutorialDependencyCounts {
  return {
    semanticObjectCount: input.semanticObjectIds.length,
    transformationCount: input.transformationIds.length,
    layoutCount: input.layoutIds.length,
    timelineCount: input.timelineIds.length,
    capabilityCount: input.capabilityKeys.length,
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
