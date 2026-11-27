# Resume the actual-response annotation trial

Date: 2026-11-27
Status: actual response and native preview accepted by the user's “yes”; bounded outcome complete.
Execution owner: existing `run-contract.kp.studio-foundations-20261127`,
remaining `revision` package. Do not create a competing run or reopen its four
accepted packages. The reference collection is accepted and closed.

## Why this next

| Candidate | Value now | Cost / uncertainty | Choice |
| --- | --- | --- | --- |
| Real annotation response | Tests the central conversational authoring claim with the integrated product | One actual response and editorial judgment remain unproved | Resume existing outcome |
| Another mathematical family | Adds breadth | Does not resolve whether conversation improves authoring | Later scope |
| Cross-family collection database | Could unify saving | New identity, migration and host contracts | Later scope |

The accepted collection demonstrates navigation and a product-authored numerical
contrast. It does not complete horizon outcome 3 (real-response revision), all
of outcome 4 (general Copy/Derive/Transclude), or the conversational portion of
outcome 12. No new mathematics or universal framework is implied by “resume.”

## Concrete trial

Canonical host: http://127.0.0.1:8000/experiments/fraction-notebook/?revision=1 .
Use the existing fraction annotation compiler, native reader and timeline.
The model may propose annotation title/content and existing targets only;
it cannot change the equation, operation order, renderer, clock or files.
Moment: **Keep the condition true**, whose current canonical text is
“Keep the equality true. Change both sides together.” Target remains the whole
initial equation. Request:

> Revise “Keep the condition true” to explain why we subtract three from both
> sides. Lead with a brief question about what would happen if only one side
> changed, then explain how doing the same subtraction preserves equality.
> Use at most two short sentences. Do not solve the equation or introduce the
> next step early. Keep the existing mathematical target and return only the
> proposal JSON requested by the panel.

The actual panel constructs request/session IDs, source and draft hashes,
available targets and the exact response schema. Recapture those at execution;
do not hardcode a response or treat this prose request as an admitted proposal.
The current canonical source descriptor was read successfully, with revision
`a38782dc9ae78240ad9856ef695cbce0bb3888bc0a2dc17ba8fee70e671694f4`.
This is an observed source version, not authority to overwrite a user's draft.

Recommended execution: one real model turn through the existing `ChatService`
and `CodexTransport`, in an isolated test-owned session/store and browser context.
Exercise the existing panel's prepare/send/response-selection/preview path;
retain the raw response and measured latency. No new transport or production
chat mutation. Use the configured default model, read-only sandbox and no file
or external actions. Stop after one response or a five-minute timeout; no
automatic correction calls. A malformed response is evidence, not permission
to substitute a mock. Keep preview/acceptance explicit and preserve undo/reject.

The local shared chat is currently disconnected with a saved thread and a
284-character unsent draft. Only readiness metadata was inspected; the draft
was not read, replaced or sent. Trial isolation is necessary to preserve it.

Judge whether the answer improves reasoning, directs attention to the right
object and stays concise; record any correction needed. Valid JSON and passing
compiler checks do not establish that judgment. Finish only after an actual
response and human review, not another deterministic peer response.

## Authority boundary and next action

Readiness rechecked on this resumption: `npm run test:studio-foundations` passes
38 checks; `npm run visual:editor-chat -- --grep 'contextual revision' --project=firefox`
passes all six Chromium/Firefox cases. They exercise the real service with a
deterministic peer, including unsent staging, existing-draft protection, stale
thread rejection, preview, explicit acceptance/rejection and undo/redo. They do
not constitute an actual-model trial. No product code or shared chat state was
changed during this preparation.
All 75 project-vision checks pass after retaining the original approved contract
source and shortening roadmap prose to its unchanged startup budget.

The existing run contract expressly excludes **“model spending”**, and the
approved horizon says **“No paid model calls are authorized by this plan.”**
The subsequent explicit question requested exactly one real read-only Codex turn
using the isolated session above. The user replied **“go”**, granting that narrow
exception. All other spending exclusions remain. The installed account's billing
treatment is unknown; this is one authorized call, not a claim of free inference.
The runner's exclusive attempt journal prevents resending after a crash or retry.

Resume context: `theseus work context task.kp.studio-foundations-20261127 --mode brief`.
The historical authoring-to-practice run remains parked. Broad motion, publication,
new mathematical families and generalized revision remain outside this trial.

## Actual result and review

The single authorized turn ran through the existing browser panel, HTTP service
and installed Codex transport. The configured model reported `gpt-6-astra`; no
model override was supplied. It completed in **9,293 ms**, measured from native
send reservation until the service exposed a completed response. That figure
excludes page setup, connection and preview compilation; it is one observation,
not a latency benchmark. There was one completed response and no tool messages.

Before:

> Keep the equality true. Change both sides together.

Actual proposed wording, with the title unchanged:

> Would the sides still be equal if only one changed? Subtracting three from
> both sides keeps them equal.

The actual JSON passed the existing source/draft/session checks and compiled into
the native fraction preview. Its target remains
`equation.fractional-linear.initial`. The notebook document remained unchanged;
Accept was never pressed. A before/after fingerprint verified that the shared
conversation, including its unsent draft, was unchanged. No browser errors were
observed. The isolated transport and browser were disposed after capture.

Review the [comparison capture](contextual-revision-trial/comparison.png) and
[native preview capture](contextual-revision-trial/preview.png). These two captures
are adopted evidence of this one actual response, not visual regression goldens.
The [canonical notebook](http://127.0.0.1:8000/experiments/fraction-notebook/?revision=1)
still opens the original source; this isolated proposal has **not** been applied
to the user's notebook or staged in the shared chat.

**Judgment:** the question makes the invariant more explicit and the second
sentence grounds it in the specific operation. It meets the two-sentence limit
without solving the equation. It asserts preservation rather than explaining
the reversible-operation reasoning; decide whether that is the right amount of
explanation for this brief annotation. One valid example does not establish
general model reliability or learner benefit.

Evidence: [request](contextual-revision-trial/request.txt),
[unaltered response](contextual-revision-trial/responses.json),
[result](contextual-revision-trial/result.json) and
[send reservation](contextual-revision-trial/attempt.json). Only test-owned IDs
and the prepared prompt are retained; no shared chat token or draft is recorded.
The small runner adds no reader payload or production transport.

Executed checks:

- `npm run visual:contextual-revision-trial -- --live`: one actual turn, valid
  preview, unchanged notebook/shared conversation, inspect/return controls.
- The same command invoked again exited **1 before connection or inference**
  because its exclusive attempt journal already exists. This was an intentional
  duplicate-send prevention check, not a second model call. Never remove that
  journal to retry this authorization.
- `npx tsc --project config/typescript/tsconfig.node.json --noEmit`: passed.
- `npm run test:studio-foundations`: 38 passed.
- `npm run test:project-vision`: 75 passed on rerun after shortening the active
  thread from 452 words to fit its unchanged 450-word budget; first run failed
  that documentation limit only.
- `theseus workspace validate`: valid, 1,377 nodes and 35,604 events.

The impact selector has no rule for this one-off opt-in runner and suggests the
broad fallback. Verification is scoped to the real isolated trial, Node types,
the existing revision tests and project-memory checks: no product implementation,
renderer, package dependency or build entrypoint changed. The previously recorded
Chromium/Firefox tests still own deterministic rejection/acceptance/undo evidence;
this actual trial establishes preview only. The user's subsequent “yes” accepts
the wording and preview, completing the human judgment gate. It does not apply
the proposal to the shared notebook, authorize another model turn, or establish
the complete [twelve-loop horizon](2026-11-27-twelve-loop-review.md).
