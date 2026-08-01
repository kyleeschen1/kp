import type {
  KpAnimationCatalogueEntry,
  KpAnimationCatalogueProjection
} from "./animation-catalogue-projection.ts";

export const KP_ANIMATION_CATALOGUE_EXEMPLAR_ID =
  "animation.linear-solve.solve-x";

export type KpAnimationCatalogueSelection =
  | Readonly<{
      readonly status: "selected";
      readonly source: "default" | "route";
      readonly entry: KpAnimationCatalogueEntry;
    }>
  | Readonly<{
      readonly status: "deferred";
      readonly source: "route";
      readonly entry: KpAnimationCatalogueEntry;
    }>
  | Readonly<{
      readonly status: "not-found";
      readonly source: "route";
      readonly requestedArtifactId: string;
    }>;

export function resolveKpAnimationCatalogueSelection(input: {
  readonly projection: KpAnimationCatalogueProjection;
  readonly artifactId?: string | undefined;
}): KpAnimationCatalogueSelection {
  const requestedArtifactId =
    input.artifactId ?? KP_ANIMATION_CATALOGUE_EXEMPLAR_ID;
  const entry = input.projection.entries.find(
    ({ animationId }) => animationId === requestedArtifactId
  );

  if (entry === undefined) {
    if (input.artifactId === undefined) {
      throw new Error(
        `Catalogue projection is missing exemplar ${requestedArtifactId}.`
      );
    }
    return Object.freeze({
      status: "not-found" as const,
      source: "route" as const,
      requestedArtifactId
    });
  }

  if (entry.animationId !== KP_ANIMATION_CATALOGUE_EXEMPLAR_ID) {
    // Catalogue identity can exist before its shell treatment is approved.
    // Keeping this state explicit prevents the exemplar spike from silently
    // becoming a catalogue-wide renderer rollout.
    return Object.freeze({
      status: "deferred" as const,
      source: "route" as const,
      entry
    });
  }

  return Object.freeze({
    status: "selected" as const,
    source: input.artifactId === undefined ? "default" as const : "route" as const,
    entry
  });
}
