import {
  createKpCanonicalNativeKatexSceneSession,
  projectKpNativeKatexSemanticPaintRelations,
  type KpCanonicalNativeKatexSceneSession,
  type KpNativeKatexSceneOwnershipFrame,
  type KpNativeKatexSemanticPaintRelation
} from "./native-katex-scene-compositor.ts";
import type {
  KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";
import type {
  KpEquationOperationChoreography
} from "./native-katex-operation-choreography.ts";
import type {
  KpLogQuotientNativeEndpoint
} from "./log-quotient-native-endpoints.ts";
import {
  isKpCompiledLogQuotientOperation,
  type KpCompiledLogQuotientOperation
} from "../semantic/log-quotient-transformation-compiler.ts";
import type {
  SelectorCorrespondenceRecord
} from "../semantic/correspondence.ts";

export interface KpLogQuotientTransitSession {
  readonly kind: "kp-log-quotient-transit-session";
  readonly lifecycle: "renderer-session";
  readonly transformationId: string;
  readonly canonical: KpCanonicalNativeKatexSceneSession;
  readonly apply: (progress: number) => KpNativeKatexSceneOwnershipFrame;
  readonly retire: () => void;
}

export function projectKpLogQuotientNativePaintRelations(
  operation: KpCompiledLogQuotientOperation
): readonly KpNativeKatexSemanticPaintRelation[] {
  if (!isKpCompiledLogQuotientOperation(operation)) {
    throw new Error("Log-quotient paint relations require nominal compiler authority.");
  }
  const records = operation.transformation.correspondenceMap?.records;
  if (records === undefined) {
    throw new Error("Log-quotient paint relations require correspondence.");
  }
  return projectKpNativeKatexSemanticPaintRelations({
    groups: records.map(projectRelationGroup)
  });
}

export function createKpLogQuotientTransitSession(input: {
  readonly operation: KpCompiledLogQuotientOperation;
  readonly sourceEndpoint: KpLogQuotientNativeEndpoint;
  readonly targetEndpoint: KpLogQuotientNativeEndpoint;
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly operationChoreography?: KpEquationOperationChoreography | undefined;
}): KpLogQuotientTransitSession {
  assertTransitInput(input);
  const canonical = createKpCanonicalNativeKatexSceneSession({
    source: input.source,
    target: input.target,
    relations: projectKpLogQuotientNativePaintRelations(input.operation),
    fanInRouting: true,
    endpointDwellFraction: 0,
    ...(input.operationChoreography === undefined
      ? {}
      : { operationChoreography: input.operationChoreography })
  });
  let retired = false;
  return Object.freeze({
    kind: "kp-log-quotient-transit-session" as const,
    lifecycle: "renderer-session" as const,
    transformationId: input.operation.transformation.id,
    canonical,
    apply(progress: number) {
      if (retired) {
        throw new Error("Cannot apply a retired log-quotient transit session.");
      }
      const ownership = canonical.session.apply(bounded(progress));
      assertExclusiveKpLogQuotientTransitOwnership(ownership);
      return ownership;
    },
    retire() {
      if (retired) return;
      retired = true;
      canonical.session.retire({
        kind: "native-katex-paint-preserving-retirement",
        reason: "surface-disposed",
        structuralSuccession: "retire-preserving-paint"
      });
    }
  });
}

export function assertExclusiveKpLogQuotientTransitOwnership(
  ownership: KpNativeKatexSceneOwnershipFrame
): void {
  const expected = ownership.visualOwner === "source-native"
    ? [1, 0, 0]
    : ownership.visualOwner === "material-scene"
      ? [0, 1, 0]
      : [0, 0, 1];
  const actual = [
    ownership.sourceNativeOpacity,
    ownership.materialSceneOpacity,
    ownership.targetNativeOpacity
  ];
  if (actual.some((value, index) => value !== expected[index])) {
    throw new Error(
      `Log-quotient owner ${ownership.visualOwner} disagrees with native paint opacity.`
    );
  }
}

function assertTransitInput(input: {
  readonly operation: KpCompiledLogQuotientOperation;
  readonly sourceEndpoint: KpLogQuotientNativeEndpoint;
  readonly targetEndpoint: KpLogQuotientNativeEndpoint;
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}): void {
  if (!isKpCompiledLogQuotientOperation(input.operation)) {
    throw new Error("Log-quotient transit requires nominal compiler authority.");
  }
  if (
    input.operation.contract.source.id !== input.sourceEndpoint.stateId ||
    input.operation.contract.target.id !== input.targetEndpoint.stateId
  ) {
    throw new Error("Log-quotient transit has crossed endpoint authority.");
  }
  if (
    input.source.endpoint !== "source" ||
    input.target.endpoint !== "target" ||
    input.source.stage !== input.target.stage
  ) {
    throw new Error("Log-quotient transit requires one shared measured stage.");
  }
}

function projectRelationGroup(record: SelectorCorrespondenceRecord) {
  switch (record.relation) {
    case "identity":
    case "role-change":
      return Object.freeze({
        id: record.id,
        kind: "one-to-one" as const,
        sourceEntityIds: record.sourceSelectorIds,
        targetEntityIds: record.targetSelectorIds
      });
    case "fan-in":
      return Object.freeze({
        id: record.id,
        kind: "many-to-one" as const,
        sourceEntityIds: record.sourceSelectorIds,
        targetEntityIds: record.targetSelectorIds
      });
    case "introduction":
      return Object.freeze({
        id: record.id,
        kind: "introduction" as const,
        sourceEntityIds: record.sourceSelectorIds,
        targetEntityIds: record.targetSelectorIds
      });
    case "removal":
      return Object.freeze({
        id: record.id,
        kind: "removal" as const,
        sourceEntityIds: record.sourceSelectorIds,
        targetEntityIds: record.targetSelectorIds
      });
    case "fan-out":
    case "cancelation":
    case "artifact":
    case "focus":
      throw new Error(`Log-quotient transit does not admit ${record.relation}.`);
  }
}

function bounded(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Log-quotient transit progress must be finite.");
  }
  return Math.max(0, Math.min(1, value));
}
