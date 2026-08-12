# Scheme factorial first-expansion checkpoint

Date: 2026-08-12
Status: HUMAN_CHECKPOINT
Route: `/tutorials/programming/scheme-factorial/`

## What changed

The initial code-material checkpoint was rejected after review exposed a
semantic mismatch: it treated matching spellings as persistent objects. The
outer `factorial` does not persist as the recursive operator, and the argument
glyph `3` does not persist as the retained factor. The corrected checkpoint
keeps the same isolated route and compact endpoint but replaces that ledger and
motion in full.

The code now passes through five native material states: call, expanded lambda
application, bound body, selected recursive branch, and suspended product.
`factorial` opens into a fresh procedure activation. The argument `3` travels
into parameter `n` and is consumed. Fresh binding projections appear at the
body's `n` occurrences. The predicate and dormant base branch fold away, then
the decrement resolves into a fresh `2`. The transition contains no SVG
particles, detached parameter cell, branch card, waiting-shell row, or
whole-checkpoint crossfade.

The default route remains an austere focus surface: one short heading, one
expression stage, one sentence, Play, and one scrub track. The definition
fold, later recursion motifs, checkpoint transcript, previous / next / rewind
controls, and animation-library navigation remain behind `?view=full`.

## Durable proof

`scheme-factorial-first-expansion.ts` compiles a corrected closed action family
from the frozen trace: `ExpandProcedure`, `BindArgument`, `ProjectBinding`,
`ChooseBranch`, `SuspendExpression`, and `ReducePrimitive`. Four provenance
types keep source syntax, activated syntax, binding projections, and primitive
results separate. A terminal-disposition ledger accounts for each source token,
and each fresh material names exactly one introducing action. Validation
rejects the specific outer-operator and argument-glyph continuities that caused
the failure. The sampler remains pure, direct-seekable, and reverse-stable.

The compiler remains build authority. Learner publication receives only the
compact certified material transition; it does not import the evaluator or
trace. Reduced motion chooses one exact endpoint rather than sampling
intermediate movement.

## Verification

- `npm run test:scheme-factorial`: 118 focused tests passed, including explicit
  rejection of glyph-equality continuity, material provenance, endpoint,
  reverse-seek, and one-paint-owner checks.
- `npm run typecheck`: application, Node, test, Svelte, and domain typechecks
  passed.
- `npm run visual:scheme-factorial`: six Chromium checks passed for the focused
  view, full-story preservation, compact phone fit, reduced motion,
  no-JavaScript publication, and evaluator-free learner resources.

Automated verification protects semantic truth and lifecycle behavior. It does
not approve motion, timing, spacing, visual continuity, or the teaching claim.

## Human review question

Does the learner see `factorial` open into its procedure, the argument `3`
enter and disappear into `n`, fresh `3` values appear in the body, the unused
branch close, and the recursive call settle at `2`—without mistaking any equal
glyph for one object moving through all those roles?

If approved, the next separately authorized step is to refine and pressure the
typed material grammar with one structurally different transformation. If not,
revise or replace only this factorial-local material transition and renderer;
preserve the parser, interpreter, trace, score, timeline, publication shell,
clock, URLs, and accessibility.

CodeMirror integration and later factorial stages remain explicitly deferred.
