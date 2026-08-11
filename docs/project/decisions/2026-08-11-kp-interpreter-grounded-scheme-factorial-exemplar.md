# Interpreter-grounded Scheme factorial exemplar

Date: 2026-08-11
Status: approved

## Decision

Pause the “The Equation Remembers” algebra proof at its preserved slice-8
human checkpoint and make one interpreter-grounded Scheme factorial vignette
the active visual-discovery exemplar.

The interpreter is a semantic witness, not the film director. It produces a
bounded, deterministic, serializable evaluation trace with stable syntax,
binding, environment, continuation, branch, and value identities. A separate
typed pedagogical score may omit, group, hold, and emphasize trace events while
respecting their causal dependencies. Published playback consumes the frozen
trace and score; it does not run the evaluator.

The first exemplar is `(factorial 3)`. Its primary learner claim is that a
recursive call suspends unfinished work, descends to a base case, and resolves
that work in reverse. The first descent is explicit, repeated middle descents
use a semantic summary motif rather than faster playback, and the base case and
return cascade are explicit.

## Approved presentation contract

- Use a small pedagogical Scheme surface language over a syntax-neutral core.
- Keep one anchored native-code surface. Bodies bloom downward; suspended
  contexts remain recognizable compact shells.
- Use lexical environments underneath and selective substitution-like motion
  through persistent parameter cells and demand-driven provenance echoes.
- Fold unselected branches into dormant particles rather than implying that
  they executed.
- Fully expand user functions, minimally expose control decisions, and reduce
  trusted primitives locally.
- Retain one returned value identity while it reopens suspended contexts.
- Keep code neutral with one moving provenance accent.
- Treat deterministic jostle as a restrained active-evaluation signal.
- Fold the full definition into a persistent function seed after first use.
- Keep settled code native, searchable, selectable DOM; use transient inert
  overlays only during motion.
- Reflow and compact responsive geometry without scaling typography.
- Use one stable caption per semantic interval and one continuous reversible
  scrubber with named checkpoints.

## Preservation and promotion boundary

The factorial asset remains parallel to the existing lambda-application route.
Do not migrate that lesson, generalize a programming-language renderer, add a
live learner evaluator, resume CodeMirror work, or claim SICP curriculum
coverage inside this run. Stop at the factorial human visual checkpoint.
Promotion requires approval of the exemplar and a structurally different
second caller.

Socratic prediction prompts remain a possible later lesson-layer capability.
They are not part of the first vignette.

## References

- `../reviews/2026-08-11-scheme-factorial-semantic-vignette-long-loop-proposal.md`
- `../reviews/2026-08-03-s-expression-material-choreography-long-loop-proposal.md`
- `../../../Ouroboros_Versions/ob-april/src/ob/evaluator.cljs`
- `../../../Ouroboros_Versions/ob-april/src/ob/animate.cljs`
- `../../../Ouroboros_Versions/ob-april/src/ob/animation-loop.cljs`

