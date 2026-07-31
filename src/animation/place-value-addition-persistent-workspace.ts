import {
  certifyKpPlaceValueSemanticFoundation,
  isKpVerifiedPlaceValueSemanticFoundation,
  type KpVerifiedPlaceValueSemanticFoundation
} from "../architecture/place-value-addition-semantic-foundation.ts";
import {
  compileKpPlaceValueAdditionPositionPrograms,
  isKpPlaceValuePositionProgram
} from "../reader/compiler/place-value-addition-position-program.ts";
import type {
  KpExactRadixPosition,
  KpPlaceValuePositionProgram
} from "../reader/compiler/place-value-addition-position-types.ts";
import {
  compileKpPlaceValueWrittenColumnProjection,
  isKpPlaceValueWrittenColumnProjection,
  type KpPlaceValueWrittenColumnProjection
} from "../reader/compiler/place-value-addition-written-column-projection.ts";
import {
  defineKpEndpointHandoff,
  defineKpMeasuredRouteIntent,
  defineKpPersistentDocumentaryLifetime,
  defineKpPersistentNativeEndpointLifetime,
  defineKpPersistentWorkspaceRegion,
  defineKpSemanticDestination,
  defineKpTransitOwnership,
  type KpEndpointHandoff,
  type KpMeasuredRouteIntent,
  type KpPersistentEntityLifetime,
  type KpPersistentWorkspaceRegion,
  type KpSemanticDestination,
  type KpTransitOwnership
} from "./persistent-workspace.ts";

declare const kpPlaceValuePersistentWorkspaceBrand: unique symbol;
declare const kpPlaceValuePersistentWorkspaceConformanceBrand: unique symbol;

const sealedPlans = new WeakSet<object>();
const sealedConformance = new WeakSet<object>();

export interface KpPlaceValuePersistentOutputPlan {
  readonly role:
    | "settled-digit"
    | "carry-to-next-position"
    | "terminal-result-extension";
  readonly destination: KpSemanticDestination<"native-endpoint">;
  readonly route: KpMeasuredRouteIntent;
  readonly transit: KpTransitOwnership;
  readonly handoff: KpEndpointHandoff;
}

export interface KpPlaceValuePersistentPositionOperation {
  readonly position: KpExactRadixPosition;
  readonly evaluationBeatId: string;
  readonly exchangeBeatId?: string | undefined;
  readonly settlementBeatId: string;
  readonly contributorCellIds: readonly string[];
  readonly totalDestination: KpSemanticDestination<"operation-destination">;
  readonly contributionRoutes: readonly KpMeasuredRouteIntent[];
  readonly outputs: readonly KpPlaceValuePersistentOutputPlan[];
}

export interface KpPlaceValuePersistentWorkspacePlan {
  readonly schemaVersion:
    "kp.place-value-addition-persistent-workspace.v2";
  readonly animationId: string;
  readonly traceId: string;
  readonly implementationScope: "ordered-position-sequence";
  readonly generalizationGate: "approved-reference-exemplar";
  readonly nativeEntityIds: readonly string[];
  readonly beatIds: readonly string[];
  readonly regions: readonly KpPersistentWorkspaceRegion[];
  readonly lifetimes: readonly KpPersistentEntityLifetime[];
  readonly operations: readonly KpPlaceValuePersistentPositionOperation[];
  readonly [kpPlaceValuePersistentWorkspaceBrand]: true;
}

export interface KpPlaceValuePersistentWorkspaceConformance {
  readonly plan: KpPlaceValuePersistentWorkspacePlan;
  readonly traceId: string;
  readonly implementationScope: "ordered-position-sequence";
  readonly documentaryPolicy: "same-connected-node-full-timeline";
  readonly routePolicy: "measured-no-teleport";
  readonly ownershipPolicy: "one-visible-owner";
  readonly [kpPlaceValuePersistentWorkspaceConformanceBrand]: true;
}

export function compileKpPlaceValuePersistentWorkspacePlan(input: {
  readonly foundation?: KpVerifiedPlaceValueSemanticFoundation;
  readonly projection?: KpPlaceValueWrittenColumnProjection;
  readonly positionPrograms?: readonly KpPlaceValuePositionProgram[];
  readonly beatIds?: readonly string[];
} = {}): KpPlaceValuePersistentWorkspacePlan {
  const fixtureOverride =
    input.projection !== undefined ||
    input.positionPrograms !== undefined ||
    input.beatIds !== undefined;
  const foundation = input.foundation ?? (
    fixtureOverride ? undefined : certifyKpPlaceValueSemanticFoundation()
  );
  const projection = input.projection ?? (
    foundation === undefined
      ? undefined
      : compileKpPlaceValueWrittenColumnProjection(foundation)
  );
  const positionPrograms = input.positionPrograms ??
    compileKpPlaceValueAdditionPositionPrograms();
  const beatIds = input.beatIds ?? foundation?.trace.beats.map(({ id }) => id);
  if (
    projection === undefined ||
    beatIds === undefined ||
    !isKpPlaceValueWrittenColumnProjection(projection) ||
    !positionPrograms.every(isKpPlaceValuePositionProgram) ||
    (
      foundation !== undefined &&
      (
        !isKpVerifiedPlaceValueSemanticFoundation(foundation) ||
        foundation.animationId !== projection.animationId ||
        foundation.trace.id !== projection.traceId
      )
    ) ||
    beatIds.length === 0
  ) {
    throw new Error(
      "Persistent place-value workspace requires one sealed foundation and matching written projection."
    );
  }

  const documentaryRegion = defineKpPersistentWorkspaceRegion({
    id: "region.place-value.documentary",
    kind: "documentary",
    semanticRole: "written-algorithm-history"
  });
  const resultBand = defineKpPersistentWorkspaceRegion({
    id: "region.place-value.result-band",
    kind: "operation-destination",
    semanticRole: "evaluated-position-total"
  });
  const transitRegion = defineKpPersistentWorkspaceRegion({
    id: "region.place-value.carry-transit",
    kind: "transit",
    semanticRole: "adjacent-position-carry-route"
  });
  const documentaryIds = new Set<string>([
    ...projection.cells
      .filter(({ role }) => role === "addend-digit" || role === "operator")
      .map(({ semanticEntityId }) => semanticEntityId),
    projection.underline.semanticEntityId
  ]);
  const nativeEntityIds = Object.freeze([
    ...projection.cells.map(({ semanticEntityId }) => semanticEntityId),
    projection.underline.semanticEntityId
  ]);
  const lifetimes: KpPersistentEntityLifetime[] = [];
  const endpointRegions = new Map<
    string,
    KpPersistentWorkspaceRegion<"native-endpoint">
  >();
  for (const entityId of nativeEntityIds) {
    if (documentaryIds.has(entityId)) {
      lifetimes.push(defineKpPersistentDocumentaryLifetime({
        entityId,
        region: documentaryRegion,
        consumptionPolicy:
          entityId.startsWith("digit.")
            ? "monotone-dim-never-hide"
            : "remain-opaque"
      }));
      continue;
    }
    const region = defineKpPersistentWorkspaceRegion({
      id: `region.place-value.endpoint.${entityId}`,
      kind: "native-endpoint",
      semanticRole: entityId.startsWith("carry.")
        ? "carry-slot"
        : "result-slot"
    });
    endpointRegions.set(entityId, region);
    lifetimes.push(defineKpPersistentNativeEndpointLifetime({
      entityId,
      region
    }));
  }

  const outputPlan = (input: {
    readonly positionId: string;
    readonly endpointEntityId: string;
    readonly materialEntityId: string;
    readonly role: KpPlaceValuePersistentOutputPlan["role"];
  }): KpPlaceValuePersistentOutputPlan => {
    const region = endpointRegions.get(input.endpointEntityId);
    const endpointLifetime = lifetimes.find((lifetime) =>
      lifetime.kind === "native-endpoint" &&
      lifetime.entityId === input.endpointEntityId
    );
    if (
      region === undefined ||
      endpointLifetime === undefined ||
      endpointLifetime.kind !== "native-endpoint"
    ) {
      throw new Error(
        `Missing persistent endpoint ${input.endpointEntityId}.`
      );
    }
    const destination = defineKpSemanticDestination({
      id: `destination.place-value.${input.endpointEntityId}`,
      semanticEntityId: input.endpointEntityId,
      region
    });
    const route = defineKpMeasuredRouteIntent({
      id: `route.place-value.${input.positionId}.${input.endpointEntityId}`,
      kind: input.role === "settled-digit"
        ? "converge"
        : "carry-arch",
      materialEntityId: input.materialEntityId,
      fromRegion: resultBand,
      to: destination
    });
    const transit = defineKpTransitOwnership({
      materialEntityId: input.materialEntityId,
      route
    });
    return Object.freeze({
      role: input.role,
      destination,
      route,
      transit,
      handoff: defineKpEndpointHandoff({
        transit,
        endpoint: destination,
        endpointLifetime
      })
    });
  };

  const operations = positionPrograms.map(
    (program): KpPlaceValuePersistentPositionOperation => {
      const totalDestination = defineKpSemanticDestination({
        id: `destination.place-value.${program.position.id}.total`,
        semanticEntityId: program.evaluation.evaluatedTotalEntityId,
        region: resultBand
      });
      const contributionRoutes = program.evaluation.contributorCellIds.map(
        (materialEntityId, index) => defineKpMeasuredRouteIntent({
          id:
            `route.place-value.${program.position.id}.contribution-${index}`,
          kind: "converge",
          materialEntityId,
          fromRegion: documentaryRegion,
          to: totalDestination
        })
      ) as unknown as KpPlaceValuePersistentPositionOperation[
        "contributionRoutes"
      ];
      const outputSpecs = program.exchange === undefined
        ? program.terminalOutput?.outputs.map((output) => ({
            endpointEntityId: output.targetCellId,
            materialEntityId: output.materialEntityId,
            role: output.role
          })) ?? []
        : program.exchange.outputCellIds.map((endpointEntityId, index) => {
            const endpointCell = projection.cells.find(
              ({ semanticEntityId }) => semanticEntityId === endpointEntityId
            );
            const materialDigit = program.exchange!.outputDigits.find(
              ({ columnId }) => columnId === endpointCell?.column
            );
            if (endpointCell === undefined || materialDigit === undefined) {
              throw new Error(
                `Position ${program.position.sequenceIndex} cannot bind its persistent output ${endpointEntityId}.`
              );
            }
            return {
              endpointEntityId,
              materialEntityId: materialDigit.semanticEntityId,
              role: index === 0
                ? "settled-digit" as const
                : "carry-to-next-position" as const
            };
          });
      if (outputSpecs.length === 0) {
        throw new Error(
          `Position ${program.position.sequenceIndex} has no persistent output.`
        );
      }
      const outputs = outputSpecs.map((spec) => outputPlan({
        positionId: program.position.id,
        ...spec
      })) as unknown as KpPlaceValuePersistentPositionOperation["outputs"];
      return Object.freeze({
        position: program.position,
        evaluationBeatId: program.evaluation.beatId,
        ...(program.exchange === undefined
          ? {}
          : { exchangeBeatId: program.exchange.beatId }),
        settlementBeatId:
          program.exchange?.beatId ?? program.evaluation.beatId,
        contributorCellIds: program.evaluation.contributorCellIds,
        totalDestination,
        contributionRoutes,
        outputs
      });
    }
  ) as unknown as KpPlaceValuePersistentWorkspacePlan["operations"];

  const plan = Object.freeze({
    schemaVersion:
      "kp.place-value-addition-persistent-workspace.v2" as const,
    animationId: projection.animationId,
    traceId: projection.traceId,
    implementationScope: "ordered-position-sequence" as const,
    generalizationGate: "approved-reference-exemplar" as const,
    nativeEntityIds,
    beatIds: Object.freeze([...beatIds]),
    regions: Object.freeze([
      documentaryRegion,
      resultBand,
      transitRegion,
      ...endpointRegions.values()
    ]),
    lifetimes: Object.freeze(lifetimes),
    operations: Object.freeze(operations)
  });
  sealedPlans.add(plan);
  return plan as unknown as KpPlaceValuePersistentWorkspacePlan;
}

export function isKpPlaceValuePersistentWorkspacePlan(
  value: unknown
): value is KpPlaceValuePersistentWorkspacePlan {
  return typeof value === "object" && value !== null && sealedPlans.has(value);
}

export function bindKpPlaceValuePersistentWorkspacePlan(
  plan: KpPlaceValuePersistentWorkspacePlan
): KpPlaceValuePersistentWorkspaceConformance {
  if (!isKpPlaceValuePersistentWorkspacePlan(plan)) {
    throw new Error("Cannot bind a copied persistent workspace plan.");
  }
  const uniqueEntities = new Set(plan.nativeEntityIds);
  const lifetimeEntities = new Set(
    plan.lifetimes.map(({ entityId }) => entityId)
  );
  const documentaryLifetimes = plan.lifetimes.filter(
    (lifetime) => lifetime.kind === "documentary"
  );
  if (
    uniqueEntities.size !== plan.nativeEntityIds.length ||
    lifetimeEntities.size !== plan.lifetimes.length ||
    plan.nativeEntityIds.some((entityId) => !lifetimeEntities.has(entityId)) ||
    plan.lifetimes.some(
      ({ startPermille, endPermille, nodePolicy, geometryPolicy }) =>
        startPermille !== 0 ||
        endPermille !== 1_000 ||
        nodePolicy !== "same-connected-node" ||
        geometryPolicy !== "stationary"
    ) ||
    documentaryLifetimes.some((lifetime) =>
      lifetime.initialVisibility !== "visible" ||
      (
        lifetime.consumptionPolicy !== "monotone-dim-never-hide" &&
        lifetime.consumptionPolicy !== "remain-opaque"
      )
    ) ||
    plan.operations.some((operation, index) =>
      operation.position.sequenceIndex !== index ||
      operation.contributionRoutes.length !==
        operation.contributorCellIds.length ||
      operation.contributionRoutes.some((route, routeIndex) =>
        route.to !== operation.totalDestination ||
        route.kind !== "converge" ||
        route.authoredGeometry !== false ||
        route.materialEntityId !== operation.contributorCellIds[routeIndex]
      ) ||
      operation.outputs.some(({ destination, route, transit, handoff }) =>
        route.to !== destination ||
        route.authoredGeometry !== false ||
        transit.route !== route ||
        transit.paintPolicy !== "visible-and-opaque-through-route" ||
        transit.releasePolicy !== "only-after-native-endpoint-match" ||
        handoff.transit !== transit ||
        handoff.endpoint !== destination ||
        handoff.ownershipPolicy !== "exclusive-at-native-match" ||
        handoff.opacityPolicy !== "opaque"
      )
    )
  ) {
    throw new Error(
      "Persistent workspace plan violates documentary, route, or ownership conformance."
    );
  }
  const certificate = Object.freeze({
    plan,
    traceId: plan.traceId,
    implementationScope: plan.implementationScope,
    documentaryPolicy: "same-connected-node-full-timeline" as const,
    routePolicy: "measured-no-teleport" as const,
    ownershipPolicy: "one-visible-owner" as const
  });
  sealedConformance.add(certificate);
  return certificate as unknown as KpPlaceValuePersistentWorkspaceConformance;
}

export function isKpPlaceValuePersistentWorkspaceConformance(
  value: unknown
): value is KpPlaceValuePersistentWorkspaceConformance {
  return typeof value === "object" &&
    value !== null &&
    sealedConformance.has(value);
}
