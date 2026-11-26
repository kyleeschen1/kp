# A nearby tooltip with a returning scroll passage

Outcome: HUMAN_CHECKPOINT. One candidate in the fraction notebook, not a
catalogue-wide change.

Open http://127.0.0.1:8000/experiments/fraction-notebook/?reading=1#beat.cancel-additive.
The bookmark restores the additive-inverse source state and its tooltip.
The comment sits 16 CSS pixels above its subjects, with a short connector and
only a small reveal rather than the previous long ascent. Scroll onward: the
tooltip withdraws before cancellation and its original paragraph scrolls up the
document. Scroll back, use the existing “See what remains” outline entry, or
reopen the bookmark to return to the same explanation. Judge proximity, reading
comfort and the return from prose to tooltip. Other passages retain their
existing presentation. This revision supersedes the elevated comment shelf.

The canonical artifact is
`content/authoring/algebra/fractional-linear-reasoning.article.md`, hosted in
`/reader/fraction-notebook-preview/`. Its semantic asset and native
KaTeX/material compositor remain authoritative. The source paragraph remains
searchable and available to accessibility, selection and Read all; the visual
annotation is hidden from assistive technology to avoid duplication. The local
binding references the exact `after-subtract.lhs.plus3` and `lhs.minus3`
selectors and reads the notebook's actual paragraph, including edits.

The existing document playhead owns every sample. Anchor geometry is measured
at invalidation and reused during the tooltip; no extra clock or math clone is
introduced. Outside the tooltip window the original paragraph is visible and
travels normally, retaining its authored ID and reserved scroll distance. The
detached overlay and permanent source-prose suppression have been removed.
The notebook forwards its initial fragment to the existing reader navigation;
no separate bookmark model is introduced. Unsupported multiple or downward
comments fail with a typed repair gap. Promotion requires human acceptance
followed by a structurally different caller.

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
  exact subject ownership, reverse, passage bookmark and outline return,
  near-object clearance, actual prose scrolling, reduced motion, Read all and
  no annotation repair gaps (four cases).
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

The prior broad app checks described above were not rerun for this presentation revision.
The binding and optional presentation can be removed independently of the
checkpoint correction. No shared authoring schema, saved JSON, mathematical
content or catalogue treatment has been migrated. Timing and appearance remain
provisional until human review.
