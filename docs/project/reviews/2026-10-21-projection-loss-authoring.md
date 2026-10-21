# Projection information-loss authoring trial

Scope: [approved source reuse trial](../2026-10-21-projection-loss-authoring.md).
Candidate, not human-accepted or promoted. Live preview:
<http://localhost:8000/experiments/matrix-column-combinations/?input=projection-loss>.

## What was authored and what changed

The complete teaching source is
`content/authoring/linear-algebra/projection-loss.ts`. A = [[1,0],[0,0]] acts on
the columns of B = [[3,3],[2,-1]]. Each result is [3,0]. The text explains the
zero contribution, the general retained/lost-coordinate distinction, and why
reversing a stored animation is not an inverse map. Its transfer check contrasts
[3,7] with [4,2], preserving the distinction between losing some information and
losing everything. Editorial quality and transfer efficacy are unmeasured.

The numerical source compiled and projected on the first attempt. It required
no semantic model, math operation, correspondence, renderer, CSS, motion, timing
or clock changes. This is reuse of the accepted local column-combination player,
not a new canonical-native compositor certification or a portable Article.

It was **not** entirely source-only authoring: the host hardcoded generic text
and repeated source IDs in its menu. The bounded repair adds optional plain-text
`ColumnReading` to the existing projection owner and derives navigation from
one source registry. It cannot alter the seven milestone IDs or their order.
The authored source supplies per-column cues, title, introduction, conclusion
and question/answer. Future callers within this exact presentation can use those
slots without host edits. This is not an arbitrary story, proof or animation API.

TypeScript requires every existing cue and rejects incomplete cue records.
The shared HTML encoder protects inserted editorial text; title/introduction use
`textContent`, and URL values are encoded. Mathematical identity remains with
the immutable product: equal values in different input/output cells retain
distinct identities, while their contribution references are shared correctly.
The no-script notice now states that selected matrices require JavaScript,
instead of presenting the original example's values for every query.

## Cost and limits

One authored source, a small optional editorial type and additive host markup;
no new library, runtime scheduler, paint mechanism or per-frame data processing.
The production source-registry chunk is approximately 3.00 kB raw / 1.45 kB gzip
(includes the existing three numeric inputs, not an incremental delta).
The host now loads that registry for its menu even on the original route.
This bounded trial does not establish economical loading of a large catalogue.

Desktop capture shows the cue above the unchanged stage with a complete argument
below. Phone capture retains the existing horizontally scrollable stage; the
right edge is initially outside the visible panel. No viewport overflow fix,
redesign or typography shrink is claimed. The active card itself fits the phone
height, while surrounding prose uses normal document scrolling.

The largest remaining authoring limits are substantive: a fixed seven-step
sequence, navigation that reloads between columns, prose manually tied to values,
no selectable geometric interpretation, and no source-specific static edition.
The semantic product is reusable; this trial does not prove unrestricted
composability of teaching sequences. A concise source is not evidence that the
resulting explanation is useful.

## Verification and review

- `npm run test:matrix-interpretations`: 20 pass, including both outputs, retained
  contribution identities, distinct equal-valued cells and the changed-input check.
- `npm run test:semantic-cost`: 23 pass; this is the semantic/unsupported-input
  unit cohort, not a new many-card runtime benchmark.
- `npm run typecheck`: all app, Node, test, Svelte and domain checks pass.
- `npm run build:matrix-interpretations`: production build passes.
- Focused Chromium candidate, accepted continuity and signed source checks: 3 pass.
  The initial run failed only on the test's `noscript` parent text query;
  Playwright excludes that parent from its text matcher. Querying its paragraph
  proves the actual visible no-script notice and absence of a mounted player.
  Motion and source checks passed on that initial run. Exact rerun passes.
- `npm run visual:matrix-interpretations`: all 15 Chromium checks pass, including
  the original scene, all three numerical inputs, identity, orthonormality, shared
  menu/configuration, both themes, reduced motion and this authored explanation.
  No full repository unit rerun or three-engine aesthetic certification during
  this bounded trial; no renderer/math owner changed.

Inspect Result column 1 through its zero contribution, then select Result column
2 and repeat. Ask whether the inherited animation makes the loss of the second
coordinate easier to understand than the static sum. Is the switching burden
small enough to support the comparison? Is the distinction between reverse
playback and mathematical inversion clear? These are human judgments, not facts
established by the automated checks.

The review package is intentionally the stopping point. The repository's
exemplar-first instructions and KP delivery skill require an exemplar review
before wider generalization. Existing layouts and unrelated work are preserved.

Outcome: **HUMAN_CHECKPOINT**, source and exemplar packages complete, review
pending in `run-contract.kp.projection-loss-authoring-v1`. Next-session context:
`theseus work context task.kp.projection-loss-authoring --mode working`.
