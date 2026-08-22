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
  kpCanonicalFiniteSumNativeEndpoints,
  type KpFiniteSumNativeEndpoint
} from "./finite-sum-native-endpoints.ts";
import {
  kpCanonicalFiniteSumExpansionOperation
} from "../semantic/canonical-finite-sum-expansion.ts";

export interface KpFiniteSumNativePaintOwnership {
  readonly kind: "finite-sum-native-paint-ownership";
  readonly lifecycle: "renderer-session-ephemeral";
  readonly source: KpNativeKatexEndpointOwnershipView;
  readonly target: KpNativeKatexEndpointOwnershipView;
  readonly relations: readonly KpNativeKatexSemanticPaintRelation[];
  readonly toJSON: () => never;
}

/**
 * Compiles only cached, settled endpoint evidence. Geometry is never read or
 * corrected here: a stale or malformed Native KaTeX capture must be replaced
 * before the animation session begins.
 */
export function createKpFiniteSumNativePaintOwnership(input: {
  readonly sourceHandle: KpNativeKatexRenderedEndpointHandle;
  readonly targetHandle: KpNativeKatexRenderedEndpointHandle;
  readonly sourceEndpoint?: KpFiniteSumNativeEndpoint | undefined;
  readonly targetEndpoint?: KpFiniteSumNativeEndpoint | undefined;
}): KpFiniteSumNativePaintOwnership {
  const sourceEndpoint = input.sourceEndpoint ??
    kpCanonicalFiniteSumNativeEndpoints[0];
  const targetEndpoint = input.targetEndpoint ??
    kpCanonicalFiniteSumNativeEndpoints[1];
  if (sourceEndpoint.endpoint !== "source" ||
      targetEndpoint.endpoint !== "target") {
    throw new Error(
      "Finite-sum paint ownership requires source and target endpoint roles."
    );
  }
  assertExactPaint(sourceEndpoint, input.sourceHandle.observation);
  assertExactPaint(targetEndpoint, input.targetHandle.observation);
  if (input.sourceHandle.revision.fontRevision !==
      input.targetHandle.revision.fontRevision) {
    throw new Error(
      "Finite-sum endpoints must share one settled font revision."
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
  const operation = kpCanonicalFiniteSumExpansionOperation;
  const firstReference = operation.target.instances[0]!.references[0]!;
  const lastReference = operation.target.instances.at(-1)!.references[0]!;
  const relations = projectKpNativeKatexSemanticPaintRelations({
    groups: [
      {
        id: "finite-binder.body-template-instantiates",
        kind: "one-to-many",
        sourceEntityIds: [operation.source.semantic.body.id],
        targetEntityIds: operation.target.instances.map(({ id }) => id)
      },
      {
        id: "finite-binder.lower-bound-materializes-reference",
        kind: "one-to-one",
        sourceEntityIds: [operation.source.semantic.lowerBound.id],
        targetEntityIds: [firstReference.id]
      },
      {
        id: "finite-binder.upper-bound-materializes-reference",
        kind: "one-to-one",
        sourceEntityIds: [operation.source.semantic.upperBound.id],
        targetEntityIds: [lastReference.id]
      }
    ]
  });
  return Object.freeze({
    kind: "finite-sum-native-paint-ownership" as const,
    lifecycle: "renderer-session-ephemeral" as const,
    source,
    target,
    relations,
    toJSON(): never {
      throw new Error(
        "Finite-sum Native KaTeX paint ownership cannot enter durable state."
      );
    }
  });
}

function assertExactPaint(
  endpoint: KpFiniteSumNativeEndpoint,
  observation: KpNativeKatexRenderedSceneObservation
): void {
  if (observation.endpoint !== endpoint.endpoint) {
    throw new Error(
      `Finite-sum ${endpoint.endpoint} handle has the wrong endpoint role.`
    );
  }
  const expectedIds = new Set<string>(endpoint.nodes.map(({ occurrenceId }) =>
    occurrenceId
  ));
  const groupById = new Map(observation.groups.map((group) =>
    [group.id, group]
  ));
  for (const node of endpoint.nodes) {
    const group = groupById.get(node.presentationGroupId);
    if (group === undefined || group.atomIds.length === 0) {
      throw new Error(
        `Finite-sum role ${node.occurrenceId} lacks settled native ink.`
      );
    }
    const ownedAtoms = observation.atoms.filter(({ semanticEntityId }) =>
      semanticEntityId === node.occurrenceId
    );
    if (ownedAtoms.length === 0 ||
        ownedAtoms.some(({ presentationGroupId }) =>
          presentationGroupId !== node.presentationGroupId
        )) {
      throw new Error(
        `Finite-sum role ${node.occurrenceId} lacks exact paint ownership.`
      );
    }
  }
  const unowned = observation.atoms.find(({ semanticEntityId }) =>
    !expectedIds.has(semanticEntityId)
  );
  if (unowned !== undefined) {
    throw new Error(
      `Finite-sum paint atom ${unowned.id} has no declared semantic role.`
    );
  }
}
