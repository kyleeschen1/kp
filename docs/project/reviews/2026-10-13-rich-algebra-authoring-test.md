# Rich algebra: source-only authoring test

The user accepted the small distribute/collect visual but correctly questioned
its novelty. Its run is closed. This approved follow-up tests the richer existing
`3(x+2)+2(x-1) → 5x+4` lesson against an explicit authoring threshold; it does not
authorize rebuilding that lesson or polishing another demonstration.

## Contract

Beneficiary: an author who wants to change mathematical content and choose an
explanation without changing engine code. Success means a meaningful changed
expression and a changed explanation reach the existing compiler and canonical
host with zero renderer, motion, or host edits. A reproducible negative result
with the exact missing boundary also completes this diagnostic test.

Canonical reference: `content/lessons/foldable-distribution.md`, asset
`animation.foldable-distribution.collect-like-terms`, host
`/reader/foldable-distribution/`, native KaTeX canonical equation session.
Semantic authority: the foldable-distribution structured expression chain and
operation certificates. Preserve all of these unchanged during the test.

One package: execute baseline, shorter checkpoint selection, mathematical
variation `4(y+1)+3(y-2) → 7y-2`, and attempted operation-order change through the
existing lesson compiler. Keep intended source separate from actual compiled
math. Do not treat edited prose or a successful compile as mathematical reuse.
Compare the compiler's animation with the browser descriptor's animation too.

Deliver a repeatable local command, fixed inputs, executable regression tests,
and a concise findings record. Typed diagnostic results belong to the test
harness, not a new authoring schema or production API. No geometry, timings,
renderer, source-fixture parameterization, or new host. Tests and report are the
rollback unit. Verification: scoped Node tests, affected Node/test types and
Theseus validation. No new aesthetic means no additional visual approval gate.

Stop when the threshold is measured. If source-only reuse fails, name the
smallest responsible implementation boundary and leave it as a recommendation;
do not hide the failed baseline by first rewriting the engine.

## Executed result

**The source-only authoring threshold is not met.** Run
`npm run check:rich-algebra-authoring` to reproduce the four fixed requests and
actual compiled endpoints. `npm run test:rich-algebra-authoring` preserves the
distinction between a successful compilation and a successful authoring task.

| Request | Result | What actually changed |
| --- | --- | --- |
| Existing expression and six stops | Matches | Narration reaches the transcript; semantic and native equations retain the baseline. |
| Three-stop explanation | Matches | Six reader checkpoints become three; all seven operations and five native scenes remain. |
| `4(y+1)+3(y-2) → 7y-2` | Mathematical repair gap | Prose changes, but both semantic endpoints and native output retain `3(x+2)+2(x-1) → 5x+4`. |
| Group before evaluating products | Operation-order repair gap | Authored checkpoint order changes, but the animation's phase order remains unchanged. |

The harness requests are test intentions, **not a newly implemented source API**.
The real compiler receives supported Markdown with a pinned animation reference.
It has no mathematical-expression input slot. Putting different mathematics in
prose is not a valid way to replace a pinned asset, and its refusal to replace
the asset is not a renderer bug. Successful Markdown compilation cannot establish
that the requested mathematical problem was authored. The probe returns explicit
diagnostic gaps instead of reporting that as successful reuse.

Likewise, rearranging existing checkpoints is not a valid new proof: the existing
grouped state already contains evaluated products. Grouping earlier needs a new
checked intermediate state. The compiler currently accepts the editorial change
without changing the mathematical timeline; this trial does not publish that
misaligned candidate or claim it is a usable lesson.

## Exact missing boundary and recommendation

Mathematical content is embedded in several owners:

1. `foldable-distribution-expression-chain.ts` fixes the expression trees and
   expected normal form; `foldable-distribution-operation-certificates.ts` fixes
   operands, results and correspondence bindings.
2. `foldable-distribution-endpoint-spec.ts` independently fixes native token
   spellings, groups and labels.
3. `foldable-distribution-lesson-model.ts` fixes the raw-product reading and
   accessible checkpoint labels.
4. The browser's `equation-lesson-descriptors/foldable-distribution.ts` reconstructs
   the same fixed asset instead of consuming an authored derivation revision.

The immediate target should be **one checked derivation feeding those existing
projections**, starting with the same two-affine-products structure. First replace
duplicated mathematical content with a bounded semantic source and derive native
notation/static readings from it. Then pass the same revision to the existing
browser owner. Keep current motifs and default outputs. Only after that succeeds
should a different valid proof order pressure composition; do not conflate shorter
explanation selection with changed mathematical execution.

The meaningful variation above should stay fixed as the next acceptance case,
including its negative final constant. Do not substitute another easy coefficient
rename. That implementation is a recommendation, not completed by this test.

## Evidence and limits

No application, semantic, renderer, motion or host files changed. The only new
runtime is a local diagnostic script; it adds no browser payload. The script
executes the real lesson and native-scene compilers and compares their animation
with the browser descriptor's reconstruction. It does not run a browser, measure
perceptual quality, or benchmark a live LLM.

The initial harness accidentally selected the unsigned sum/product parser for
signed notation, causing two test failures. The corrected harness compares exact
fixture notation modulo whitespace and catches compiler errors only around the
compiler calls. It does not infer algebraic equivalence or mislabel its own
comparison errors as a product failure. Seven focused tests then pass, including
the existing native-scene compilation tests. Node and test type checks are the
affected projects; no production build or visual recertification is warranted for
this diagnostic-only change. The impact selector has no focused rule for this new
script and defaults to promotion-wide checks; this run uses its agreed scoped gate.
