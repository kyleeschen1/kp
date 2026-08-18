import type {
  KpCanonicalNativeKatexSceneSession,
  KpNativeKatexSceneOwnershipFrame
} from "./native-katex-scene-compositor.ts";
import type {
  KpNativeKatexSemanticPaintRelation
} from "./native-katex-base-scene-plan.ts";
import type {
  KpNativeKatexFeaturePack
} from "./native-katex-feature-pack-contract.ts";
import type {
  KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";
import type {
  KpEquationOperationChoreography
} from "./native-katex-operation-choreography.ts";
import type {
  KpLogExponentNativeEndpoint
} from "./log-exponent-native-endpoints.ts";
import {
  isKpCompiledLogExponentOperation,
  type KpCompiledLogExponentOperation
} from "../semantic/log-exponent-transformation-compiler.ts";
import type {
  SelectorCorrespondenceRecord
} from "../semantic/correspondence.ts";
import type {
  KpCompiledSymbolMotionContract
} from "../animation/symbol-motion-contract.ts";
import {
  createKpLogExponentTrackProjection
} from "./native-katex-log-exponent-track-projection.ts";

export interface KpLogExponentTransitApplication {
  readonly progress: number;
  readonly direction: "forward" | "rewind";
  readonly reducedMotion?: boolean | undefined;
}

export interface KpLogExponentTransitSession {
  readonly kind: "kp-log-exponent-transit-session";
  readonly lifecycle: "renderer-session";
  readonly operationId: string;
  readonly sourceStateId: string;
  readonly targetStateId: string;
  readonly canonical: KpCanonicalNativeKatexSceneSession;
  readonly apply: (
    application: KpLogExponentTransitApplication
  ) => KpNativeKatexSceneOwnershipFrame;
  readonly retire: () => void;
}

export function projectKpLogExponentNativePaintRelations(
  operation: KpCompiledLogExponentOperation,
  nativeKatex: KpNativeKatexFeaturePack
): readonly KpNativeKatexSemanticPaintRelation[] {
  if (!isKpCompiledLogExponentOperation(operation)) {
    throw new Error(
      "Log-exponent paint relations require a nominal compiled operation."
    );
  }
  const correspondence = operation.transformation.correspondenceMap;
  if (correspondence === undefined) {
    throw new Error(
      `Log-exponent operation ${operation.operation.id} lacks correspondence.`
    );
  }
  return nativeKatex.compose.projectRelations({
    groups: correspondence.records.map(projectRelationGroup)
  });
}

export function createKpLogExponentTransitSession(input: {
  readonly operation: KpCompiledLogExponentOperation;
  readonly nativeKatex: KpNativeKatexFeaturePack;
  readonly sourceEndpoint: KpLogExponentNativeEndpoint;
  readonly targetEndpoint: KpLogExponentNativeEndpoint;
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly operationChoreography?: KpEquationOperationChoreography | undefined;
  readonly symbolMotionContract: KpCompiledSymbolMotionContract;
  readonly horizontalAxisSemanticEntityIds?: readonly string[] | undefined;
}): KpLogExponentTransitSession {
  assertTransitInput(input);
  const canonical = input.nativeKatex.compose.createSession({
    source: input.source,
    target: input.target,
    relations: projectKpLogExponentNativePaintRelations(
      input.operation,
      input.nativeKatex
    ),
    symbolMotionContract: input.symbolMotionContract,
    ...(input.operationChoreography === undefined
      ? {}
      : { operationChoreography: input.operationChoreography }),
    ...(input.horizontalAxisSemanticEntityIds === undefined
      ? {}
      : {
          horizontalAxisSemanticEntityIds:
            input.horizontalAxisSemanticEntityIds
        }),
    ...optionalTrackProjection(input.operation)
  });
  const sourceEntityByAtomId = new Map(input.source.atoms.map((atom) => [
    atom.id,
    atom.semanticEntityId
  ]));
  const targetEntityByAtomId = new Map(input.target.atoms.map((atom) => [
    atom.id,
    atom.semanticEntityId
  ]));
  input.source.stage.dataset["kpLogExponentSymbolMotionTracks"] =
    JSON.stringify(canonical.session.tracks.flatMap((track) =>
      track.semanticContinuantId === undefined
        ? []
        : [{
            trackId: track.id,
            continuantId: track.semanticContinuantId,
            motionUnitId: track.semanticMotionUnitId,
            metricTransition: track.semanticMetricTransition,
            sourceEntityId: sourceEntityByAtomId.get(
              track.sourceAtomId ?? ""
            ),
            targetEntityId: targetEntityByAtomId.get(
              track.targetAtomId ?? ""
            )
          }]
    ));
  let retired = false;

  return Object.freeze({
    kind: "kp-log-exponent-transit-session" as const,
    lifecycle: "renderer-session" as const,
    operationId: input.operation.operation.id,
    sourceStateId: input.sourceEndpoint.stateId,
    targetStateId: input.targetEndpoint.stateId,
    canonical,
    apply(application: KpLogExponentTransitApplication) {
      if (retired) {
        throw new Error("Cannot apply a retired log-exponent transit session.");
      }
      const requested = bounded(application.progress);
      const semanticProgress = application.direction === "forward"
        ? requested
        : 1 - requested;
      const playbackProgress = application.reducedMotion === true
        ? (semanticProgress >= 0.5 ? 1 : 0)
        : semanticProgress;
      const ownership = canonical.session.apply(playbackProgress);
      assertExclusiveKpLogExponentTransitOwnership(ownership);
      input.source.stage.dataset["kpLogExponentOperationId"] =
        input.operation.operation.id;
      input.source.stage.dataset["kpLogExponentSemanticProgress"] =
        String(playbackProgress);
      input.source.stage.dataset["kpLogExponentVisualOwner"] =
        ownership.visualOwner;
      if (input.operationChoreography !== undefined) {
        const synchronizedTrackIds = new Set(canonical.session.tracks
          .filter(({ timingGroupId }) =>
            timingGroupId === input.operationChoreography?.id
          )
          .map(({ id }) => id));
        input.source.stage.dataset["kpLogExponentSynchronizedOpacities"] =
          JSON.stringify(ownership.frames
            .filter(({ trackId }) => synchronizedTrackIds.has(trackId))
            .map(({ opacity }) => opacity));
      } else {
        delete input.source.stage.dataset["kpLogExponentSynchronizedOpacities"];
      }
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

function optionalTrackProjection(
  operation: KpCompiledLogExponentOperation
): Readonly<{
  trackProjection?: ReturnType<typeof createKpLogExponentTrackProjection>;
}> {
  const trackProjection = createKpLogExponentTrackProjection(operation);
  return trackProjection === undefined ? {} : { trackProjection };
}

export function assertExclusiveKpLogExponentTransitOwnership(
  ownership: KpNativeKatexSceneOwnershipFrame
): void {
  const visibleOwners = [
    ownership.sourceNativeOpacity,
    ownership.materialSceneOpacity,
    ownership.targetNativeOpacity
  ].filter((opacity) => opacity === 1).length;
  if (visibleOwners !== 1) {
    throw new Error(
      "Log-exponent transit requires exactly one visible paint owner."
    );
  }
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
      `Log-exponent owner ${ownership.visualOwner} disagrees with native paint opacity.`
    );
  }
}

function assertTransitInput(input: {
  readonly operation: KpCompiledLogExponentOperation;
  readonly sourceEndpoint: KpLogExponentNativeEndpoint;
  readonly targetEndpoint: KpLogExponentNativeEndpoint;
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly operationChoreography?: KpEquationOperationChoreography | undefined;
  readonly symbolMotionContract: KpCompiledSymbolMotionContract;
  readonly horizontalAxisSemanticEntityIds?: readonly string[] | undefined;
}): void {
  if (!isKpCompiledLogExponentOperation(input.operation)) {
    throw new Error(
      "Log-exponent transit requires a nominal compiled operation."
    );
  }
  if (
    input.symbolMotionContract.transformationId !==
      input.operation.transformation.id
  ) {
    throw new Error(
      `Log-exponent transit ${input.operation.operation.id} lacks matching symbol-motion authority.`
    );
  }
  if (
    input.operation.operation.sourceStateId !== input.sourceEndpoint.stateId ||
    input.operation.operation.targetStateId !== input.targetEndpoint.stateId
  ) {
    throw new Error(
      `Log-exponent transit ${input.operation.operation.id} has crossed endpoints.`
    );
  }
  if (
    input.source.endpoint !== "source" ||
    input.target.endpoint !== "target"
  ) {
    throw new Error(
      `Log-exponent transit ${input.operation.operation.id} has invalid native roles.`
    );
  }
  if (
    input.source.stage !== input.target.stage ||
    input.source.root.dataset["kpSemanticEntityId"] !==
      input.sourceEndpoint.stateId ||
    input.target.root.dataset["kpSemanticEntityId"] !==
      input.targetEndpoint.stateId
  ) {
    throw new Error(
      `Log-exponent transit ${input.operation.operation.id} lacks one shared measured stage.`
    );
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
    case "fan-in":
    case "fan-out":
    case "cancelation":
    case "artifact":
    case "focus":
      throw new Error(
        `Canonical log-exponent transit does not admit ${record.relation}.`
      );
  }
}

function bounded(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Log-exponent transit progress must be finite.");
  }
  return Math.max(0, Math.min(1, value));
}
