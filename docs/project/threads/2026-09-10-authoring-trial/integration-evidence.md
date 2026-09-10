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

Readings/practice, new editions, promotion browsers and final release remain
separate checks; do not infer those results from this Apply cohort.
