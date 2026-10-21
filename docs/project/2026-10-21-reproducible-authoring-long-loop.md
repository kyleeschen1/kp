# Proposed long loop: reproducible authoring and local editions

Status: approved by the user's “go” on 2026-10-21.
Contract ID: `run-contract.kp.reproducible-authoring-v1`.
Execution began at 19:04 UTC; ceiling 05:04 UTC October 22; reserve begins 03:34 UTC.
The user requested Theseus long mode with minimal check-ins. This document owns
the proposed scope; after approval Theseus owns execution status and evidence.

## Outcome and why now

An author can check a selected calculus source, preview it, produce a reproducible
local edition, reopen that edition at a pinned position, and inspect exactly what
source and assets it contains. Invalid source, failed mounting, stale locations
and altered output must produce useful errors without replacing working output.
Demonstrate transfer through the existing composed-algebra static edition path.

The previous run proved two source-only calculus variations, but a custom preview
still loses its source on reload. Existing Bayes and composed-algebra editions
already use `scripts/immutable-local-edition.ts`, stylesheet closure collection,
and compiled publication artifacts. Reuse those boundaries. The calculus reader
already has deterministic projection and staged replacement. This is a concrete
author workflow improvement, not another general architecture rewrite.

Planning evidence: the roadmap and relational-reader thread; the completed
calculus-transfer review and packet; `scripts/immutable-local-edition.ts`,
`scripts/build-composed-algebra-edition.ts`, `scripts/build-bayesian-edition.ts`,
and `src/authoring/prepared-revision-session.ts`. Theseus currently has no active
run. Its refill candidates are older visual checkpoints; none is selected by this
proposal. Its global warnings are not permission to rewrite historical tasks.

## Bounds and authority

Canonical exemplar: `content/authoring/transfer/stationary-change.json`, with
`two-reversals.json` as its structural variation. Current host:
`/experiments/change-propagation/`; renderer: existing native KaTeX markup,
parameter comparison paint and focus-deck clock/input. Mathematical authority:
`compileChangeSource` and its existing expression/differentiation/interval owners.
The default source, layout, choreography, controls and mathematical support stay
compatible. Existing calculus aesthetics remain unaccepted.

An interactive local edition packages that existing reader, not a new renderer.
Static reading remains available without JavaScript. No external deployment,
upload, paid services, LLM calls, analytics or collaboration services. Local
edition output must remain a repository descendant under existing output policy.
Do not introduce arbitrary filesystem loading or embed large source text in URLs.

Allowed author-control changes: explicit distinction between draft download and
displayed-source download, and source/revision diagnostics. Reuse existing styles;
no redesigned authoring interface. Publication output is local engineering output,
not acceptance of its pedagogy or permission to publish publicly.

Do not add a universal math representation, registry, editor framework, global
cache, automatic solver or semantic coverage. No Gaussian work, new motifs,
cross-family visual promotion or cleanup of unrelated dirty files. Do not promote
the composed-algebra static edition to interactive parity in this run. Shared
repairs need a demonstrated violation and preservation tests for all affected
existing consumers. If a proposed repair is unnecessary, record the evidence and
skip its implementation rather than manufacture a new abstraction.

## Execution and check-in policy

Estimated envelope: one sustained working day, approximately 6–10 hours, with a
10-hour ceiling and the final 90 minutes reserved for verification and backup.
These are planning estimates, not a requirement to consume time. Finish early if
the outcome is complete. On the ceiling, checkpoint honestly and report unfinished
work; do not mark incomplete slices complete.

One approval covers the ordered slices below. No phase approvals or routine
check-in questions. Continue through technical checkpoints, repairable test
failures and evidence-backed engineering-budget repairs. Emit brief progress
updates rather than asking the user to supervise. Keep receipts bounded; start
with brief context and retrieve only the selected owner and relevant tests.
No subagents are required or authorized by this proposal.

Commit each independently verified slice with its evidence. A slice whose only
result is that no repair is needed may commit the durable finding. Push the
current feature branch at least hourly and before handoff; verify remote HEAD.
Never merge, force push or modify main/dev. Preserve existing unrelated dirt.
The rollback unit is the individual slice commit; publication consumers must
remain compatible until their explicit slice changes them.

Verification levels: **F** focused deterministic checks; **S** focused checks plus
typecheck and Theseus validation; **B** subsystem/architecture checks and relevant
real browser or production-closure checks, plus typecheck/validation. Use impact
routing to select the smallest applicable checks. Full-suite release gates occur
at integration, not after every small edit. Browser entrypoints must be committed,
scope-specific npm commands; artifacts remain disposable.

Common stop **G**: required subjective visual/product judgment; inability to retain
semantic/ownership/endpoint guarantees; an irreparable external/authority blocker;
scope expansion; user pause; or ceiling. Existing aesthetics do not require
reapproval merely because the host is repackaged. Repairable failures and measured
budget issues do not stop the loop. Each table row inherits G and one checked
commit boundary, and adds any narrower stop below. Risk L/M/H is implementation
risk, not a claim about learner value.

## Ordered slices

| # / ID | Target and intended change | Risk | Level and expected checks | Additional stop |
| --- | --- | --- | --- | --- |
| 1 `baseline` | Record exact source→check→preview→edition capabilities, initial payloads and preserved reference outputs for calculus and composed algebra. | L | F: actual CLI examples, source revisions, existing edition tests and current production sizes. | Baseline cannot be reproduced. |
| 2 `source-input` | Audit and repair actual byte-size/read limits in selected calculus and edition inputs; retain located diagnostics. | M | S: UTF-8, invalid JSON, oversized files, non-files, allowed boundary cases. | Repair would change mathematical support. |
| 3 `identity-contract` | Define calculus publication source bytes, normalized explanation revision and output-byte identity using existing artifact/receipt types. | M | S: whitespace, prose and function changes; negative type and forged-artifact checks. | Requires a universal identity migration. |
| 4 `calculus-artifact` | Compile and reproduce a calculus publication artifact from the selected source through its existing mathematical owner. | M | S: both sources, altered payload/source rejection, escaped editorial text. | Publication would claim unverified prose or new math. |
| 5 `static-edition` | Add a local calculus static-edition command through the existing immutable writer, including exact source and complete reading. | M | B: build/check round trip, native math and all passages without script. | Requires a new visual layout to remain readable. |
| 6 `manifest-integrity` | Pressure and repair the existing writer's verification of the complete declared closure, including missing, altered and unexpected output. | H | B: all current writer consumers; mutation/path/symlink cases; preserve valid existing receipts. | Backward compatibility cannot be maintained explicitly. |
| 7 `write-lifecycle` | Pressure interrupted and concurrent local edition creation; repair demonstrated partial-output or cleanup failures. | H | B: injected write/rename failures, concurrent same-content writers, prior edition preservation. | Requires an external storage service or destructive migration. |
| 8 `style-closure` | Verify calculus CSS/font dependencies travel with the edition through the existing closure collector; repair missing local dependencies. | M | B: relative-path closure, no external requests, static browser reading and existing edition preservation. | Correct output requires a new aesthetic treatment. |
| 9 `reader-build` | Build a narrow production entry for the existing calculus reader and its exact local dependency closure. | M | B: production import graph, build output, editor/compiler versus reading costs. | Requires a replacement renderer or clock. |
| 10 `reader-capabilities` | Make authoring controls explicitly available only in editor hosts; an edition reads its embedded checked source without exposing misleading edit persistence. | M | S: editor compatibility, edition read-only controls, no-script fallback, lazy imports. | A new authoring UI design is necessary. |
| 11 `interactive-edition` | Add explicit interactive output to the calculus edition command, packaging the existing reader and immutable asset bytes. | H | B: fresh local HTTP serving, both selected sources, offline dependency closure, CLI check reproducibility. | Serving requires deployment or source assumptions change. |
| 12 `edition-restoration` | Bind edition initialization and reload to its embedded source revision; preserve deterministic seek and reverse. | M | B: fresh browser context, reload at fractional position, negative/zero h, source mismatch. | Restoration would silently substitute a different source. |
| 13 `location-input` | Harden the calculus location boundary for malformed, repeated, missing, nonfinite and out-of-range fields with documented compatibility. | M | S: deterministic parser/property cases plus browser hash changes and legacy default links. | Product choice cannot be resolved by existing compatibility rules. |
| 14 `preview-lifetime` | Pressure pending preparation, rapid requests, draft changes and page disposal; use the existing revision-session boundary if it demonstrably fits. | M | B: latest-request ownership, failed mount, cancellation/disposal, no leaked staging/listeners. | Sharing would require a general host controller. |
| 15 `download-authority` | Distinguish editable-draft bytes from displayed-source bytes in the calculus editor using existing controls/styles. | M | B: invalid unapplied draft, successful apply, failed apply, downloads and revision equality. | Requires subjective redesign beyond explicit labels/actions. |
| 16 `capability-routing` | Update the existing task inventory and reports to name exact static/interactive edition commands without claiming application or visual acceptance. | L | S: complete task inventory, CLI/report contracts, cheap starter loading and negative routes. | Another global registry would be required. |
| 17 `second-owner` | Exercise the existing composed-algebra static edition with the strengthened identity/closure checks; repair only demonstrated shared-contract friction. | M | B: genuine alternate composed source, unchanged reading, altered-output rejection and byte-stable prior editions. | Needs new algebra semantics or interactive promotion. |
| 18 `author-task-replay` | Add a reproducible author workflow check for both calculus cases and the second owner, including valid-but-wrong intent and repair cases. | M | S: real CLI check/build/check pipeline; source-specific expected facts; no unsupported LLM success claim. | Success requires silently broadening an accepted domain. |
| 19 `browser-preservation` | Verify packaged calculus versus its canonical host at semantic checkpoints, no-script, narrow viewport, keyboard, reduced motion and supported browser cohort. | M | B: stable browser command, exact math/readouts and lifecycle/overflow preservation; inspect representative captures. | Genuine visual redesign or judgment is needed. |
| 20 `cost-gates` | Measure source/editor/static/interactive costs, cold/warm loading and repeated mounting; establish bounded gates or repair responsible dependencies. | M | B: complete consumer closures, production bytes, request/long-task/resource measurements, type-cost gates. | Cost repair requires semantic or activation-policy change outside scope. |
| 21 `author-packet` | Write concise discover/check/preview/export/reopen instructions, exact limitations and machine-readable CLI examples; reconcile project entrypoints. | L | F: execute documented commands, verify links and capability inventory, reproduce from a fresh source location. | Documentation cannot truthfully describe the delivered capability. |
| 22 `integration` | Run final project checks, validate Theseus, record measured before/after and remaining limits, commit and verify remote backup. | M | B: full tests/types/build, authoring budgets, focused publication/browser gates and remote HEAD equality. | Any required gate remains unpassed or backup is blocked. |

## Acceptance and handoff

The completion packet must include commands and a working local URL for both
calculus editions; exact source/explanation/edition identities; a source-only
second-owner demonstration; failed-source/mount/output-repair evidence; complete
asset and measured cost accounting; compatibility findings; and Git backup proof.
No claim of broad authoring ease, LLM reliability or learner benefit follows from
these deterministic examples.

Defer visual simplification of the calculus dashboard, arbitrary calculus proof,
general multi-card composition and shared referents, a flagship publication,
learner testing, and the older visual-review backlog. The next product decision
after this run is whether to improve the explanation itself or pressure another
authoring composition need, based on the measured result.

`theseus work resume` retrieves durable execution state for later resumption.
