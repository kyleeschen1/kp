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
import {
  createKpNativeKatexTrackProjection,
  type KpNativeKatexTrackProjection
} from "./native-katex-track-projection.ts";
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
  compileKpFunctionWrapInvocationGroup,
  createKpFunctionWrapInvocationGroupReception,
  type KpCompiledFunctionWrapInvocationGroup
} from "../animation/function-wrap-invocation.ts";
import {
  compileKpBinaryLogProductHomomorphicHandoff
} from "../animation/log-product-homomorphic-handoff.ts";
import {
  applyKpNativeKatexFunctionWrapReception,
  type KpNativeKatexHorizontalSqueezeTreatment
} from "./native-katex-function-wrap-reception.ts";
import {
  applyKpNativeKatexLogProductHomomorphicHandoff
} from "./native-katex-log-product-homomorphic-handoff.ts";
import {
  isKpCompiledLogProductOperation,
  kpCanonicalCompiledLogProductOperation,
  type KpCompiledLogProductOperation
} from "../semantic/log-product-transformation-compiler.ts";

const LOG_PRODUCT_ARGUMENT_CLEARANCE_IN_INK_HEIGHTS = 0.75;
const BINARY_VISUAL_DISCOVERY_FAMILY_ID = "family.log-product.xy";
const BINARY_CLOSURE_COUPLED_SQUEEZE = Object.freeze({
  outwardOffsetInNativeHeights: 0.46
}) satisfies KpNativeKatexHorizontalSqueezeTreatment;
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
 * the persistent arguments are enclosed by one application that derives
 * several successor applications. The family adapter owns how those named
 * correspondences clear one another; the generic compositor remains unaware
 * of logarithms and receives only typed route policy.
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
    // The binary exemplar has a clear same-baseline corridor, so curvature
    // would imply a structural detour that the operation does not contain.
    const directBinaryTransit =
      operation.contract.family.id === BINARY_VISUAL_DISCOVERY_FAMILY_ID;
    const argumentVariant = directBinaryTransit
      ? "direct" as const
      : index === 0
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

export function compileKpLogProductFunctionWrapInvocationGroup(
  operation: KpCompiledLogProductOperation
): KpCompiledFunctionWrapInvocationGroup {
  if (!isKpCompiledLogProductOperation(operation)) {
    throw new Error("Log-product function wrapping requires nominal compiler authority.");
  }
  return compileKpFunctionWrapInvocationGroup({
    id: `${operation.contract.family.id}.targets`,
    branches: operation.contract.family.factors.map((factor) => ({
      id: `function-wrap-branch.${factor.targetWrapperOccurrenceId}`,
      semanticObjectId: factor.semanticId,
      sourceArgumentEntityIds: [factor.sourceOccurrenceId],
      targetArgumentEntityIds: [factor.targetOccurrenceId],
      functionEntityIds: [
        factor.targetWrapperOccurrenceId,
        `${factor.targetWrapperOccurrenceId}.operator`
      ],
      enclosureEntityRoles: [
        {
          entityId: `${factor.targetWrapperOccurrenceId}.open`,
          side: "leading" as const
        },
        {
          entityId: `${factor.targetWrapperOccurrenceId}.close`,
          side: "trailing" as const
        }
      ]
    }))
  });
}

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
  const visuallyWithdrawSourceApplication =
    operation.contract.family.id === BINARY_VISUAL_DISCOVERY_FAMILY_ID;
  return projectKpNativeKatexSemanticPaintRelations({
    // Application and additive containers own meaning, not glyph paint. In
    // the binary discovery the source shell withdraws and its typed successor
    // glyphs are introduced at their targets; their semantic derivation stays
    // in the compiler rather than being misread as copied paint.
    groups: records
      .filter(({ id }) =>
        id !== "correspondence.log-product.application-fission" &&
        id !== "correspondence.log-product.product-derives-sum" &&
        (!visuallyWithdrawSourceApplication || ![
          "correspondence.log-product.operator-fission",
          "correspondence.log-product.open-shell-fission",
          "correspondence.log-product.close-shell-fission"
        ].includes(id))
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
    trackProjection: createKpLogProductVisualDiscoveryTrackProjection(input)
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

function createKpLogProductVisualDiscoveryTrackProjection(input: {
  readonly operation: KpCompiledLogProductOperation;
  readonly semanticMotion: KpCompiledSemanticMotionChoreography;
  readonly sourceEndpoint: KpLogProductNativeEndpoint;
  readonly targetEndpoint: KpLogProductNativeEndpoint;
}): KpNativeKatexTrackProjection {
  const semanticProjection = createKpNativeKatexSemanticMotionTrackProjection(
    input.semanticMotion,
    createKpLogProductSemanticMotionProjectionPolicy(input.operation)
  );
  if (input.operation.contract.family.id !== BINARY_VISUAL_DISCOVERY_FAMILY_ID) {
    return semanticProjection;
  }
  const functionWrapReception = createKpFunctionWrapInvocationGroupReception({
    group: compileKpLogProductFunctionWrapInvocationGroup(input.operation),
    direction: "forward"
  });
  const homomorphicHandoff = compileKpBinaryLogProductHomomorphicHandoff(
    input.operation
  );
  return createKpNativeKatexTrackProjection({
    id: `track-projection.log-product.binary-visual-discovery.${input.semanticMotion.id}`,
    project(projectionInput) {
      const semanticTracks = semanticProjection.project(projectionInput);
      const handoffTracks = applyKpNativeKatexLogProductHomomorphicHandoff({
        tracks: semanticTracks,
        source: projectionInput.source,
        target: projectionInput.target,
        plan: homomorphicHandoff
      });
      return applyKpNativeKatexFunctionWrapReception({
        tracks: handoffTracks,
        source: projectionInput.source,
        target: projectionInput.target,
        plan: functionWrapReception,
        entryWindow: homomorphicHandoff.enclosureHandoff.transitWindow,
        presenceWindow:
          homomorphicHandoff.enclosureHandoff.targetPresenceWindow,
        motion: "horizontal-squeeze",
        horizontalSqueezeTreatment: BINARY_CLOSURE_COUPLED_SQUEEZE
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
