import {
  certifyKpPlaceValueSemanticFoundation,
  isKpVerifiedPlaceValueSemanticFoundation,
  type KpVerifiedPlaceValueSemanticFoundation
} from "../architecture/place-value-addition-semantic-foundation.ts";
import {
  compileKpPlaceValueWrittenColumnProjection,
  isKpPlaceValueWrittenColumnProjection,
  type KpPlaceValueWrittenColumnProjection
} from "../reader/compiler/place-value-addition-written-column-projection.ts";
import {
  kpPlaceValueAdditionVisualReference as reference
} from "../reader/compiler/place-value-addition-visual-reference.ts";
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
  readonly destination: KpSemanticDestination<"native-endpoint">;
  readonly route: KpMeasuredRouteIntent;
  readonly transit: KpTransitOwnership;
  readonly handoff: KpEndpointHandoff;
}

export interface KpPlaceValuePersistentWorkspacePlan {
  readonly schemaVersion:
    "kp.place-value-addition-persistent-workspace.v1";
  readonly animationId: string;
  readonly traceId: string;
  readonly implementationScope: "ones-cycle-only";
  readonly generalizationGate: "human-ones-checkpoint";
  readonly nativeEntityIds: readonly string[];
  readonly beatIds: readonly string[];
  readonly regions: readonly KpPersistentWorkspaceRegion[];
  readonly lifetimes: readonly KpPersistentEntityLifetime[];
  readonly onesOperation: {
    readonly evaluationBeatId: "beat.place-value.evaluate-ones";
    readonly exchangeBeatId: "beat.place-value.exchange-ones";
    readonly totalDestination:
      KpSemanticDestination<"operation-destination">;
    readonly contributionRoutes: readonly [
      KpMeasuredRouteIntent,
      KpMeasuredRouteIntent
    ];
    readonly result: KpPlaceValuePersistentOutputPlan;
    readonly carry: KpPlaceValuePersistentOutputPlan;
  };
  readonly [kpPlaceValuePersistentWorkspaceBrand]: true;
}

export interface KpPlaceValuePersistentWorkspaceConformance {
  readonly plan: KpPlaceValuePersistentWorkspacePlan;
  readonly traceId: string;
  readonly implementationScope: "ones-cycle-only";
  readonly documentaryPolicy: "same-connected-node-full-timeline";
  readonly routePolicy: "measured-no-teleport";
  readonly ownershipPolicy: "one-visible-owner";
  readonly [kpPlaceValuePersistentWorkspaceConformanceBrand]: true;
}

export function compileKpPlaceValuePersistentWorkspacePlan(input: {
  readonly foundation?: KpVerifiedPlaceValueSemanticFoundation;
  readonly projection?: KpPlaceValueWrittenColumnProjection;
} = {}): KpPlaceValuePersistentWorkspacePlan {
  const foundation =
    input.foundation ?? certifyKpPlaceValueSemanticFoundation();
  const projection =
    input.projection ??
    compileKpPlaceValueWrittenColumnProjection(foundation);
  if (
    !isKpVerifiedPlaceValueSemanticFoundation(foundation) ||
    !isKpPlaceValueWrittenColumnProjection(projection) ||
    foundation.animationId !== projection.animationId ||
    foundation.trace.id !== projection.traceId
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
    semanticRole: "evaluated-column-total"
  });
  const transitRegion = defineKpPersistentWorkspaceRegion({
    id: "region.place-value.carry-transit",
    kind: "transit",
    semanticRole: "adjacent-column-carry-route"
  });
  const documentaryIds = new Set<string>([
    ...reference.primaryStage.initialCells.map(({ id }) => id),
    reference.primaryStage.underline.id
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

  const totalDestination = defineKpSemanticDestination({
    id: "destination.place-value.ones.total",
    semanticEntityId: "evaluation.ones.total",
    region: resultBand
  });
  const contributionRoute = (
    materialEntityId: "digit.first.ones" | "digit.second.ones"
  ): KpMeasuredRouteIntent => defineKpMeasuredRouteIntent({
    id: `route.place-value.ones.contribution.${materialEntityId}`,
    kind: "converge",
    materialEntityId,
    fromRegion: documentaryRegion,
    to: totalDestination
  });
  const outputPlan = (
    entityId: "result.ones" | "carry.tens",
    materialEntityId:
      | "evaluation.ones.total.ones"
      | "evaluation.ones.total.tens",
    kind: "converge" | "carry-arch"
  ): KpPlaceValuePersistentOutputPlan => {
    const region = endpointRegions.get(entityId);
    const endpointLifetime = lifetimes.find(
      (lifetime) =>
        lifetime.kind === "native-endpoint" &&
        lifetime.entityId === entityId
    );
    if (
      region === undefined ||
      endpointLifetime === undefined ||
      endpointLifetime.kind !== "native-endpoint"
    ) {
      throw new Error(`Missing persistent endpoint ${entityId}.`);
    }
    const destination = defineKpSemanticDestination({
      id: `destination.place-value.${entityId}`,
      semanticEntityId: entityId,
      region
    });
    const route = defineKpMeasuredRouteIntent({
      id: `route.place-value.ones.${entityId}`,
      kind,
      materialEntityId,
      fromRegion: resultBand,
      to: destination
    });
    const transit = defineKpTransitOwnership({
      materialEntityId,
      route
    });
    return Object.freeze({
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

  const plan = Object.freeze({
    schemaVersion:
      "kp.place-value-addition-persistent-workspace.v1" as const,
    animationId: foundation.animationId,
    traceId: foundation.trace.id,
    implementationScope: "ones-cycle-only" as const,
    generalizationGate: "human-ones-checkpoint" as const,
    nativeEntityIds,
    beatIds: Object.freeze(reference.beats.map(({ id }) => id)),
    regions: Object.freeze([
      documentaryRegion,
      resultBand,
      transitRegion,
      ...endpointRegions.values()
    ]),
    lifetimes: Object.freeze(lifetimes),
    onesOperation: Object.freeze({
      evaluationBeatId: "beat.place-value.evaluate-ones" as const,
      exchangeBeatId: "beat.place-value.exchange-ones" as const,
      totalDestination,
      contributionRoutes: Object.freeze([
        contributionRoute("digit.first.ones"),
        contributionRoute("digit.second.ones")
      ] as const),
      result: outputPlan(
        "result.ones",
        "evaluation.ones.total.ones",
        "converge"
      ),
      carry: outputPlan(
        "carry.tens",
        "evaluation.ones.total.tens",
        "carry-arch"
      )
    })
  });
  sealedPlans.add(plan);
  return plan as unknown as KpPlaceValuePersistentWorkspacePlan;
}

export function isKpPlaceValuePersistentWorkspacePlan(
  value: unknown
): value is KpPlaceValuePersistentWorkspacePlan {
  return typeof value === "object" &&
    value !== null &&
    sealedPlans.has(value);
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
  const outputs = [
    plan.onesOperation.result,
    plan.onesOperation.carry
  ];
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
    documentaryLifetimes.some(
      (lifetime) =>
        lifetime.initialVisibility !== "visible" ||
        (
          lifetime.consumptionPolicy !== "monotone-dim-never-hide" &&
          lifetime.consumptionPolicy !== "remain-opaque"
        )
    ) ||
    plan.onesOperation.contributionRoutes.some(
      (route) =>
        route.to !== plan.onesOperation.totalDestination ||
        route.kind !== "converge" ||
        route.authoredGeometry !== false
    ) ||
    outputs.some(
      ({ destination, route, transit, handoff }) =>
        route.to !== destination ||
        route.authoredGeometry !== false ||
        transit.route !== route ||
        transit.paintPolicy !== "visible-and-opaque-through-route" ||
        transit.releasePolicy !== "only-after-native-endpoint-match" ||
        handoff.transit !== transit ||
        handoff.endpoint !== destination ||
        handoff.ownershipPolicy !== "exclusive-at-native-match" ||
        handoff.opacityPolicy !== "opaque"
    ) ||
    plan.onesOperation.result.destination.semanticEntityId !== "result.ones" ||
    plan.onesOperation.carry.destination.semanticEntityId !== "carry.tens" ||
    plan.onesOperation.carry.route.kind !== "carry-arch" ||
    plan.onesOperation.result.transit.materialEntityId ===
      plan.onesOperation.carry.transit.materialEntityId
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
  return certificate as unknown as
    KpPlaceValuePersistentWorkspaceConformance;
}

export function isKpPlaceValuePersistentWorkspaceConformance(
  value: unknown
): value is KpPlaceValuePersistentWorkspaceConformance {
  return typeof value === "object" &&
    value !== null &&
    sealedConformance.has(value);
}
