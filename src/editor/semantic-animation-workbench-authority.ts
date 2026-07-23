export type KpAnimationWorkbenchAuthorityId =
  | "animation-catalog"
  | "representation-registries"
  | "theseus"
  | "promotion-evidence"
  | "development-review";

export type KpAnimationWorkbenchFact =
  | "canonical-animation-identity"
  | "concrete-playability"
  | "representation-relationships"
  | "execution-state"
  | "roadmap-priority"
  | "maturity-state"
  | "approval-evidence"
  | "current-review-state"
  | "review-history";

export interface KpAnimationWorkbenchAuthority {
  readonly id: KpAnimationWorkbenchAuthorityId;
  readonly label: string;
  readonly owns: readonly KpAnimationWorkbenchFact[];
  readonly sourceBoundary: string;
}

export interface KpAnimationWorkbenchAuthorityMap {
  readonly schemaVersion: "kp.semantic-animation-workbench-authority.v1";
  readonly authorities: readonly KpAnimationWorkbenchAuthority[];
  readonly derivedIndexOwns: readonly never[];
}

const authorities = [
  {
    id: "animation-catalog",
    label: "Animation catalog",
    owns: ["canonical-animation-identity", "concrete-playability"],
    sourceBoundary: "Concrete AnimationAsset and editor descriptor catalogs"
  },
  {
    id: "representation-registries",
    label: "Representation registries",
    owns: ["representation-relationships"],
    sourceBoundary: "Existing lesson, card, concept-room, static, and export registries"
  },
  {
    id: "theseus",
    label: "Theseus",
    owns: ["execution-state", "roadmap-priority"],
    sourceBoundary: "Repository-owned plans, run contracts, actions, and evidence"
  },
  {
    id: "promotion-evidence",
    label: "Promotion evidence",
    owns: ["maturity-state", "approval-evidence"],
    sourceBoundary: "Reviewed exemplar checkpoints and conformance evidence"
  },
  {
    id: "development-review",
    label: "Development review",
    owns: ["current-review-state", "review-history"],
    sourceBoundary: "Append-only item-scoped review inbox and capture history"
  }
] as const satisfies readonly KpAnimationWorkbenchAuthority[];

export function createKpAnimationWorkbenchAuthorityMap():
  KpAnimationWorkbenchAuthorityMap {
  assertSingleAuthorityPerFact(authorities);
  return {
    schemaVersion: "kp.semantic-animation-workbench-authority.v1",
    authorities,
    // The Workbench may reconcile facts, but never becomes their write authority.
    derivedIndexOwns: []
  };
}

export function authorityForKpAnimationWorkbenchFact(
  map: KpAnimationWorkbenchAuthorityMap,
  fact: KpAnimationWorkbenchFact
): KpAnimationWorkbenchAuthority {
  const matches = map.authorities.filter((authority) =>
    authority.owns.includes(fact)
  );
  if (matches.length !== 1) {
    throw new Error(
      `Workbench fact ${fact} must have exactly one authority; found ${matches.length}.`
    );
  }
  return matches[0]!;
}

export function assertSingleAuthorityPerFact(
  input: readonly KpAnimationWorkbenchAuthority[]
): void {
  const owners = new Map<KpAnimationWorkbenchFact, KpAnimationWorkbenchAuthorityId>();
  for (const authority of input) {
    if (authority.owns.length === 0) {
      throw new Error(`Workbench authority ${authority.id} must own at least one fact.`);
    }
    for (const fact of authority.owns) {
      const owner = owners.get(fact);
      if (owner !== undefined) {
        throw new Error(
          `Workbench fact ${fact} cannot be owned by both ${owner} and ${authority.id}.`
        );
      }
      owners.set(fact, authority.id);
    }
  }
}
