import {
  projectKpNativeKatexSemanticPaintRelations,
  type KpNativeKatexSemanticPaintRelation
} from "./native-katex-base-scene-plan.ts";
import {
  createKpNativeKatexEndpointOwnershipView,
  type KpNativeKatexEndpointOwnershipView
} from "./native-katex-endpoint-ownership.ts";
import type {
  KpNativeKatexRenderedEndpointHandle,
  KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";
import {
  kpCanonicalFiniteProductNativeEndpoints,
  type KpFiniteProductNativeEndpoint
} from "./finite-product-native-endpoints.ts";
import { kpCanonicalFiniteProductExpansionOperation } from
  "../semantic/canonical-finite-product-expansion.ts";

export interface KpFiniteProductNativePaintOwnership {
  readonly kind: "finite-product-native-paint-ownership";
  readonly lifecycle: "renderer-session-ephemeral";
  readonly source: KpNativeKatexEndpointOwnershipView;
  readonly target: KpNativeKatexEndpointOwnershipView;
  readonly relations: readonly KpNativeKatexSemanticPaintRelation[];
  readonly toJSON: () => never;
}

export function createKpFiniteProductNativePaintOwnership(input: {
  readonly sourceHandle: KpNativeKatexRenderedEndpointHandle;
  readonly targetHandle: KpNativeKatexRenderedEndpointHandle;
}): KpFiniteProductNativePaintOwnership {
  const [sourceEndpoint, targetEndpoint] =
    kpCanonicalFiniteProductNativeEndpoints;
  assertExactPaint(sourceEndpoint, input.sourceHandle.observation);
  assertExactPaint(targetEndpoint, input.targetHandle.observation);
  if (input.sourceHandle.revision.fontRevision !==
      input.targetHandle.revision.fontRevision) {
    throw new Error(
      "Finite-product endpoints must share one settled font revision."
    );
  }
  const source = createKpNativeKatexEndpointOwnershipView({
    handle: input.sourceHandle,
    endpoint: "source"
  });
  const target = createKpNativeKatexEndpointOwnershipView({
    handle: input.targetHandle,
    endpoint: "target"
  });
  const operation = kpCanonicalFiniteProductExpansionOperation;
  return Object.freeze({
    kind: "finite-product-native-paint-ownership" as const,
    lifecycle: "renderer-session-ephemeral" as const,
    source,
    target,
    relations: projectKpNativeKatexSemanticPaintRelations({
      groups: [{
        id: "finite-product.body-template-instantiates",
        kind: "one-to-many",
        sourceEntityIds: [operation.source.semantic.body.id],
        targetEntityIds: operation.target.instances.map(({ id }) => id)
      }]
    }),
    toJSON(): never {
      throw new Error(
        "Finite-product Native KaTeX paint ownership cannot enter durable state."
      );
    }
  });
}

function assertExactPaint(
  endpoint: KpFiniteProductNativeEndpoint,
  observation: KpNativeKatexRenderedSceneObservation
): void {
  if (observation.endpoint !== endpoint.endpoint) {
    throw new Error(
      `Finite-product ${endpoint.endpoint} handle has the wrong endpoint role.`
    );
  }
  const expectedIds = new Set<string>(endpoint.nodes.map(({ occurrenceId }) =>
    occurrenceId
  ));
  const groups = new Map(observation.groups.map((group) => [group.id, group]));
  for (const node of endpoint.nodes) {
    const group = groups.get(node.presentationGroupId);
    const atoms = observation.atoms.filter(({ semanticEntityId }) =>
      semanticEntityId === node.occurrenceId
    );
    if (group === undefined || group.atomIds.length === 0 ||
        atoms.length === 0 ||
        atoms.some(({ presentationGroupId }) =>
          presentationGroupId !== node.presentationGroupId
        )) {
      throw new Error(
        `Finite-product role ${node.occurrenceId} lacks exact native paint.`
      );
    }
  }
  const unowned = observation.atoms.find(({ semanticEntityId }) =>
    !expectedIds.has(semanticEntityId)
  );
  if (unowned !== undefined) {
    throw new Error(
      `Finite-product paint atom ${unowned.id} has no declared role.`
    );
  }
}
