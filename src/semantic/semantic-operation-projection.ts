import { createKpAssetBundle, type KpAssetMetadataValue, type KpSemanticAssetObject } from "./asset.ts";
import type { KpSemanticTransformation } from "./asset-transformation.ts";
import { createKpEquationEndpointHandoffResolver, type KpVerifiedEquationEndpointHandoff } from "./equation-endpoint-handoff.ts";

export interface KpSemanticEquationToken {
  readonly id: string;
  readonly latex: string;
  readonly kind: "factor" | "term" | "operator" | "delimiter";
  readonly metadata?: Readonly<Record<string, KpAssetMetadataValue>> | undefined;
}
export interface KpSemanticEquationProjection {
  readonly object: KpSemanticAssetObject;
  readonly tokens: readonly KpSemanticEquationToken[];
}
export interface KpSemanticOperationProjection {
  readonly endpoints: readonly [KpSemanticEquationProjection, KpSemanticEquationProjection];
  readonly transformation: KpSemanticTransformation;
}
export type KpSemanticOperationProjectionHandlers<Proof extends { readonly kind: string }, Result = KpSemanticOperationProjection> = {
  readonly [Kind in Proof["kind"]]: {
    readonly accepts: (value: unknown) => value is Extract<Proof, { readonly kind: Kind }>;
    readonly project: (proof: Extract<Proof, { readonly kind: Kind }>) => Result;
  };
};

/** Composition roots supply typed extensions, not a growing operation switch. */
export function defineKpSemanticOperationProjector<Proof extends { readonly kind: string }, Result = KpSemanticOperationProjection>(
  handlers: KpSemanticOperationProjectionHandlers<Proof, Result>
): (proof: Proof) => Result {
  const registered = new Map<string, (proof: unknown) => Result>();
  for (const kind in handlers) {
    // Enumeration loses the mapped key type, but never changes the proof type.
    if (Object.hasOwn(handlers, kind)) registered.set(kind, authenticateProjection(handlers[kind as Proof["kind"]]));
  }
  return (proof: Proof) => {
    const project = proof && registered.get(proof.kind);
    if (!project) throw new TypeError("No registered semantic operation owner authenticates this proof.");
    return project(proof);
  };
}

function authenticateProjection<Proof, Result>(owner: {
  readonly accepts: (value: unknown) => value is Proof;
  readonly project: (proof: Proof) => Result;
}): (proof: unknown) => Result {
  const { accepts, project } = owner;
  // The closure retains the proof/handler type relationship without an erased
  // union cast, and snapshots registration against later caller mutation.
  return proof => {
    if (!accepts(proof)) throw new TypeError("The registered owner did not authenticate this proof.");
    return project(proof);
  };
}

export function composeKpSemanticOperationProjections(id: string, projections: readonly KpSemanticOperationProjection[],
  handoffs: readonly KpVerifiedEquationEndpointHandoff[] = []) {
  if (projections.length === 0) throw new TypeError("Compose at least one verified operation projection.");
  const endpoints = [projections[0]!.endpoints[0]];
  const objects = new Map<string, KpSemanticAssetObject>();
  const handoffResolver = createKpEquationEndpointHandoffResolver(handoffs);
  const transformations: KpSemanticTransformation[] = [];
  for (const projection of projections) {
    const [source, target] = projection.endpoints, transform = projection.transformation;
    if (JSON.stringify(endpoints.at(-1)) !== JSON.stringify(source) &&
        !handoffResolver.connectProjections(endpoints.at(-1)!, source))
      throw new TypeError("Adjacent operation projections must share an exact semantic endpoint.");
    if (transform.sourceObjectIds.length !== 1 || transform.targetObjectIds.length !== 1 ||
        transform.sourceObjectIds[0] !== source.object.id || transform.targetObjectIds[0] !== target.object.id)
      throw new TypeError("Operation projection endpoints must match its transformation.");
    endpoints.push(target); transformations.push(transform);
    for (const endpoint of [source, target]) {
      const previous = objects.get(endpoint.object.id);
      if (previous && JSON.stringify(previous) !== JSON.stringify(endpoint.object)) throw new TypeError("Endpoint view identity has conflicting content.");
      objects.set(endpoint.object.id, endpoint.object);
    }
  }
  handoffResolver.finish();
  if (new Set(endpoints.map(e => e.object.id)).size !== endpoints.length)
    throw new TypeError("Composed operation checkpoints need distinct identities.");
  return Object.freeze({ id, title: "Composed algebra", tokens: Object.freeze(endpoints.map(e => e.tokens)),
    bundle: createKpAssetBundle({ id: `asset.${id}`, title: "Composed algebra", objects: [...objects.values()] }),
    transformations: Object.freeze(transformations) });
}
