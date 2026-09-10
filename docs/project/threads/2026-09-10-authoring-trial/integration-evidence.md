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

## Accepted-set browser promotion

The user accepted the s17 packet with “it works!” on 2026-09-10. Earlier
pending-review statements above describe the evidence at those boundaries.
`npm run visual:composed-algebra:cohort`: **111 passed**, 7.9 minutes:
37 each in Chromium, Firefox and WebKit, zero failures. This includes 48 trial
checks (16 per browser) and 63 retained primary/product checks. The five added
trial checks use 390px, reduced motion, adjacent keyboard forward/reverse,
native state/count agreement, header/passage separation, no horizontal overflow,
and direct interior seek/reverse with unchanged source revision and no page errors.
No new treatment or production code was needed. Automated WebKit is not a
physical Safari touch/trackpad test or learner-comprehension evidence.

Full `npm run typecheck` passes, Svelte zero errors/warnings; focused authoring
suite passes 61 tests; all 11 original attempts replay exactly. Complete
compositor source cost is unchanged at 562,416 / 575,000 bytes, 33 / 34 modules.
Release preflight reports the generated reachability inventory stale after new
test/tool files; diagnose and refresh only verified inventory bookkeeping at
the release slice. No gate has been waived.

## Release preservation checks

`npm run build` passes full app/node/test/Svelte/domain types, economics/tax
publication freshness and production bundling. The existing over-500-kB chunk
advisory remains unchanged. Both `npm run check:reader-budgets` and
`npm run check:reader-production` pass all twelve routes; shared equation-reader
runtime remains 142,144 gzip bytes against 145,000. Diagnostic isolation passes
`check:dev-review-production` (461 files, 12 markers) and
`check:native-katex-compositor-conformance-production` (9 markers).

All five sources named in `editions.json` reproduce with the exact
`author:composed-algebra-publication -- --source <path> --check` command. The
retained composed primary/product and common-factor primary/numeric editions
also reproduce through their existing scoped publication commands: nine checks,
not nine new authoring cases. `check:composed-algebra-workflow` passes both
retained scripted callers. All eleven original reports replay unchanged.

The stale reachability preflight was repaired with the existing generator:
`npm run generate:equation-reachability`, then `npm run check:equation-reachability`.
The sole generated delta is `scannedFileCount` 4,579 → 4,583, accounting for
the trial runner, two test files and one test fixture. All 68 roots and graph
edges are unchanged. This generated metadata under `src/architecture` is not
an engine intervention; no schema, semantic, renderer, layout, clock or motif
implementation changed. No limit or consumer set was relaxed.

Full-suite pre-gates pass unchanged: core inference 114,668 types / 196,324
instantiations; combined 173,243 / 288,463, plus architecture/catalogue/promotion
checks. Full `npm test` passes **6,972 tests**, zero failures, cancellations,
skips or todos; 644,822.671 ms. This is the final full execution, not a count
assembled from repeated focused runs. `git diff --check` also passes.

## Resume-capsule budget fallback (historical checkpoint detail)

Post-checkpoint handoff verification found `theseus work resume` fails with
1,632 tokens against the package's fixed 1,200 limit. `--limit 1` still reports
1,632; `--after event.activated.workflow.kp.delivery.20260910193356456.dj5.1`
reports 1,666. The package capsule builder limits only delta events with the
event limit, not all included capsules. These are tool-output estimates, not
model-billed tokens. No task source or rendering failure is implicated.

`theseus work resume --scope kp` exits zero but selects historical scoped v24
state rather than this new unscoped contract; it is not an acceptable current-run
handoff. The exact bounded alternative passes:

```sh
theseus work context next-action.kp.unfamiliar-supported-authoring --mode brief
```

Follow it with the named visual checkpoint document and existing contract. This
retains the deferred human verdict and s18–s20 boundary without clearing history,
omitting a critical stop, widening budgets or changing the Theseus package.
Standing budget-repair autonomy allowed this local handoff repair. A general
capsule/scoping fix belongs to the owning Theseus project if separately taken up;
it is not secretly included in the KP authoring trial or treated as fixed here.
