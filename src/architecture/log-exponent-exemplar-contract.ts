export interface KpLogExponentReference {
  readonly path: string;
  readonly role: string;
  readonly decision: "preserve" | "extend";
}

export const kpLogExponentExemplarIdentity = Object.freeze({
  animationId: "animation.algebra.log-exponent.solve-two-power-x",
  fixtureId: "log-exponent.solve-two-power-x",
  familyId: "family.algebra.exponent-log-laws",
  sourceLatex: "2^x=7",
  wrappedLatex: "\\ln(2^x)=\\ln 7",
  extractedLatex: "x\\ln 2=\\ln 7",
  solvedLatex: "x=\\frac{\\ln 7}{\\ln 2}",
  pressureCallerId: "animation.algebra.log-quotient.difference-to-quotient"
});

export const kpLogExponentReferenceInventory = Object.freeze([
  reference(
    "src/animation/function-wrap-choreography.ts",
    "Argument continuity and wrapper-introduction reference.",
    "extend"
  ),
  reference(
    "src/animation/exponent-succession-choreography.ts",
    "Exponent role-change, lifecycle, and transferable-salience reference.",
    "extend"
  ),
  reference(
    "src/animation/exponent-radical-adapter.ts",
    "Native equation asset and representational-lineage reference.",
    "preserve"
  ),
  reference(
    "src/animation/symbolic-manipulation-family-registry.ts",
    "Existing exponent/log laws and family identity.",
    "extend"
  ),
  reference(
    "src/animation/choreography-compiler.ts",
    "Existing single-clock choreography authority.",
    "preserve"
  ),
  reference(
    "src/rendering/native-katex-rendered-scene.ts",
    "Native settled KaTeX paint and accessibility authority.",
    "preserve"
  ),
  reference(
    "src/animation/catalog-packs/algebra.ts",
    "Lazy algebra capability and catalogue registration boundary.",
    "extend"
  ),
  reference(
    "docs/project/reviews/2026-08-14-log-exponent-operation-transport-long-loop-proposal.md",
    "Approved scope, slice order, checkpoints, and done contract.",
    "preserve"
  )
] as const satisfies readonly KpLogExponentReference[]);

export const kpLogExponentVisualAcceptance = Object.freeze([
  "logging both sides and applying the power law are visibly distinct actions",
  "both logarithm wrappers enter as one balanced equality-preserving operation",
  "the exponent x remains continuously visible while moving into coefficient position",
  "the base 2 remains the logarithm argument and the right-hand logarithm remains stable",
  "every moving semantic fragment reaches its measured destination before native target ownership",
  "no generic opacity fade substitutes for missing correspondence or trajectory",
  "direct seek, rewind, interruption, and reduced motion resolve deterministic semantic endpoints",
  "native KaTeX owns selectable, accessible, exact source and target equations",
  "compact catalogue presentation remains stable without a new runtime, renderer, or clock"
]);

export const kpLogExponentPreservationBoundary = Object.freeze([
  "the existing 40 catalogue assets and their current identities",
  "approved function-wrap, exponent, radical, and both-sides operation behavior",
  "one deterministic host clock and pure progress sampling",
  "native settled KaTeX, accessibility, direct seek, and exact rewind",
  "framework-neutral assets and lazy capability-pack ownership",
  "family-local implementation until approved log and linearity callers prove a shared seam"
]);

export const kpLogExponentRollbackUnits = Object.freeze([
  "canonical solve-two-power-x asset and its family-local compiler",
  "log-difference-to-quotient pressure caller",
  "bounded linearity pressure caller",
  "optional operation-transport promotion"
]);

function reference(
  path: string,
  role: string,
  decision: "preserve" | "extend"
): KpLogExponentReference {
  return Object.freeze({ path, role, decision });
}

