# Scheme factorial Lisp seam audit

Date: 2026-08-11

This audit fixes the boundary between the old interpreter-driven lineage, the
current hand-authored Lisp exemplar, and the new factorial vignette. Factorial
is a parallel exemplar. It does not replace or mutate the current lambda lesson.

## Finding

KP already has most of the required presentation infrastructure. The missing
authority is a small Scheme evaluator that emits a frozen causal trace, plus a
declarative pedagogical score that compiles that trace into checkpoints. The
factorial work should adapt existing pure motion laws rather than route a new
semantic model through the fixture-specific lambda asset or revive the old D3
runtime.

| Concern | Old lineage | Current KP seam | Disposition |
| --- | --- | --- | --- |
| Syntax identity | AST nodes with explicit delimiters and hygienic IDs | `lisp-semantic-model.ts` has stable tokens, roles, spans, and delimiters | Adapt the identity laws into a factorial-local Scheme model |
| Evaluation truth | Zipper evaluator results, environments, continuations, before/after states | Generic programming trace is too lossy for recursion | Build a tiny factorial-local evaluator and frozen typed trace |
| Pedagogical order | Mostly evaluator order | Hand-authored presentation plans | Add a declarative score that may group, omit, hold, emphasize, or semantically compress without violating trace causality |
| Fold and bloom | Imperative replacement transitions | Pure recursive fold schedule and material roots | Reuse the recursive ordering |
| Active motion | Runtime transition loop | Deterministic contained-jostle sampling | Reuse unchanged behind an event adapter |
| Binding | Lambda-expansion result and substitution plan | Binding arcs and bound-value propagation | Adapt for persistent parameter cells and demand-driven provenance echoes |
| Waiting work | Evaluator continuation | Beads and folded material can depict compact work | Model continuations and one return identity locally; reuse material vocabulary only |
| Timing | Transition plus pause in a mutable loop | Deterministic dwell timeline and one sampled progress value | Adapt by compiling the pedagogical score into the existing timeline shape |
| Paint ownership | SVG text and D3 transitions | Native searchable DOM with inert transient overlays | Reuse the ownership contract with a new factorial projector |
| Responsive behavior | Runtime DOM geometry | Pure responsive geometry and no typography scaling | Adapt with recursion-aware compaction |
| Controls | History-based forward/reverse | Framework-neutral progressive scrubber | Reuse; playback samples the frozen score rather than running the evaluator |
| Framework host | ClojureScript application | SvelteKit lesson route | Svelte may host the artifact but owns neither semantics nor motion sampling |

## Exact reuse boundary

Reuse or adapt:

- stable occurrence, delimiter, source-span, and role laws;
- contents-before-parent fold and inverse bloom ordering;
- deterministic contained jostle;
- material conservation across fold, bind, reconstruction, and reduction;
- binding-arc geometry, native DOM settlement, responsive reflow, checkpoint
  timelines, and the framework-neutral scrubber.

Build locally for the factorial exemplar:

- Scheme parser and semantic source model;
- small-step evaluator, environment snapshots, continuations, branch choices,
  value lineage, and frozen trace serialization;
- causal score validator and factorial checkpoint compiler;
- recursion-aware waiting shells, return-value projection, captions, and route.

Reject:

- live evaluation during playback;
- D3-owned transitions, semantic DOM geometry, mutable animation loops, and
  history-only reversal;
- SVG text as the settled code surface;
- independent clocks, random motion, or whole-stage responsive scaling;
- importing the current lambda asset as factorial semantic authority.

The executable companion is
`src/architecture/scheme-factorial-reuse-boundary.ts`. It exists to keep later
slices honest: presentation capability may be shared, but semantic truth remains
trace-derived and exemplar-local.

## Ownership map

1. The evaluator owns causal facts and value identity.
2. The pedagogical score owns grouping, omission, compression, dwell, and
   emphasis subject to causal validation.
3. Motion compilers own geometry and interpolation from score intervals.
4. The projector owns native settled code and inert transient paint.
5. The host owns route lifecycle, controls, review capture, and responsive
   placement—not semantic state.

## Preservation and rollback

The current lambda asset, lesson route, tests, and visual output remain
unchanged. The new manifest and tests are the smallest rollback unit for this
audit. Later factorial slices may import the listed pure seams, but any need to
edit the current lambda asset is a stop condition and requires a new review.
