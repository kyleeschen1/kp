import type {
  KpAnimationWorkbenchSeed,
  KpAnimationWorkbenchSeedSource
} from "./semantic-animation-workbench-seeds.ts";

export interface KpCanonicalAnimationIdentity {
  readonly schemaVersion: "kp.canonical-animation-identity.v1";
  readonly animationId: string;
  readonly title: string;
  readonly aliases: readonly string[];
  readonly familyIds: readonly string[];
  readonly provenance: KpAnimationWorkbenchSeedSource;
  readonly availability: "concrete" | "planned";
}

export function createKpCanonicalAnimationIdentity(input: {
  readonly seed: KpAnimationWorkbenchSeed;
  readonly aliases?: readonly string[];
  readonly familyIds?: readonly string[];
}): KpCanonicalAnimationIdentity {
  const aliases = uniqueNonempty(input.aliases ?? []);
  const familyIds = uniqueNonempty(input.familyIds ?? []);
  if (!input.seed.animationId.startsWith("animation.")) {
    throw new Error(
      `Canonical animation id ${input.seed.animationId} must start with animation.`
    );
  }
  if (aliases.includes(input.seed.animationId)) {
    throw new Error(
      `Canonical animation ${input.seed.animationId} cannot repeat itself as an alias.`
    );
  }
  return {
    schemaVersion: "kp.canonical-animation-identity.v1",
    animationId: input.seed.animationId,
    title: input.seed.title,
    aliases,
    familyIds,
    provenance: input.seed.source,
    availability:
      input.seed.expectedPlayability === "playable" ? "concrete" : "planned"
  };
}

export function assertKpCanonicalAnimationIdentities(
  identities: readonly KpCanonicalAnimationIdentity[]
): void {
  const claims = new Map<string, string>();
  for (const identity of identities) {
    claim(identity.animationId, identity.animationId, claims);
    for (const alias of identity.aliases) {
      claim(alias, identity.animationId, claims);
    }
    if (
      identity.availability === "concrete" &&
      identity.provenance.kind !== "catalog"
    ) {
      throw new Error(
        `Concrete animation ${identity.animationId} must have catalog provenance.`
      );
    }
    if (
      identity.availability === "planned" &&
      identity.provenance.kind !== "approved-plan"
    ) {
      throw new Error(
        `Planned animation ${identity.animationId} must have approved-plan provenance.`
      );
    }
  }
}

function uniqueNonempty(values: readonly string[]): readonly string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const normalized = value.trim();
    if (normalized === "") {
      throw new Error("Canonical animation aliases and family ids must not be empty.");
    }
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }
  return result;
}

function claim(
  claimId: string,
  animationId: string,
  claims: Map<string, string>
): void {
  const existing = claims.get(claimId);
  if (existing !== undefined && existing !== animationId) {
    throw new Error(
      `Animation identity claim ${claimId} collides between ${existing} and ${animationId}.`
    );
  }
  claims.set(claimId, animationId);
}
