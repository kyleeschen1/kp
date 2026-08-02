export interface KpVectorDotProjectionReference {
  readonly path: string;
  readonly role: string;
  readonly decision: "preserve" | "evolve";
}

export const kpVectorDotProjectionReferenceInventory = Object.freeze([
  reference(
    "src/animation/dot-projection-adapter.ts",
    "Existing KpAnimationAsset identity and semantic graph adapter.",
    "evolve"
  ),
  reference(
    "src/animation/dot-projection-runtime-frame.ts",
    "Existing shared-clock projection, orthogonality, and rewind sampler.",
    "evolve"
  ),
  reference(
    "src/animation/symbolic-manipulation-family-registry.ts",
    "Canonical dot-product and vector-projection definitions and sample identity.",
    "preserve"
  ),
  reference(
    "src/editor/graph-svg-viewport.ts",
    "Existing native SVG graph host and sole graph paint owner.",
    "evolve"
  ),
  reference(
    "src/rendering/dimensional-continuity-graph-profile.ts",
    "Approved orthographic 2D technical language and inline KaTeX helper.",
    "preserve"
  ),
  reference(
    "src/animation/catalog-loader.ts",
    "Lazy graph capability-pack ownership for the stable animation id.",
    "preserve"
  ),
  reference(
    "docs/project/threads/animation-library-promotion.md",
    "Stable promotion frontier with vector dot projection at rank 5.",
    "preserve"
  )
] as const satisfies readonly KpVectorDotProjectionReference[]);

export const kpVectorDotProjectionCurrentBaseline = Object.freeze({
  animationId: "animation.dot-projection.basic",
  sampleId: "sample.animation.dot-projection.basic",
  sourceVector: Object.freeze([3, 4] as const),
  targetVector: Object.freeze([4, 0] as const),
  dotProduct: 12,
  canonicalFormat: "legacy" as const,
  knownPresentationGaps: Object.freeze([
    "axis-aligned target makes the projection relation visually trivial",
    "raw SVG annotation text instead of native inline KaTeX",
    "default graph profile instead of dimensional continuity",
    "no indexed component-to-geometry lineage",
    "no explicit magnitude, angle, scale, residual, or right-angle settlement"
  ])
});

export const kpVectorDotProjectionVisualAcceptance = Object.freeze([
  "one synchronized symbolic and graph projection on the shared clock",
  "one native SVG paint owner through the existing graph surface adapter",
  "orthographic dimensional-continuity profile with warm plane and sparse quiet-blue construction grid",
  "native inline KaTeX for every mathematical label and exact static value",
  "indexed x then y component pairing linked to graph components",
  "projection scale, projected vector, residual, and perpendicular relation remain explicit",
  "direct seek and rewind reproduce exact semantic and geometric state",
  "reduced motion preserves the same settled states without compulsory travel",
  "responsive layout reduces optional density before mathematical labels shrink",
  "accessible state names vectors, dot product, projection, residual, and orthogonality",
  "no WebGL request, second graph engine, universal scene graph, or renderer-owned vector math"
]);

export const kpVectorDotProjectionPreservationBoundary = Object.freeze([
  "animation.dot-projection.basic identity and graph capability-pack ownership",
  "sample.animation.dot-projection.basic family and catalogue identity",
  "canonical family definitions and exact law references",
  "KpAnimationAsset, runtime sampler, shared clock, and SVG graph host",
  "persistent catalogue shell, compact controls, URL selection, and Review capture",
  "rank-5 next status until explicit post-checkpoint promotion approval"
]);

function reference(
  path: string,
  role: string,
  decision: "preserve" | "evolve"
): KpVectorDotProjectionReference {
  return Object.freeze({ path, role, decision });
}
