# Complete one algebra API retirement

Date: 2026-10-29
Authority: user says "go" after the bounded path-audit/conversion proposal in
[the lifecycle direction](decisions/2026-10-29-experiment-conversion-retirement-direction.md).
Execution owner: `run-contract.kp.algebra-api-retirement-v1`.

## Outcome and scope

Authors and maintainers get one current v2 algebra convenience path with explicit
source. Complete the existing conversion by removing the obsolete fixture-default
facade, migrating every known caller, preserving behavior checks and adding a
retirement guard through the existing compatibility ledger. No visual redesign,
semantic expansion, saved-source migration or broad ownership migration.

This is a small first lifecycle proof, not a repair of the whole architecture.
The old facade is eight lines and is already absent from browser/publication
runtime paths. Do not claim a reader performance improvement from its removal.

## Canonical path and preservation boundary

Reference host: `/experiments/reusable-reasoning/?example=algebra-intuition`,
including `variant=whole-and-parts`. The browser entry is
`src/experiments/composed-algebra-intuition/entry.ts` and the saved-edition entry
is its `edition-reader.ts`. Exact source comes from the embedded checked JSON,
not a browser-imported default.

| Responsibility | Current owner |
| --- | --- |
| Explicit source and repairs | `src/authoring/algebra/source.ts` |
| Compilation | `src/authoring/algebra/compile.ts` |
| Mathematical authority | `composed-algebra-proof-v2.ts`, domain verifiers and issued proof chain |
| Presentation selection | `composed-algebra-presentation-v2.ts`, canonical operation bindings and `compose-equation-operation-assets.ts` |
| Author preview lifecycle | `algebra/session.ts` over `prepared-revision-session.ts` |
| Reader projections and controls | `src/experiments/composed-algebra/sequence.ts`, `card.ts`, readings and practice projections |
| Native mounting | `src/experiments/common-factor/native.ts` |
| Measured compositor and scheduling | `src/reader/app/chrome-free-canonical-equation-session.ts`, canonical session and timeline playback clock |
| Publication | `scripts/composed-algebra-publication-source.ts`, static/interactive edition builders |

Preserve exact source revisions, issued authority, semantic endpoints, animation
assets, checkpoint timing, repairs, failed-preview retention, supersession and
disposal. Preserve v1 saved-format support and the earlier three-state exemplar:
they serve a different contract and are not the v2 wrapper being retired.
Immutable editions retain their existing bytes. No CSS or renderer code changes.

Audit finding: reusable reader/mounting owners remain under `experiments`, and
several lesson styles are composed through other exemplar styles. This pilot
does not establish that those broader boundaries are satisfactory. It isolates
a completed API replacement from an unresolved ownership conversion.

## Work packages

1. **Audit and baseline:** enumerate wrapper imports/aliases, current authoring
   guidance, saved-format dispatch and canonical runtime consumers. Establish
   preservation evidence while both paths exist.
2. **Convert and retire:** use current APIs and explicit fixtures in maintained
   callers; retain behavioral/negative tests, replace redundant wrapper equality
   assertions with meaningful authority/round-trip checks, remove the facade,
   update guidance and extend the existing retirement ledger/guard.
3. **Verify and close:** focused authoring and retirement suites, complete
   authoring consumer budgets, typecheck, architecture, deterministic suite and
   production build. Record actual failures and repairs. Commit and back up.

The impact selector currently falls back to full integration checks for the old
facade and boundary-test paths. Retain those checks for this pilot rather than
altering verification selection merely to reduce this task's cost. Browser visual
review is unnecessary if executable production source/rendering stays unchanged;
run a focused browser check if the diff reveals a runtime change.

Rollback unit: caller migrations, deleted facade, retirement guard and updated
guidance in one coherent commit. Before/after comparisons and existing semantic
tests must pass before removal is called complete. Tests are migrated to the
surviving API; their guarantees are not retired with the wrapper.

Resource ceiling: one bounded implementation session, at most 60 minutes after
this plan is recorded, reserving the final 20 minutes for verification and
closeout. Stop taking new work at the reserve; record incomplete checks honestly
if the ceiling is reached. Earlier finish is preferred. No adjacent migration is
automatically admitted. Stop for a material semantic/visual change or an external
blocker beyond the authorized repair scope.

Global Theseus backlog warnings (old pressure/source-reference debt) are preserved
as separate diagnostics. This user-selected bounded task must have its own source,
scope and checks; it does not authorize resuming the stale workflow frontier.
