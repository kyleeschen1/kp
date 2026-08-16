import {
  createKpCanonicalNativeKatexSceneSession,
  projectKpNativeKatexSemanticPaintRelations,
  type KpCanonicalNativeKatexSceneSession,
  type KpNativeKatexSceneOwnershipFrame,
  type KpNativeKatexSemanticPaintRelation
} from "./native-katex-scene-compositor.ts";
import {
  createKpNativeKatexSemanticMotionTrackProjection,
  type KpNativeKatexSemanticRouteRegistry,
  type KpNativeKatexSemanticMotionProjectionPolicy
} from "./native-katex-semantic-motion-track-projection.ts";
import type {
  KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";
import type {
  KpLogProductNativeEndpoint
} from "./log-product-native-endpoints.ts";
import {
  isKpCompiledSemanticMotionChoreography,
  type KpCompiledSemanticMotionChoreography
} from "../domain-ir/public-api.ts";
import {
  isKpCompiledLogProductOperation,
  kpCanonicalCompiledLogProductOperation,
  type KpCompiledLogProductOperation
} from "../semantic/log-product-transformation-compiler.ts";

const LOG_PRODUCT_ARGUMENT_CLEARANCE_IN_INK_HEIGHTS = 0.75;
function fissionRoute<Route extends {
  readonly variant: "direct" | "arc-above" | "arc-below";
  readonly clearanceInInkHeights?: number;
  readonly emergence?: "branch-from-source";
}>(route: Route, contactGroupId: string): Readonly<Route & {
  readonly intentionalContactGroupId: string;
}> {
  return Object.freeze({
    ...route,
    intentionalContactGroupId: contactGroupId
  });
}

/**
 * Product expansion has a semantic dependency cycle in the source setting:
 * the arguments are enclosed by shells beside the operator, yet all three
 * groups must survive into two target applications. The family adapter owns
 * how those named correspondences clear one another; the generic compositor
 * remains unaware of logarithms and receives only typed route policy.
 */
export function createKpLogProductSemanticMotionProjectionPolicy(
  operation: KpCompiledLogProductOperation
): KpLogProductSemanticMotionProjectionPolicy {
  if (!isKpCompiledLogProductOperation(operation)) {
    throw new Error("Log-product route policy requires nominal compiler authority.");
  }
  const contactGroupId =
    `contact.log-product.${operation.contract.family.id}.application-fission`;
  const routeByCorrespondenceRecordId: Record<string, ReturnType<typeof fissionRoute>> = {
    "correspondence.log-product.operator-fission": fissionRoute({
      variant: "direct" as const
    }, contactGroupId)
  };
  const routeByTargetEntityId: Record<string, ReturnType<typeof fissionRoute>> = {};
  const factors = operation.contract.family.factors;
  factors.forEach((factor, index) => {
    const argumentVariant = index === 0
      ? "arc-below" as const
      : index === factors.length - 1
        ? "arc-above" as const
        : "direct" as const;
    routeByCorrespondenceRecordId[
      `correspondence.log-product.${factor.name}-argument-continuity`
    ] = fissionRoute({
      variant: argumentVariant,
      ...(argumentVariant === "direct"
        ? {}
        : { clearanceInInkHeights: LOG_PRODUCT_ARGUMENT_CLEARANCE_IN_INK_HEIGHTS })
    }, contactGroupId);
    // Every target shell/operator is a derived successor. All branch tracks
    // begin overlapped at the source and separate together; withholding paint
    // from any one branch would either privilege a false continuant or make
    // the source wrapper disappear before its successors become legible.
    for (const suffix of ["operator", "open", "close"] as const) {
      routeByTargetEntityId[
        `${factor.targetWrapperOccurrenceId}.${suffix}`
      ] = fissionRoute({
        variant: "direct" as const
      }, contactGroupId);
    }
  });
  return Object.freeze({
    routeByCorrespondenceRecordId: Object.freeze(routeByCorrespondenceRecordId),
    routeByTargetEntityId: Object.freeze(routeByTargetEntityId)
  });
}

export type KpLogProductSemanticMotionProjectionPolicy = Readonly<{
  routeByCorrespondenceRecordId: KpNativeKatexSemanticRouteRegistry;
  routeByTargetEntityId: KpNativeKatexSemanticRouteRegistry;
}> & KpNativeKatexSemanticMotionProjectionPolicy;

export const kpLogProductSemanticMotionProjectionPolicy =
  createKpLogProductSemanticMotionProjectionPolicy(
    // Kept as the binary exemplar alias for callers that inspect policy.
    // Runtime sessions derive their policy from the selected operation.
    kpCanonicalCompiledLogProductOperation
  );

export interface KpLogProductTransitSession {
  readonly kind: "kp-log-product-transit-session";
  readonly lifecycle: "renderer-session";
  readonly transformationId: string;
  readonly semanticMotionChoreographyId: string;
  readonly canonical: KpCanonicalNativeKatexSceneSession;
  readonly apply: (progress: number) => KpNativeKatexSceneOwnershipFrame;
  readonly retire: () => void;
}

export function projectKpLogProductNativePaintRelations(
  operation: KpCompiledLogProductOperation
): readonly KpNativeKatexSemanticPaintRelation[] {
  if (!isKpCompiledLogProductOperation(operation)) {
    throw new Error("Log-product paint relations require nominal compiler authority.");
  }
  const records = operation.transformation.correspondenceMap?.records;
  if (records === undefined) {
    throw new Error("Log-product paint relations require correspondence.");
  }
  return projectKpNativeKatexSemanticPaintRelations({
    // Application and additive containers own meaning, not glyph paint. The
    // unmatched plus glyph remains a native introduction governed by the same
    // product-derivation correspondence in the semantic track projection.
    groups: records
      .filter(({ id }) =>
        id !== "correspondence.log-product.application-fission" &&
        id !== "correspondence.log-product.product-derives-sum"
      )
      .map((record) => Object.freeze({
        id: record.id,
        kind: record.relation === "fan-out"
          ? "one-to-many" as const
          : "one-to-one" as const,
        sourceEntityIds: record.sourceSelectorIds,
        targetEntityIds: record.targetSelectorIds
      }))
  });
}

export function createKpLogProductTransitSession(input: {
  readonly operation: KpCompiledLogProductOperation;
  readonly semanticMotion: KpCompiledSemanticMotionChoreography;
  readonly sourceEndpoint: KpLogProductNativeEndpoint;
  readonly targetEndpoint: KpLogProductNativeEndpoint;
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}): KpLogProductTransitSession {
  assertTransitInput(input);
  const canonical = createKpCanonicalNativeKatexSceneSession({
    source: input.source,
    target: input.target,
    relations: projectKpLogProductNativePaintRelations(input.operation),
    copyFanOutRouting: false,
    endpointDwellFraction: 0,
    trackProjection: createKpNativeKatexSemanticMotionTrackProjection(
      input.semanticMotion,
      createKpLogProductSemanticMotionProjectionPolicy(input.operation)
    )
  });
  let retired = false;
  return Object.freeze({
    kind: "kp-log-product-transit-session" as const,
    lifecycle: "renderer-session" as const,
    transformationId: input.operation.transformation.id,
    semanticMotionChoreographyId: input.semanticMotion.id,
    canonical,
    apply(progress: number) {
      if (retired) {
        throw new Error("Cannot apply a retired log-product transit session.");
      }
      return canonical.session.apply(bounded(progress));
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

function assertTransitInput(input: {
  readonly operation: KpCompiledLogProductOperation;
  readonly semanticMotion: KpCompiledSemanticMotionChoreography;
  readonly sourceEndpoint: KpLogProductNativeEndpoint;
  readonly targetEndpoint: KpLogProductNativeEndpoint;
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}): void {
  if (!isKpCompiledLogProductOperation(input.operation)) {
    throw new Error("Log-product transit requires nominal compiler authority.");
  }
  if (
    !isKpCompiledSemanticMotionChoreography(input.semanticMotion) ||
    input.semanticMotion.recipeId !==
      "recipe.semantic-motion.log-product-fission.v1" ||
    input.semanticMotion.compilation.transformationId !==
      input.operation.transformation.id
  ) {
    throw new Error(
      "Log-product transit requires matching semantic-motion compiler authority."
    );
  }
  if (
    input.operation.contract.source.id !== input.sourceEndpoint.stateId ||
    input.operation.contract.target.id !== input.targetEndpoint.stateId ||
    input.source.endpoint !== "source" ||
    input.target.endpoint !== "target" ||
    input.source.stage !== input.target.stage
  ) {
    throw new Error("Log-product transit has crossed endpoint or stage authority.");
  }
}

function bounded(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Log-product transit progress must be finite.");
  }
  return Math.max(0, Math.min(1, value));
}
