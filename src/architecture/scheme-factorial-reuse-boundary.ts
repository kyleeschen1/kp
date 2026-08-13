export type KpSchemeFactorialReuseDisposition =
  | "reuse"
  | "adapt"
  | "preserve-specialized"
  | "reject";

export interface KpSchemeFactorialReuseEntry {
  readonly id: string;
  readonly concern: string;
  readonly sources: readonly string[];
  readonly disposition: KpSchemeFactorialReuseDisposition;
  readonly authority: "semantic" | "pedagogical" | "presentation" | "host";
  readonly rationale: string;
}

/**
 * The factorial exemplar may reuse motion laws without inheriting either a
 * fixture-authored semantic model or the old imperative playback runtime.
 */
export const kpSchemeFactorialReuseBoundary = Object.freeze([
  entry({
    id: "shared-code-syntax-role-protocol",
    concern: "Exact offset-bearing syntax paint roles",
    sources: ["src/semantic/code-source-token-protocol.ts"],
    disposition: "adapt",
    authority: "presentation",
    rationale:
      "Adopt the paint vocabulary and range law while retaining occurrence and delimiter IDs from the Scheme tree."
  }),
  entry({
    id: "shared-complete-source-projection",
    concern: "Flat fragment composition into imperative-language source snapshots",
    sources: ["src/semantic/code-source-projection.ts"],
    disposition: "reject",
    authority: "semantic",
    rationale:
      "Factorial checkpoints project recursive runtime material, not edits to a flat sequence of complete function fragments."
  }),
  entry({
    id: "shared-settlement-law",
    concern: "Travel, arrival, recognition, paint handoff, and withdrawal order",
    sources: ["src/animation/code-motion-settlement.ts"],
    disposition: "adapt",
    authority: "presentation",
    rationale:
      "Apply the causal law through motif-local adapters without replacing binding, branch, structural, or return samplers."
  }),
  entry({
    id: "shared-settlement-exceptions",
    concern: "Explicit semantic deletion and reduced-motion endpoint jumps",
    sources: ["src/animation/code-motion-settlement-exceptions.ts"],
    disposition: "adapt",
    authority: "presentation",
    rationale:
      "Bind exceptions to exact Scheme transitions and material IDs; unsupported exception kinds remain unavailable."
  }),
  entry({
    id: "scheme-source-model",
    concern: "Stable source occurrences, delimiters, roles, and spans",
    sources: ["src/semantic/lisp-semantic-model.ts"],
    disposition: "adapt",
    authority: "semantic",
    rationale:
      "Preserve identity laws while introducing a factorial-local Scheme syntax model."
  }),
  entry({
    id: "evaluator-trace",
    concern: "Evaluation order, environments, continuations, and value lineage",
    sources: ["src/tutorial/programming-execution-trace.ts"],
    disposition: "preserve-specialized",
    authority: "semantic",
    rationale:
      "The generic program trace omits the causal and provenance detail required for recursion."
  }),
  entry({
    id: "pedagogical-score",
    concern: "Grouping, omission, compression, holds, and emphasis",
    sources: [],
    disposition: "preserve-specialized",
    authority: "pedagogical",
    rationale:
      "A declarative score may edit presentation but must preserve trace causality."
  }),
  entry({
    id: "material-operations",
    concern: "Fold, unfold, bind, propagate, reconstruct, and reduce verbs",
    sources: ["src/animation/lisp-s-expression-material-contract.ts"],
    disposition: "adapt",
    authority: "presentation",
    rationale:
      "Reuse operation meanings while projecting them from evaluator events."
  }),
  entry({
    id: "recursive-fold-schedule",
    concern: "Contents-before-parent folding and parent-before-contents unfolding",
    sources: ["src/animation/lisp-s-expression-fold-schedule.ts"],
    disposition: "reuse",
    authority: "presentation",
    rationale: "The existing deterministic recursive ordering is domain-correct."
  }),
  entry({
    id: "active-evaluation-jostle",
    concern: "Restrained deterministic motion within expression membranes",
    sources: ["src/animation/lisp-s-expression-contained-jostle.ts"],
    disposition: "reuse",
    authority: "presentation",
    rationale: "Pure sampling already provides a single-clock active-evaluation signal."
  }),
  entry({
    id: "binding-geometry",
    concern: "Argument-to-parameter arcs and occurrence provenance",
    sources: [
      "src/animation/lisp-lambda-binding-geometry.ts",
      "src/animation/lisp-bound-value-propagation.ts"
    ],
    disposition: "adapt",
    authority: "presentation",
    rationale:
      "Retain geometric laws but add persistent parameter cells and demand-driven echoes."
  }),
  entry({
    id: "waiting-contexts-and-return-lineage",
    concern: "Suspended recursive work and one returning value identity",
    sources: ["src/animation/lisp-s-expression-beads.ts"],
    disposition: "preserve-specialized",
    authority: "semantic",
    rationale:
      "Bead material can inform the projection, but continuations and return identity come from the trace."
  }),
  entry({
    id: "deterministic-timeline",
    concern: "One sampled clock, semantic checkpoints, dwell, seek, and rewind",
    sources: ["src/animation/lisp-s-expression-timing.ts"],
    disposition: "adapt",
    authority: "presentation",
    rationale:
      "Compile a factorial score into the existing deterministic timeline shape."
  }),
  entry({
    id: "native-code-paint",
    concern: "Searchable settled code plus inert transient overlays",
    sources: [
      "src/rendering/lisp-s-expression-material-dom.ts",
      "src/rendering/lisp-material-stage-projector.ts"
    ],
    disposition: "reuse",
    authority: "presentation",
    rationale:
      "The native-DOM ownership contract is correct; factorial needs a new projector, not a new paint model."
  }),
  entry({
    id: "responsive-geometry",
    concern: "Reflow and semantic compaction without whole-stage scaling",
    sources: ["src/animation/lisp-s-expression-responsive-geometry.ts"],
    disposition: "adapt",
    authority: "presentation",
    rationale: "Keep typography stable while adding recursion-aware compaction."
  }),
  entry({
    id: "scrubber-host",
    concern: "Progressive enhancement and semantic checkpoint controls",
    sources: [
      "src/tutorial/kp-tutorial-scrub-bar.ts",
      "src/tutorial/kp-tutorial-scrub-bar-renderer.ts"
    ],
    disposition: "reuse",
    authority: "host",
    rationale: "The framework-neutral custom element already owns the correct control seam."
  }),
  entry({
    id: "current-lambda-exemplar",
    concern: "Existing hand-authored lambda lesson and semantic asset",
    sources: [
      "src/semantic/lisp-lambda-application-asset.ts",
      "src/tutorial/lisp-function-application/"
    ],
    disposition: "preserve-specialized",
    authority: "host",
    rationale:
      "Factorial is a parallel exemplar and must not replace or acquire semantic truth from this fixture."
  }),
  entry({
    id: "legacy-imperative-loop",
    concern: "Runtime evaluation, D3 transitions, mutable history, and DOM geometry",
    sources: ["../Ouroboros_Versions/ob-april/src/ob/animation-loop.cljs"],
    disposition: "reject",
    authority: "host",
    rationale:
      "Retain its semantic vocabulary, not its runtime, geometry, or reversal architecture."
  })
] as const satisfies readonly KpSchemeFactorialReuseEntry[]);

function entry<const Entry extends KpSchemeFactorialReuseEntry>(
  value: Entry
): Readonly<Entry> {
  return Object.freeze({
    ...value,
    sources: Object.freeze([...value.sources])
  });
}
