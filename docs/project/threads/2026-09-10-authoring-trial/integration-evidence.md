# Authored-source integration evidence

This record adds executed integration evidence to `initial-results.md`; it does
not change the frozen authoring outcomes. Theseus owns per-slice status.

## Actual Apply, controls and rejected drafts

`npm run visual:composed-algebra -- --grep 'authoring trial Apply'`:
**5 passed**, Chromium, 56.9 seconds. All five explicitly selected attempts
mount through the existing shared localhost:8000 Focus Card. Assertions cover
source revision/title, three slots, two visibly non-instant adjacent transitions,
exact native state IDs, reverse keyboard navigation, direct interior seeking,
all three deliberately rejected drafts preserving displayed revision/position,
download of displayed source rather than the invalid editor draft, disposal of
staging nodes and no page errors. Five positions per source are captured by the
stable command; screenshots are disposable, not goldens or approval evidence.

The primary reviewed the first case's settled middle-state capture for basic
readability; human pedagogical/motion acceptance is still pending. These checks
are not a new continuous-time compositor certification or physical Safari test.

`npm run test:composed-algebra-authoring`: **51 passed**, no skips/failures.
`npm run typecheck`: full app/node/test/Svelte/domain check passed; Svelte zero
errors/warnings. `git diff --check` passed. No production `src` or `domains`
changes relative to the frozen task commit `ba83999a5`.

## Readings, prompts and exact return

`npm run visual:composed-algebra -- --grep 'authoring trial projections'`:
**5 passed**, Chromium, 22.5 seconds. Full and Compact preserve all three exact
authored LaTeX strings and the displayed revision. Both prompt answers match
the selected source; returning restores step 1.37 and keyboard focus, with no
page errors. The paused intermediate capture intentionally contains in-flight
ink and horizontally traveling passages; it is not a settled-state golden.

`npm run test:composed-algebra-authoring`: **56 passed**, including five new
projection checks for exact facts, source/revision references, prompt answers
and rejection of another case's return position. Full `npm run typecheck`
passes again, with zero Svelte errors/warnings. No production changes.

## Immutable local editions

For each of the five exact source paths in `editions.json`, both commands pass:

```sh
npm run author:composed-algebra-publication -- --source <exact-source-path>
npm run author:composed-algebra-publication -- --source <exact-source-path> --check
```

These ten invocations build/reproduce immutable local bytes, not deployed or
animated editions. The manifest records source/revision digests and current
inspection URLs; reproducible commands, not the disposable output directories,
own durable evidence. Original primary/product editions also remain unchanged.

`npm run visual:composed-algebra -- --grep 'authoring trial editions'`:
**1 passed**, Chromium, 11.8 seconds, covering all five editions with JavaScript
disabled at 390px. Each has the exact title and revision, eight math fragments,
no animation scrubber, exact original source bytes and no horizontal overflow.

`npm run test:composed-algebra-authoring`: **61 passed**, including five new
publication provenance/reproduction checks and rejection of another case's
source. Full `npm run typecheck` passes, zero Svelte errors/warnings.

Supported-browser promotion and the full release suite remain after the human
checkpoint. Eleven trial Chromium tests have passed so far: five Apply/control,
five projection and one five-edition test. Two additional retained-caller browser
baselines passed earlier. No production source or domain changes were needed.

## Batched human-review boundary

The final combined `npm run visual:composed-algebra -- --grep 'authoring trial'`
passes **11/11** in Chromium (1.1 minutes), reproducing all trial captures and
integration assertions together. This is a rerun of the above tests, not eleven
additional independent cases. Complete original-report replay also passes.
The direct case-one JSON link on localhost:8000 was fetched successfully, and
the canonical page/static edition URLs were exercised by the browser command.
No code changed after the s16 full typecheck. Human acceptance remains pending;
see `../../reviews/2026-09-10-unfamiliar-authoring-visual-checkpoint.md`.
