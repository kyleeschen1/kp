# Mechanics architecture readiness: bounded assessment

Status: assessment complete; recommended repairs are not yet implemented.
This is an independent source-based engineering assessment, not a Theseus-generated
report card. It resumes priority 3 after the completed gradient delivery; priority
4 (retroactive repair) supplies acceptance criteria. It does not start a new loop.

## Git boundary

The user requested continuing with appropriate Git hygiene. The worktree at
`ac579dec5` was clean. Created
`feature/20260912-mechanics-architecture-readiness` from that verified tip.
Retained `feature/20260907-reusable-reasoning` and every other branch/worktree.
`main` is an ancestor, 391 commits behind that tip. No merge, push, deletion,
prune, reset or history rewrite was performed. This is a stacked task branch,
not a claim that the preceding delivery series has been integrated into main.
The generic Git skill assumes `branch:*` helpers and `dev`; neither exists here.
A separate integration decision should address the accumulated history later.

## Executive assessment

- Keep the semantic/rendering architecture. The gradient source checker produces
  one branded lesson; the stage, sequence and numerical explanation share its
  checked model. Another universal authoring framework is not the next blocker.
- Shared card chrome, typography, keyboard, native input and checkpoint playback
  are real reusable owners. A shared stylesheet does not by itself guarantee
  complete static packaging or universal layout inheritance.
- Fix static dependency completeness first. Three edition builders snapshot a
  manually selected stylesheet list that omits a new transitive import.
- Preserve the distinction between source/semantic identity, editorial identity,
  and exact edition bytes. Gradient preview pins are intentionally narrower than
  immutable publication; do not market them as archival explanation revisions.
- Do one bounded repairability pass, then the first mechanics investigation.
  Extract new shared APIs only where actual callers demonstrate the boundary.

## Report card

| Inspected area | Grade | Confidence | Evidence and main risk | Next action |
| --- | --- | --- | --- | --- |
| Gradient semantic ownership | B+ | High | `gradient-contour-authoring.ts` brands validated model/sequence/stage; supported pedagogy is narrower than valid mathematics | Preserve the boundary; introduce mechanics-specific assumptions explicitly |
| Shared card ownership | B | High | `focus-deck-scaffold.ts`, shared CSS, keyboard/input/checkpoint modules; gradient still reparents narrative and builds comparison DOM locally | Do not copy the complete gradient entry into a mechanics card; test a second caller before promoting local composition |
| Static dependency delivery | C | High for missing dependency; visual effect not measured | Three edition builders manually copy scaffold CSS but omit its imported typography CSS | Derive and validate the local asset dependency closure, fail on missing dependencies |
| Revision and edition semantics | B | Medium | Gradient source/main-story hash versus independently generated reading; immutable writer hashes actual file manifest | State separate contracts for mutable preview, explanation revision and edition identity |
| Verification coherence | B- | High within inspected gates | Existing tests pass despite incomplete CSS closure; two legacy budget checks conflict with current build/policy ownership | Add dependency-completeness regression; reconcile budget owners without silently raising ceilings |

These are scoped grades, not a security audit or a score for every renderer.

## Findings and proposed repairs

### 1. Static styles can be shared in source but missing from an edition

`src/experiments/authored-focus-card.css` imports the shared scaffold.
`src/tutorial/focus-deck-scaffold.css` imports `./focus-deck-typography.css`.
The copy lists in `scripts/build-bayesian-edition.ts`,
`scripts/build-common-factor-edition.ts`, and
`scripts/build-composed-algebra-edition.ts` include the scaffold but not the
typography file. The resulting relative import has no packaged target. Existing
publication tests verify selected bytes and immutability, not complete CSS asset
reachability. This is confirmed from source; the perceptual effect on each static
projection has not been browser-measured and may be limited where selectors do
not match static markup.

Recommended repair: reuse existing dependency/packaging machinery if suitable;
otherwise introduce a narrowly scoped local CSS asset collector for these real
callers. Traverse supported imports and local URL dependencies deterministically,
preserve directory relationships, deduplicate, reject missing/unsupported targets,
and retain bounded paths/symlink safety. Do not merely add the missing filename
to three lists. Feed the resulting bytes into the existing immutable edition
writer, not a second publication framework.

Acceptance: nested typography imports and font URLs resolve inside each edition;
a missing nested dependency fails generation; a shared style change creates a new
edition identity while old bytes remain unchanged; domains retain their own
publication compilers. Verify two structurally different callers and then all
three affected builders. A packaging fix does not authorize new visual styling.

### 2. Retroactive repair needs an explicit compatibility contract

`scripts/immutable-local-edition.ts` hashes a sorted file manifest and rejects
changed existing files. This is the right immutable-output boundary. A style-only
change can create a new edition directory while retaining the same semantic
revision: those are different identities, not a contradiction.

`gradient-contour-authoring.ts` hashes source, main beats and comparison reading.
`gradient-contour-readings.ts` separately generates full/tangent Article text and
reports that lesson revision. An edit solely to that projector need not change
the preview pin. The prior closeout explicitly discloses this behavior; it is not
an undisclosed failure of promised immutable publication.

Before sharing these links as durable curricular objects, choose and test the
intended policy: mutable preview follows installed projection; an exact published
explanation pins its editorial/compiler content; an immutable edition pins every
delivered byte. Avoid one overloaded string that claims all three. Preserve old
links through an explicit compatibility or repair response, not silent ordinal
reinterpretation after beat changes. Do not migrate all historical formats now.

### 3. Share responsibilities, not a giant lesson component

`gradient-contour-entry.ts` already uses existing clocks, checkpoint playback,
native input, keyboard binding, stage and scaffold. Its checked Apply validates
before disposal and rejects invalid drafts without replacing the live lesson.
However, narrative placement, guided comparison DOM, editor wiring, URL ownership
and mount lifecycle remain in a single page-local entry. Successful repeated
Apply does not establish multi-instance embedding or transactional recovery from
an exception during mounting. Those are unproven capabilities, not reproduced
bugs in this assessment.

For the first mechanics caller, keep model/meaning, score, stage and host separate.
Prefer a local mount seam with explicit source and root over copying the whole
page. Pressure source Apply/dispose and two-instance isolation before extracting
shared host plumbing. Keep gradient-specific camera and teaching comparisons
local. No new renderer, animation clock, universal question schema or catalogue
migration is justified by the current evidence.

### 4. Budget ownership must describe the artifact actually built

`scripts/check-algebra-fraction-composition-budgets.ts` hardcodes a 145,000-byte
common-reader ceiling and a legacy startup/activation split. The completed
release recorded a 152,463-byte reader matching its previously approved canonical
baseline. `check-canonical-animation-construction-budgets.ts` expects a review
entry absent from the main production manifest. Neither failure should be hidden.

Reconcile build target and complete consumer identity before selecting the
authoritative policy. Keep lazy startup and activated cost distinct; matching an
aggregate reader baseline alone does not justify every legacy route's startup
growth. Retain source/leakage checks, record any justified policy change, and
remove duplicated ceilings only with an explicit replacement owner. This does
not require a new global performance framework.

## Recommended order

1. Repair edition dependency completeness and prove shared-style regeneration
   with immutable-output preservation. Highest concrete benefit and bounded scope.
2. Reconcile the two verification owners and specify revision/preview/edition
   semantics. Avoid a broad format migration or speculative type hierarchy.
3. Start M00–M01 mechanics with an independently recoverable mathematical idea.
   Use the second real context to decide whether any host/layout seam needs
   promotion. A sketch and measurement table may suffice before animation.

| Candidate | Authoring benefit | Reliability/reuse | Complexity risk | Recommendation |
| --- | --- | --- | --- | --- |
| Complete static asset closure | High | High; three existing callers | Bounded | First repair |
| Revision and gate ownership | Medium | High; prevents misleading guarantees | Medium | Next bounded pass |
| Mechanics exemplar immediately | High learning feedback | Would inherit known packaging gap | Medium | After repairability pass |
| Universal lesson/curriculum framework | Unproven | Hypothetical | High | Defer |

Centralization reduces repeated repair effort; premature generalization can make
domain-specific teaching harder and multiply compatibility obligations. The
recommended path preserves existing owners and earns abstractions through reuse.

## Verification and limits

Ran a fresh focused suite: gradient authoring and extraction plus Bayesian,
common-factor and composed-algebra publication tests. **15 passed, zero failures**.
Exact invocation:

```sh
node --disable-warning=ExperimentalWarning --test tests/gradient-contour-authoring.test.ts tests/gradient-contour-extraction.test.ts tests/bayesian-reasoning-publication.test.ts tests/composed-algebra-publication.test.ts tests/common-factor-publication.test.ts
```

These passes preserve current contracts; they do not certify the missing CSS
closure. The preceding delivery's 7,037-test/full-build/browser evidence remains
historical release evidence, not a fresh full-suite claim for this assessment.
No runtime implementation, new visuals, deployment or mechanics lesson was changed.
The current gradient loop remains complete; no historical paused loop is resumed.
