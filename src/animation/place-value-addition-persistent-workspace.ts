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

const sealedPlans = new WeakSet<object>();

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
): string {
  if (!isKpPlaceValuePersistentWorkspacePlan(plan)) {
    throw new Error("Cannot bind a copied persistent workspace plan.");
  }
  return plan.traceId;
}
