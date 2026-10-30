# Independent workbench: first usable collaboration loop

Date: 2026-10-30
Status: proposed scope; implementation and execution contract await approval
Mode: interactive; one integrated visual checkpoint
Planning baseline: `f86579cfc897430bab915de15d0966a862fc8a27`

## Outcome and reason to build it

The owner can select a specific passage or mathematical object, retain a comment
at that revision, share precise context with the existing coding assistant,
compare an original with a candidate revision, and reopen that context after
reload. One question, attempt and uncertainty note can be retained with the same
reference machinery. The workspace is useful before broader KP repair finishes.

This tests the user's hypothesis that improving the interface used to build KP
can accelerate subsequent development. It also supplies an immediate personal
practice use rather than making learning wait for a complete monitoring platform.
The [architecture recommendations](reviews/2026-10-30-next-step-review.md),
[independence discussion](capture.md#2026-10-30-consider-an-independent-workbench)
and [antifragility requirement](capture.md#2026-10-30-antifragility-as-a-workbench-design-requirement)
remain source context. This is the sole human-readable delivery proposal;
Theseus will own live execution after approval.

## Recommended scope and what changes in priority

Recommend this bounded workbench delivery next. The shared-algebra-mount
conversion remains the first KP engine repair, with its original finish line;
it is not erased, completed or expanded. Initially integrate an existing KP host
through a small adapter, so an independent UI does not require that conversion
or a repository-wide reorganization first. If the adapter needs substantial
engine changes, report that dependency instead of copying the engine into the
workbench.

Use a standalone Svelte/Vite application in the current repository, proposed at
`apps/workbench/`, with its own development entry, styles, type checks, fixtures
and focused tests. Do not inherit the root publication plugin pipeline or import
KP experiment CSS into its shell. Keep KP-independent feature interfaces, but
make no claim of supporting every project or artifact type. The unanswered
broader-product-scope question need not block this first KP integration; it also
does not authorize a repository split.

Proposed stable commands are `dev:workbench`, `test:workbench`,
`typecheck:workbench`, `build:workbench` and `visual:workbench`. They do not exist
yet. Browser checks belong in a committed scope-specific entrypoint; disposable
captures belong under `tmp/codex/`. Keep full integration checks at the appropriate
boundary rather than making each UI edit run the whole KP build.

## Canonical exemplar and authority

- Workbench artifact: proposed `workbench.experiment.context-return.v1`.
- Host: the new workbench's own local server, proposed port 8010. This is a
  planned address, not a currently working preview. Delivery must report the
  actual working URL, selected fixture and source revision.
- Workbench renderer: ordinary Svelte/HTML/CSS, native text selection and scoped
  typography. No new symbolic or depth treatment in this milestone.
- First mathematical integration: an existing checked composed-algebra-intuition
  source, host `/experiments/composed-algebra-intuition/`. Pin its actual saved
  source revision and semantic position in the implementation contract. The
  existing algebra compiler, issued presentation and native KaTeX compositor
  retain mathematical and paint authority.
- The inspected `src/experiments/composed-algebra-intuition/practice.ts` already
  supports prediction/reconstruction, answer reveal and positional return; it
  clears the response on entry and does not persist attempts. Reuse the owning
  prompt/position helpers rather than forking a second algebra model.
- Include one small text artifact with two revisions to exercise selection and
  comparison independently of the mathematical renderer. Text snapshots have
  explicit revisions; do not silently relocate an old selection in new text.

Preserve existing reader interactions, mathematical semantics, accepted visuals,
review-log history, GTD files and Theseus authority. The fractional tutorial is
a technical regression reference, not the content to polish for this milestone.

## Observable acceptance

1. Start the workbench independently. Fixture mode works with KP unavailable.
2. Select a text passage and a declared semantic target/checkpoint in the live
   mathematical adapter. Save a note with the artifact, revision and selection.
3. Compare two supplied or deliberately edited revisions without changing the
   reference on the original comment. Missing/stale/ambiguous targets are visible.
4. Export a bounded context packet for the existing assistant. A returned
   candidate can be opened with its provenance. There is no embedded model call
   or claim that an arbitrary external chat UI can be controlled.
5. Save one question version, an attempt, assistance/reveal state and a learner
   uncertainty note. Revise the question without overwriting the earlier attempt.
   Set an explicit later-return date and retrieve it from a simple return list.
6. Reload/restart and reopen the saved item at its exact supported context.
   Retain the original source snapshot; revalidate source through the existing
   math owner when needed. Report an unavailable historical runtime explicitly.
7. A failing preview or unavailable KP adapter leaves records and the rest of the
   workbench usable. An interrupted save is reconciled without silent loss or
   duplicate creation; a stale edit produces a conflict. Export/import recovery
   is exercised against an isolated store.
8. Measure one change to the workbench's own UI: reproduce its fixture, preview a
   candidate, inspect the difference, retain the decision, and return to the
   accepted version. Record startup, save-to-preview, focused-check and end-to-end
   iteration timings separately; do not claim a speedup without a baseline.

Human judgment remains necessary: does selecting, commenting, comparing and
returning actually reduce context reconstruction? Is the workspace comfortable
to use? Automated checks cannot establish those outcomes or learning efficacy.

## Boundaries and persistence

Keep the initial interfaces small: versioned artifact references, selection
resolution, preview requests/results, context packets and owned record commands.
Selection semantics remain provider-owned; do not infer mathematical identity
from glyph text or use a universal object ontology. Runtime validation and shared
contract fixtures must keep live and fixture adapters consistent.

Workbench-owned discussion, comparison decisions and personal attempts have a
local persistence owner with explicit schema versions, acknowledged commits,
request identity and expected revisions. Its concrete storage choice belongs in
the first package's bounded design, before parallel persistence/UI work begins.
No worker writes directly to another owner's database or log. KP development
feedback, if exposed, goes through the existing dev-review API; do not mirror it
as competing workbench truth. Theseus remains the execution authority.

The live preview adapter may use a framed existing host and validated messages
for capability discovery, semantic selection and exact return. Declare source
and origin checks and capability gaps. Framing provides document/style separation,
not a claim of browser-process isolation. Keep an accepted workspace/preview
available while candidates run on independent development instances.

## Work packages, dependencies and verification

These are proposed packages, not a second execution-status table. After approval,
the run contract binds these IDs and owns progress and evidence.

| Package | Delivery and dependencies | Verification and rollback boundary |
| --- | --- | --- |
| `wb-foundation` | Reconcile relevant control metadata, establish the independent app, minimal contracts, persistence choice and representative fixtures. No KP-wide restructuring. | Focused source/import/style isolation checks, affected types, one launch smoke. One recoverable foundation commit. |
| `wb-ui` | After foundation, implement selection, anchored discussion, revision comparison and return-list views against fixtures. | Focused interaction and keyboard checks, a single-exemplar browser smoke. Reversible feature-module commit. |
| `wb-records` | After foundation, implement durable comments/decisions and the narrow question/attempt workflow, preserving revisions and assistance conditions. | Meaningful persistence/recovery tests: interrupted acknowledgement, retry reconciliation, stale write, source revision preservation and export/import. Separate reversible persistence commit. |
| `wb-kp-bridge` | After foundation, integrate the existing algebra host and context-packet handoff without importing its runtime into the workbench shell. | Contract fixtures, real semantic selection/return smoke, unavailable-adapter behavior and relevant existing math/host checks. Separate adapter commit. |
| `wb-integration` | Combine the preceding packages, exercise the complete workflow and one improvement to the workbench itself, then present the canonical review. | Required affected integration/types checks, production build for the new app, bounded failure drills and first browser cohort. Verify the combined revision; record costs, known limits and exact URL. |

The UI, records and adapter packages are candidates for parallel execution only
after the shared contracts and fixtures exist. Each worker gets one worktree,
owned modules, its own port/test data/output directory and a reviewable result.
One integrator owns shared contract changes, dependencies/lockfiles and final
integration. Two or three workers are a ceiling, not a utilization target. Do not
spawn agents during this planning turn; execution approval must cover delegation.
Integrations/merges remain subject to the standing branch policy.

## Control preflight and resource limits

During planning, `theseus plan run` reported two audited nodes without source
references, five pressure items needing triage and no ready action. The brief
context for `workflow.kp.delivery` still names the September 13 reader priority,
which conflicts with current roadmap direction. Do not resume that historical
work or clear gates blindly. After approval, reconcile the relevant control
records with current sources through the actor CLI, preserve historical user
pauses, and create the bounded run contract only when its authority is valid.
Do not alter the Theseus package or sweep unrelated backlog as part of this work.

Proposed execution ceiling: six elapsed hours, reserving the final hour for
verification, evidence and backup. This is a limit, not a completion estimate.
Stop earlier when the integrated review candidate is ready. On reaching the
reserve, take no new implementation work; preserve a recoverable checkpoint and
report unfinished acceptance explicitly. Broadening the product or engine scope
requires a revised proposal.

Allowed repairs: defects and dependency/style/lifecycle conflicts directly
blocking the above outcome, with focused prevention evidence. Standing measured
engineering-budget repair authority applies. No tests, guarantees or consumers
may be omitted to meet the limit.

## Review, exclusions and next decision

At the single integrated visual checkpoint, provide the working URL and ask the
owner to select, comment, compare, attempt, reload and return. Show one controlled
failure and recovery. Distinguish fixtures from live integrations and measured
properties from design ambitions. Commit and back up each coherent checked slice
and the review candidate; do not merge merely to checkpoint.

No catalogue rollout, general plugin marketplace, scheduler algorithm, automated
grading, paid model integration, autonomous agents running in the background,
repository split, new renderer, 3D motif, universal knowledge graph, or broad
reader repair is included. A later-return list is not a full spaced-repetition
product. Typed references are not proof of every possible historical restoration.

Done for this first run means review readiness plus programmatic acceptance of
the stated hard invariants, not automatic visual approval or universal
antifragility. Stop at that review; no post-review expansion is preauthorized.
After feedback, select one concrete recurring friction to improve in the next
bounded loop. Promote reusable behavior only when evidence supports it.
