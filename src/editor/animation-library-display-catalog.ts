import generatedCatalog from
  "./animation-library-display-catalog.generated.json" with {
    type: "json"
  };
import type {
  KpAnimationLibraryDisplayEntry
} from "./animation-library-display-catalog-builder.ts";

export type {
  KpAnimationLibraryDisplayEntry,
  KpAnimationLibraryDisplayRepresentation,
  KpAnimationLibraryDisplayRepresentationKind
} from "./animation-library-display-catalog-builder.ts";

const catalog = Object.freeze(
  (generatedCatalog as unknown as readonly KpAnimationLibraryDisplayEntry[])
    .map((entry) => Object.freeze({
      ...entry,
      tags: Object.freeze([...entry.tags]),
      representations: Object.freeze(
        entry.representations.map((representation) =>
          Object.freeze({ ...representation })
        )
      )
    }))
);

/**
 * Runtime catalog reads generated metadata only. Promotion certificates stay
 * in the source-rich builder so opening the library cannot execute animation
 * semantics or pull renderer graphs into the outer review page.
 */
export function createKpAnimationLibraryDisplayCatalog():
readonly KpAnimationLibraryDisplayEntry[] {
  return catalog;
}
