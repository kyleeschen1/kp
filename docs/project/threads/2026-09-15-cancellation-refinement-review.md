# Expandable cancellation: visual checkpoint

Review the opt-in exemplar at:

http://localhost:8000/experiments/mechanics-relations/?derivation-detail=expandable#energy-from-momentum

The shared server remains localhost-only. Phone presentation remains provisional.
Default desktop behavior is unchanged; this candidate is not promoted.

## What to review

In the final compact transition, choose **Inspect smaller steps**. The four-state
record becomes six states: expose the denominator's two mass factors, cancel one
nonzero numerator/denominator pair to 1, then collect the coefficient into 2m.
Use the existing local entries or drag the lens forward and backward. Choose
**Return to compact step** to restore the prior compact transition, held progress,
open explanations, and the expansion anchor's viewport offset. Focus returns to
the expansion button. Fine percentages are not treated as coarse percentages.

Judge whether these smaller steps clarify why one mass remains, whether the
working expression retains sufficient context, and whether expand/collapse feels
like opening detail in the same argument. In particular, the explicit identity
state and the inherited ink-rewrite treatment need human judgment. Correct
endpoints and a functioning control do not establish explanatory effectiveness.

## Authority and preservation

Canonical article: `examples/physics/momentum-energy.article.md`; canonical host:
the URL above. The physics-owned checked positive-mass derivation issues bounded
fine-step authority. The existing governed energy compiler lowers it into the
existing native KaTeX energy session/compositor. No renderer, CSS, dependency,
global store, alternative clock, or generic animation fallback was introduced.

The squared momentum norm persists through all three moves. The surviving mass
factor has persistent correspondence in cancellation and coefficient collection.
Outer source/destination equations remain exactly those of the compact step;
the original first two moves remain intact. Scalar normalization does not confer
rewrite authority over vectors. This is a bounded physics derivation, not a
general cancellation solver, reusable refinement framework, or source-only
authoring demonstration. Domain/compiler and reader edits were necessary.

Only one reader clock/compositor is active. Coarse and fine views have distinct
revision boundaries. Optional-view failure restores the checked compact view;
preflight rejects missing transitions before allocating listeners or a clock,
and disposal is idempotent. No-JavaScript readers can open ordinary static detail.
The default enhanced reader does not allocate a saved clone for this experiment.

## Executed evidence

- `node --disable-warning=ExperimentalWarning --test tests/momentum-energy.test.ts`:
  23 passing checks, including bounded authority, endpoint identity, persistent
  roles, immutable bookmark snapshots, and five-transition navigation boundaries.
- `npm run typecheck`: passed, including Svelte and domain checks. Final test-only
  additions are also checked with `npm run typecheck:tests`.
- `npm run check:architecture`: passed, including eight gateway checks.
- `npm run build:bundle`: passed; repository-wide large-chunk advisory remains.
- `npm run visual:mechanics-relations -- --grep 'expandable cancellation|unavailable refinement|source-owned static|contextual inspection|local provenance|local entry'`:
  six Chromium checks passed. They cover fine forward/reverse inspection,
  exact compact restoration, deliberate failure recovery, existing contextual
  inspection/provenance/local access, and no-JavaScript detail plus print reading.
  The canonical capture is produced by the first test; captures are disposable,
  not approved goldens or reusable mechanism certification.

Earlier checks caught a literal-three transition-count type assumption (repaired
with validated numeric bounds), then double disposal on malformed fine input
(repaired with preflight and idempotent lifecycle). An initial cohort also had a
dev-server connection reset. The entire six-check cohort was rerun successfully,
not merely the previously passing subset. No full repository test suite or new
cross-browser/mobile certification was run for this unapproved visual treatment.

`npm run measure:mechanics-relations-closure`, after the production build:
34,803 initial / 138,597 activated JS/CSS gzip bytes, versus accepted baseline
34,029 / 136,898: increases of 774 / 1,699 bytes. Additional activation is 103,794
bytes. These exclude HTML, fonts, images and device execution/paint cost.
`wc -c dist/experiments/mechanics-relations/index.html` gives 300,234 HTML bytes;
`gzip -c dist/experiments/mechanics-relations/index.html | wc -c` gives 21,167 bytes.
That is the total current HTML, not an incremental baseline comparison. The inert
fine-view templates add markup and should be reconsidered before broad rollout.

## Resume boundary

Theseus contract `run-contract.kp.reader-cancellation-refinement-v1` alone owns
live slice status. Stop for this canonical visual judgment; do not infer approval
of phone work, the broader six-loop horizon, or catalogue-wide generalization.
The semantic rollback boundary is commit `11ca3656b`; the subsequent view/checkpoint
commit is independently reversible. On approval, close this checkpoint and choose
the bounded second-caller/source-only authoring test from the accepted sequence.

Resume with `theseus work context next-action.kp.relational-reader --mode brief`.
The reviewed scope remains in `../reviews/2026-09-15-next-step-review.md`.
