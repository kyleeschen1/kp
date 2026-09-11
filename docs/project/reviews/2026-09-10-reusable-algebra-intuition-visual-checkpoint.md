# Reusable algebra intuition: visual checkpoint

Outcome: accepted by the user with “It passes!”, followed by “resume”.
The HUMAN_CHECKPOINT below is historical inspection evidence, not an active stop.
Contract: `run-contract.kp.reusable-algebra-intuition-v2`.
Fourteen of 27 slices are complete. The fifteenth slice, s12, has prepared the
review but awaits human acceptance. Do not begin s13 before that acceptance.

## Inspect on the shared server

- Primary: <http://localhost:8000/experiments/reusable-reasoning/?example=algebra-intuition>
- Collect: <http://localhost:8000/experiments/reusable-reasoning/?example=algebra-intuition&intuition=collect>
- Distribute: <http://localhost:8000/experiments/reusable-reasoning/?example=algebra-intuition&intuition=distribute>

The primary asks “How do we regroup without losing any contributions?” It has
five stops: repeated groups, factored counts, evaluated count, distributed
products, evaluated constant product. Both smaller questions have three local
stops, their own setup/answer/assumptions, and exact return to the parent position.
Arrows animate between stops; the slider and passage preserve continuous control.
Apply checks edited JSON before publishing one fully prepared native revision.

Please judge the factoring/distribution motion, crisp evaluation, passage and
fraction legibility, and whether the questions communicate an intuition rather
than merely list algebra steps. Open each smaller question and return midway
through the parent. One editorial review point: the distribution opening retains
the parent's “two copies and three copies” narration; its setup supplies context,
but an independent opening may be clearer. Automated checks do not decide this.

## Canonical ownership and preservation

Artifact: `src/authoring/examples/composed-algebra-intuition.json`. Host: the
opt-in reusable-reasoning experiment above. Renderer: the existing chrome-free
canonical native KaTeX session and shared Focus Card controller. Semantic truth:
the checked, source-bound v2 chain of issued factoring, contextual sum,
distribution and contextual product proofs—not labels or animation geometry.

The whole/member handoff changes selector views without introducing a sixth
state or extra motion phase. Actual native leaf paint must agree across that
handoff. Existing factoring, distribution and ink-glyph evaluation owners remain
in charge; no generic fallback or independent animation pipeline was introduced.
The original three-stop composed-algebra route remains preserved. Reversal units
are the independently committed slices; do not roll back semantic authoring to
repair an editorial or presentation defect.

Implementation commits run from `cbe23ee5b` through `9585abc23`; the latter
completes independent readings and exact return. Theseus owns per-slice evidence.

## Executed verification

- `npm run test:composed-algebra-authoring`: 92 passing tests.
- `npm run typecheck`: complete app, tooling, tests, Svelte and domain checks.
- `npm run visual:composed-algebra -- --grep 'independent algebra questions|question-oriented primary edits'`: two Chromium checks, including direct entry, revision rejection, source edits and exact return.
- `npm run visual:composed-algebra -- --grep 'question-oriented checkpoint stays|complete algebra native handoff canary|primary combined review at 1280px'`: three passing Chromium checks; phone layout, real native handoff and legacy desktop preservation.
- Native handoff, transition continuity and transit-corridor unit cohort: 15 passing checks. Existing canonical factoring/evaluation paint checks also pass.

The handoff probe was corrected to compare visible ink rather than glyph line
boxes; the earlier apparent offset was not evidence of a visual regression.
An injected four-pixel member distortion is rejected. One transient server
connection-reset run failed and the stable checks subsequently passed without
starting another server. Disposable captures are not release goldens.

## Limits and continuation

This is bounded scalar algebra, not arbitrary LaTeX deduction generation. Prose
remains editorial. Edited-revision links require matching source bytes; they do
not persist custom documents on reload. New-chain Full/Compact, practice and
static publication are still later work, not delivered by the legacy versions.
No learning/retention or competitive advantage has been demonstrated. The full
supported-browser cohort, including Safari gestures, and broad release/budget
checks are intentionally deferred until after visual acceptance.

The sole plan remains
`../threads/2026-09-10-reusable-algebra-intuition-approved-loop.md`. After approval:
pressure the same pipeline with the shorter source-only second caller, repair
demonstrated shared gaps, integrate authoring/projections/publication, then run
promotion and release checks. This checkpoint does not authorize another motif
or a universal question schema.

Resume with `theseus work resume`, then
`theseus work start next-action.kp.reusable-algebra-intuition --mode brief`.
Record the user's visual acceptance, restore the blocked contract to ready, and
complete s12 before starting s13. Without acceptance, retain HUMAN_CHECKPOINT.
