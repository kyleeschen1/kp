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

New editions, promotion browsers and final release remain separate checks;
do not infer those results from these two Chromium cohorts.
