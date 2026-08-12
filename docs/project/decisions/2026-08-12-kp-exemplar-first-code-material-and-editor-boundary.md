# Exemplar-first code material and editor boundary

Date: 2026-08-12
Status: accepted for one bounded visual-discovery exemplar

## Decision

The rejected Scheme factorial checkpoint revealed an execution-order failure,
not a failure of the interpreter-grounded semantic substrate. KP built and
verified trace, score, checkpoint, timeline, responsive, and publication
infrastructure before proving the smallest perceptual claim. The renderer then
substituted checkpoint rows and abstract SVG marks for the requested behavior
of the code material itself.

Subjective visual work now uses two explicit modes:

1. **Visual discovery:** state one perceptual claim, compile one short typed
   material transformation, verify only durable semantic and lifecycle truth,
   and stop for human review.
2. **Production promotion:** only after that exemplar communicates unaided,
   generalize types, connect broader authoring and interpreter inputs, add a
   second caller, and run responsive, accessibility, performance, and browser
   release matrices.

Passing automated checks is never visual approval. A visual abstraction may
not be promoted merely because its semantic substrate or renderer is typed.
The first Scheme proof is only:

```scheme
(factorial 3)
```

opening into:

```scheme
(* 3 (factorial 2))
```

The observable requirement is that code glyphs and parentheses are the
material: the call opens, the argument survives as the retained factor, the
chosen recursive branch blooms around it, and the next argument settles to
`2`. Abstract particles, detached parameter rows, and whole-checkpoint
crossfades cannot substitute for those claims.

## Typed enforcement

The semantic-to-visual seam must use a closed material-action family with
stable source, destination, binding, branch, value, and continuation IDs.
Every source material ID needs exactly one disposition: continue, transform,
duplicate with explicit provenance, or withdraw for a named reason. Every
destination material ID must be accounted for. Validation rejects unknown IDs,
unaccounted material, duplicate ownership, and endpoint text that cannot be
reconstructed from the typed tokens.

Types prevent semantic substitution and incomplete material ledgers. They do
not certify choreography, pacing, legibility, or taste; those remain the early
human checkpoint.

## CodeMirror boundary

CodeMirror is an editing and settled presentation surface, not semantic
animation authority.

The dependency direction is:

```text
source document
-> identified syntax tree
-> semantic transform or interpreter trace
-> pedagogical score
-> certified code-material transition
-> CodeMirror / lesson / export adapter
```

CodeMirror may own input, Vim commands, completion, diagnostics, selection,
search, accessible settled text, viewport lifecycle, endpoint measurement,
and one atomic undoable commit. It must not own semantic identity, per-frame
animation state, or the pedagogical transformation. Intermediate animation
frames do not enter CodeMirror history and do not dispatch document changes on
every frame.

An eventual editor adapter should measure the valid before and after states,
let one inert overlay own affected material during motion, and commit the final
source in one annotated transaction. Explanatory playback remains
non-destructive; an invoked semantic edit becomes one undoable transaction.
KP also retains a durable semantic transformation log because CodeMirror
history records text changes, not their semantic cause, correspondence,
material behavior, or pedagogical explanation.

Invalid or concurrently edited source cancels or recompiles a pending
animation from the latest valid revision. User code executes only through a
bounded interpreter or worker, never unrestricted JavaScript evaluation.
CodeMirror remains lazily loaded outside learner publication routes.

## Preservation and promotion boundary

Preserve the factorial parser, bounded evaluator, frozen trace, pedagogical
score, shared clock, URL restoration, static publication, accessibility, and
the existing lambda lesson. The first correction may replace only the
factorial presentation of the first expansion. Its rollback unit is the new
factorial-local code-material transition and renderer branch.

Do not connect this exemplar to CodeMirror, generalize it across Scheme,
rewrite later factorial beats, or promote a shared code-animation renderer
before the first expansion passes human review and a structurally different
second caller proves the boundary.
