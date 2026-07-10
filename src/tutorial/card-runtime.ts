import type {
  SemanticObjectRef,
  SemanticTransformationRef
} from "../semantic/animation.ts";
import {
  createKpTutorialCardManifest,
  validateKpTutorialCardManifest,
  type KpTutorialCapabilityDependency,
  type KpTutorialCardCheck,
  type KpTutorialCardManifest,
  type KpTutorialDependencyManifest,
  type KpTutorialExportProfile,
  type KpTutorialFallbackSpec,
  type KpTutorialLayoutRef,
  type KpTutorialManifestDiagnostic,
  type KpTutorialTimelineRef
} from "./card-manifest.ts";

export type KpTutorialDependencyPhase = keyof KpTutorialDependencyManifest;

export interface KpTutorialRuntimeCapabilityDependency
  extends KpTutorialCapabilityDependency {
  readonly phase: KpTutorialDependencyPhase;
  readonly index: number;
}

export interface KpTutorialCardRuntimeContext {
  readonly manifest: KpTutorialCardManifest;
  readonly manifestId: string;
  readonly rootLayout: KpTutorialLayoutRef | undefined;
  readonly sharedTimeline: KpTutorialTimelineRef | undefined;
  readonly semanticObjectsById: ReadonlyMap<string, SemanticObjectRef>;
  readonly transformationsById: ReadonlyMap<string, SemanticTransformationRef>;
  readonly layoutsById: ReadonlyMap<string, KpTutorialLayoutRef>;
  readonly timelinesById: ReadonlyMap<string, KpTutorialTimelineRef>;
  readonly checksById: ReadonlyMap<string, KpTutorialCardCheck>;
  readonly exportProfilesById: ReadonlyMap<string, KpTutorialExportProfile>;
  readonly capabilityDependencies: readonly KpTutorialRuntimeCapabilityDependency[];
  readonly fallback: KpTutorialFallbackSpec;
  readonly diagnostics: readonly KpTutorialManifestDiagnostic[];
}

export interface KpTutorialSemanticObjectRuntimeRef {
  readonly kind: "semantic-object";
  readonly id: string;
}

export interface KpTutorialTransformationRuntimeRef {
  readonly kind: "transformation";
  readonly id: string;
}

export interface KpTutorialLayoutRuntimeRef {
  readonly kind: "layout";
  readonly id: string;
}

export interface KpTutorialTimelineRuntimeRef {
  readonly kind: "timeline";
  readonly id: string;
}

export interface KpTutorialCheckRuntimeRef {
  readonly kind: "check";
  readonly id: string;
}

export interface KpTutorialExportProfileRuntimeRef {
  readonly kind: "export-profile";
  readonly id: string;
}

export interface KpTutorialCapabilityRuntimeRef {
  readonly kind: "capability";
  readonly library: string;
  readonly capability: string;
  readonly objectType?: string | undefined;
  readonly mode?: string | undefined;
}

export interface KpTutorialFallbackRuntimeRef {
  readonly kind: "fallback";
}

export type KpTutorialCardRuntimeRef =
  | KpTutorialSemanticObjectRuntimeRef
  | KpTutorialTransformationRuntimeRef
  | KpTutorialLayoutRuntimeRef
  | KpTutorialTimelineRuntimeRef
  | KpTutorialCheckRuntimeRef
  | KpTutorialExportProfileRuntimeRef
  | KpTutorialCapabilityRuntimeRef
  | KpTutorialFallbackRuntimeRef;

export interface KpTutorialResolvedRuntimeRef<TKind extends string, TValue> {
  readonly kind: TKind;
  readonly value: TValue;
}

export type KpTutorialCardResolvedRuntimeRef =
  | KpTutorialResolvedRuntimeRef<"semantic-object", SemanticObjectRef>
  | KpTutorialResolvedRuntimeRef<"transformation", SemanticTransformationRef>
  | KpTutorialResolvedRuntimeRef<"layout", KpTutorialLayoutRef>
  | KpTutorialResolvedRuntimeRef<"timeline", KpTutorialTimelineRef>
  | KpTutorialResolvedRuntimeRef<"check", KpTutorialCardCheck>
  | KpTutorialResolvedRuntimeRef<"export-profile", KpTutorialExportProfile>
  | KpTutorialResolvedRuntimeRef<
      "capability",
      KpTutorialRuntimeCapabilityDependency
    >
  | KpTutorialResolvedRuntimeRef<"fallback", KpTutorialFallbackSpec>;

export function createKpTutorialCardRuntimeContext(
  input: KpTutorialCardManifest
): KpTutorialCardRuntimeContext {
  const manifest = createKpTutorialCardManifest(input);
  const semanticObjectsById = mapById(
    manifest.semanticObjectRefs,
    (ref) => ref.objectId
  );
  const transformationsById = mapById(
    manifest.transformationRefs,
    (ref) => ref.id
  );
  const layoutsById = mapById(manifest.layoutRefs, (ref) => ref.id);
  const timelinesById = mapById(manifest.timelineRefs, (ref) => ref.id);
  const checksById = mapById(manifest.checks, (check) => check.id);
  const exportProfilesById = mapById(
    manifest.exportProfiles,
    (profile) => profile.id
  );
  const rootLayout = layoutsById.get(manifest.rootLayoutId);
  const sharedTimeline = findSharedTimeline(manifest, rootLayout);

  return {
    manifest,
    manifestId: manifest.id,
    rootLayout,
    sharedTimeline,
    semanticObjectsById,
    transformationsById,
    layoutsById,
    timelinesById,
    checksById,
    exportProfilesById,
    capabilityDependencies: collectCapabilityDependencies(manifest.dependencies),
    fallback: manifest.fallback,
    diagnostics: validateKpTutorialCardManifest(manifest)
  };
}

export function resolveKpTutorialCardRuntimeRef(
  context: KpTutorialCardRuntimeContext,
  ref: KpTutorialSemanticObjectRuntimeRef
): KpTutorialResolvedRuntimeRef<"semantic-object", SemanticObjectRef> | undefined;
export function resolveKpTutorialCardRuntimeRef(
  context: KpTutorialCardRuntimeContext,
  ref: KpTutorialTransformationRuntimeRef
):
  | KpTutorialResolvedRuntimeRef<"transformation", SemanticTransformationRef>
  | undefined;
export function resolveKpTutorialCardRuntimeRef(
  context: KpTutorialCardRuntimeContext,
  ref: KpTutorialLayoutRuntimeRef
): KpTutorialResolvedRuntimeRef<"layout", KpTutorialLayoutRef> | undefined;
export function resolveKpTutorialCardRuntimeRef(
  context: KpTutorialCardRuntimeContext,
  ref: KpTutorialTimelineRuntimeRef
): KpTutorialResolvedRuntimeRef<"timeline", KpTutorialTimelineRef> | undefined;
export function resolveKpTutorialCardRuntimeRef(
  context: KpTutorialCardRuntimeContext,
  ref: KpTutorialCheckRuntimeRef
): KpTutorialResolvedRuntimeRef<"check", KpTutorialCardCheck> | undefined;
export function resolveKpTutorialCardRuntimeRef(
  context: KpTutorialCardRuntimeContext,
  ref: KpTutorialExportProfileRuntimeRef
):
  | KpTutorialResolvedRuntimeRef<"export-profile", KpTutorialExportProfile>
  | undefined;
export function resolveKpTutorialCardRuntimeRef(
  context: KpTutorialCardRuntimeContext,
  ref: KpTutorialCapabilityRuntimeRef
):
  | KpTutorialResolvedRuntimeRef<"capability", KpTutorialRuntimeCapabilityDependency>
  | undefined;
export function resolveKpTutorialCardRuntimeRef(
  context: KpTutorialCardRuntimeContext,
  ref: KpTutorialFallbackRuntimeRef
): KpTutorialResolvedRuntimeRef<"fallback", KpTutorialFallbackSpec>;
export function resolveKpTutorialCardRuntimeRef(
  context: KpTutorialCardRuntimeContext,
  ref: KpTutorialCardRuntimeRef
): KpTutorialCardResolvedRuntimeRef | undefined {
  switch (ref.kind) {
    case "semantic-object":
      return resolveMapValue("semantic-object", context.semanticObjectsById, ref.id);
    case "transformation":
      return resolveMapValue("transformation", context.transformationsById, ref.id);
    case "layout":
      return resolveMapValue("layout", context.layoutsById, ref.id);
    case "timeline":
      return resolveMapValue("timeline", context.timelinesById, ref.id);
    case "check":
      return resolveMapValue("check", context.checksById, ref.id);
    case "export-profile":
      return resolveMapValue(
        "export-profile",
        context.exportProfilesById,
        ref.id
      );
    case "capability": {
      const capability = context.capabilityDependencies.find((dependency) =>
        matchesCapabilityRef(dependency, ref)
      );
      return capability === undefined
        ? undefined
        : { kind: "capability", value: capability };
    }
    case "fallback":
      return { kind: "fallback", value: context.fallback };
  }
}

function mapById<T>(
  records: readonly T[],
  getId: (record: T) => string
): ReadonlyMap<string, T> {
  return new Map(records.map((record) => [getId(record), record]));
}

function resolveMapValue<TKind extends string, TValue>(
  kind: TKind,
  map: ReadonlyMap<string, TValue>,
  id: string
): KpTutorialResolvedRuntimeRef<TKind, TValue> | undefined {
  const value = map.get(id);
  return value === undefined ? undefined : { kind, value };
}

function findSharedTimeline(
  manifest: KpTutorialCardManifest,
  rootLayout: KpTutorialLayoutRef | undefined
): KpTutorialTimelineRef | undefined {
  return (
    manifest.timelineRefs.find(
      (timeline) =>
        timeline.layoutId === manifest.rootLayoutId ||
        (rootLayout?.sharedClockId !== undefined &&
          timeline.clockId === rootLayout.sharedClockId)
    ) ??
    manifest.timelineRefs.find((timeline) => timeline.kind === "layout-shared-clock") ??
    manifest.timelineRefs[0]
  );
}

function collectCapabilityDependencies(
  dependencies: KpTutorialDependencyManifest
): readonly KpTutorialRuntimeCapabilityDependency[] {
  return dependencyPhases.flatMap((phase) => {
    const dependencySet = dependencies[phase];
    return dependencySet === undefined
      ? []
      : dependencySet.capabilities.map((capability, index) => ({
          ...capability,
          phase,
          index
        }));
  });
}

function matchesCapabilityRef(
  dependency: KpTutorialRuntimeCapabilityDependency,
  ref: KpTutorialCapabilityRuntimeRef
): boolean {
  return (
    dependency.library === ref.library &&
    dependency.capability === ref.capability &&
    optionalFieldMatches(dependency.objectType, ref.objectType) &&
    optionalFieldMatches(dependency.mode, ref.mode)
  );
}

function optionalFieldMatches(
  dependencyValue: string | undefined,
  refValue: string | undefined
): boolean {
  return refValue === undefined || dependencyValue === refValue;
}

const dependencyPhases: readonly KpTutorialDependencyPhase[] = [
  "critical",
  "prefetch",
  "interactive",
  "optional",
  "authorOnly"
];
