# A comment emerging from its mathematical subject

Outcome: HUMAN_CHECKPOINT. One candidate in the fraction notebook, not a
catalogue-wide change.

Open http://127.0.0.1:8000/experiments/fraction-notebook/?reading=1 and scroll
past subtraction to the passage beginning “On the left, adding three…”. A
fine bracket gathers the left-side additive inverses. A shallow shadow signals
the incoming comment; the prose rises and grows to ordinary size, then holds
still for reading. Its connector retracts before cancellation, and the settled
prose remains in place during the mathematical action. Reverse the scroll to
retrace the handoff. Judge the sense of origin, approach distance, text scale,
reading interval and subtlety of the precursor. Other passages retain their
existing presentation.

The canonical artifact is
`content/authoring/algebra/fractional-linear-reasoning.article.md`, hosted in
`/reader/fraction-notebook-preview/`. Its semantic asset and native
KaTeX/material compositor remain authoritative. The source paragraph remains
searchable and available to accessibility, selection and Read all; the visual
annotation is hidden from assistive technology to avoid duplication. The local
binding references the exact `after-subtract.lhs.plus3` and `lhs.minus3`
selectors and reads the notebook's actual paragraph, including edits.

The existing document playhead owns every sample. Anchor geometry is measured
at invalidation and reused during approach; no extra animation clock or math
clone is introduced. Once detached, the comment is ordinary settled prose and
direct seeks require no previously cached source geometry. Unsupported multiple
or downward comments fail with a typed repair gap. Promotion requires human
acceptance followed by a structurally different caller.

The first browser check exposed a rounded-checkpoint defect: reader progress
167 was interpreted as slightly inside the next mathematical phase instead of
the exact one-sixth endpoint. The fractional descriptor now uses the existing
authored-algebra piecewise checkpoint mapping, extracted into one helper. Unit
checks cover exact endpoints, continuous interiors and invalid inputs. Native
endpoint validation remains mandatory for attached commentary.

Focused verification passed and is recorded with the Theseus task:

- `npm run typecheck:fraction-notebook`.
- `node --disable-warning=ExperimentalWarning --test tests/fraction-notebook-object-comment.test.ts tests/fractional-rising-scroll.test.ts tests/fraction-notebook.test.ts tests/document-reading-attention.test.ts tests/anchored-algebra.test.ts` — 35 tests.
- `npm run visual:fraction-object-comment -- --project=firefox`: desktop/phone,
  exact subject ownership, reverse, direct entry during cancellation, settled
  text bounds, reduced motion and no annotation repair gaps (four cases).
- `npm run visual:fraction-ridge`: baseline ridge and mathematical motion (two cases).

Discovery also encountered one Vite-restart startup failure and subpixel scroll
rounding exactly at an arrival boundary. Samples now inspect inside the settled
interval; unit checks retain exact boundary assertions. The broad app TypeScript
command reports the existing missing Node types for `object-compile.ts`'s
`node:crypto` import; the notebook configuration includes those types.
An additional app diagnostic with explicit `--types vite/client,node` instead
reports the existing browser/Node timer mismatch in
`src/experiments/canonical-animation-review.ts:342`. Neither unrelated file was
changed; this candidate does not claim a passing repository-wide typecheck.

The binding and optional presentation can be removed independently of the
checkpoint correction. No shared authoring schema, saved JSON, mathematical
content or catalogue treatment has been migrated. Timing and appearance remain
provisional until human review.
