# Next step: reuse a saved matrix explanation outside the notebook

Date: 2026-11-27
Status: implemented and checked; awaiting the single reference-card review.
Execution: `run-contract.kp.matrix-reference-card-20261127`.
Evidence and review: [reference-card workflow](2026-11-27-matrix-reference-card.md).

The approved outcome has three packages: export/admission, standalone reference
workflow, then one human exemplar review. Allow up to four hours with the last
45 minutes reserved for verification and closeout; finish sooner when ready.
Checkpoint checked rollback units and back up before handoff and hourly.

The user's “go resume” accepts the connected notebook explanation and completes
its three-package contract. No implementation package remains in that run.
The [approved boundary](2026-11-27-next-step-review.md) explicitly left saved
vignette reuse to a later second host. Preserve that finite completion.

## Recommended outcome

Export one selected matrix resource and open it in a small reference-card host
that does not load ProseMirror, chat, the notebook controller or the saddle
library. It uses the same seven-beat column explanation and can return to a
selected milestone. This is the next test of the composable reference-page
vision: an authored explanation remains useful outside its authoring environment.

| Candidate | Authoring | Reliability/demo | Reuse | Risk | Decision |
|---|---|---|---|---|---|
| One saved resource in a reference card | High | High | Direct second host | Bounded import/lifecycle | Recommend |
| More mathematical object families | High | Medium | Not yet demonstrated across hosts | Wider domain scope | Later |
| Universal player/package extraction | Indirect | Low | Speculative | Migration overhead | Defer |
| LLM mutation of arbitrary objects | Potentially high | Unproved | Potentially high | Authority/repair gaps | Separate proposal |

This removes a demonstrated authoring limitation: the explanation currently
lives inside a saved notebook. It keeps a small finish line and preserves
cross-session IDs rather than starting another layout experiment.

## Concrete proposed scope

1. A contextual **Export matrix resource** command downloads the selected
   validated `MatrixVectorDocument` with its matrix/vector/result/occurrence IDs.
   Reuse existing download mechanics and data admission. No generated paint,
   arbitrary code or duplicated calculated result enters the file.
2. A bounded local reference page accepts that file, derives its explanation
   through `createMatrixVectorRuntime().explanation()`, and mounts the existing
   column embed. Use a checked fixture as the initial example; expose the file's
   selected source clearly. Invalid imports preserve the displayed valid card.
3. Retain the imported snapshot and chosen milestone across reload using the
   existing local atomic-storage owner. Host preferences stay outside source
   truth. Source values/IDs must survive exactly, including signed and zero
   examples; malformed source and unsupported paint produce explicit gaps.

Canonical proposed host: `/experiments/matrix-reference/`. Authoring source:
the selected matrix notebook resource and its exported bytes. Mathematical
authority: the existing resource/typed-matrix owners. Renderer: the accepted
`mountColumnExplanation` path. The full seven-beat sequence is retained; custom
sequence subsets and new narration are later work.

Export is a pinned snapshot: later notebook edits do not mutate an already
exported file. Live subscriptions/import resolution remain separate. The existing
two-factor matrix publication workflow cannot silently stand in for this real
single-vector source. No new universal asset schema is warranted for this proof.

## Finish, preservation and review

Finish when a notebook-authored resource opens correctly in the independent
reference page, survives reload, seeks/reverses, and rejects malformed imports
without losing the last valid display. Verify source identity and result parity,
cancelled/replaced loads, disposal and the complete reader import closure. Retain
legible local horizontal scrolling on narrow hosts; review one card before any
compact-layout redesign or broader embedding rollout.

Preserve notebook storage, native history, existing column choreography and
default fraction scrolling. Rollback unit: the export command and separate
reference host; the accepted notebook explanation remains intact. Expected
checks: focused round trips and admission, affected TypeScript, browser import/
reload/reversal, and production closure excluding editor/chat dependencies.

Excluded: publication/deployment, flashcard scheduling, cross-notebook live
subscriptions, broad SDK extraction, new mathematical families, paid models and
LLM edits. A later LLM can invoke a checked authoring/export operation; that is
not required to establish this reuse boundary. Existing retired scrolling/window
experiments and unrelated pending visual reviews remain parked.
