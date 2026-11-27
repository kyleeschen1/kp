# Matrix reuse and one complete authoring journey

Date: 2026-11-27
Status: accepted. The user's “it is great! Propose the next 12 loops” accepts
the combined note/reuse exemplar and closes this finite finish. New work remains
a [separate proposal](2026-11-27-second-twelve-loop-horizon.md).
Scope: [approved finish](2026-11-27-studio-finish.md), completing the two gaps in
the [twelve-outcome audit](2026-11-27-twelve-loop-review.md).
Execution: `run-contract.kp.studio-finish-20261127` owns live progress.

## Inspect the actual artifact

Open http://127.0.0.1:8000/experiments/fraction-notebook/?notebook=matrix .
Press **C-x C-x**, choose **Open exported matrix notebook JSON**, and select
`docs/project/reviews/matrix-studio-trial/notebook.json` from this checkout.
This is the actual model-revised notebook, including its saved Explain view.
Import refuses to overwrite different saved content with the same identity.
Existing default notebooks and the shared chat were not used for the trial.
Captures: [proposal comparison](matrix-studio-trial/comparison.png),
[reopened actual notebook](matrix-studio-trial/reopened.png),
[transcluded actual note](matrix-studio-trial/reused.png).

Look for the question **Why does the result point straight up?** above the
matrix. Its weighted columns cancel horizontally and add to five vertically.
Use the existing Explain controls to follow that relationship. Judge whether
the question, nearby explanation and mathematical view help direct attention;
the wording and interaction are now accepted at this bounded scope.

For reuse, select the matrix and choose **Publish selected matrix source locally**.
Choose **New independent matrix notebook**, then **Reuse published matrix in this
notebook**. Its dialog offers three deliberately different relationships:

| Choice | Source relationship | Local ownership |
|---|---|---|
| Copy | Independent source with new identities | Matrix, vector, note and views |
| Derive | Follows the original matrix | Vector, note and view occurrences |
| Transclude | Follows the original matrix, vector and note | View occurrences, extent, folding and playback |

Choose live or pinned publication following for either linked relationship.
Live means **explicitly published updates**, not every upstream keystroke.
**Refresh linked matrix snapshots** updates pinned copies deliberately; native
undo restores the previous snapshot. **Open original matrix notebook** and
**Return to linked matrix occurrence** retain the exact return target.
Judge whether these choices and their provenance are understandable.

## Actual model evidence and interventions

The user authorized one additional read-only Codex turn after reviewing the
concrete request. The installed default reported `gpt-6-astra`. One response
arrived in **12.356 seconds**, with **zero tool messages**. Its unedited proposal
was admitted by the existing source/draft/thread/target checks, previewed,
accepted in isolated test storage and exported through the product commands.

> Why does the result point straight up?
>
> Each column is weighted by its corresponding input coordinate, so the horizontal contributions cancel and the vertical contributions add to five.

[Request](matrix-studio-trial/request.txt), [raw response](matrix-studio-trial/responses.json),
[exported notebook](matrix-studio-trial/notebook.json), and
[original result](matrix-studio-trial/result.json) retain that evidence.
The runner's single-send journal prevents another `--live` attempt.

The initial run hit a five-second readiness timeout after successful reuse when
opening the source. Recovery used the exported actual notebook, **zero new model
turns**, and verified import, publication, reuse, exact source/occurrence return,
reload and another fresh-context import in **5.082 seconds**. A first recovery
also exposed test setup injecting a storage preference into opaque child frames;
the runner now limits that injection to the product host. Both failures remain
recorded, alongside [successful recovery](matrix-studio-trial/recovery.json).
The shared conversation fingerprint was unchanged throughout. These numbers are
single observations, not model or author-productivity benchmarks.

## Preservation and bounded support

The existing `MatrixVectorDocument`, validation/evaluation, KaTeX and column
Graph2D player remain authoritative. Notes and bindings serialize through the
existing ProseMirror resource node and native undo. A bounded local IndexedDB
publication catalogue admits at most 64 publications and 16 resources per
notebook. CAS, owner and closure checks reject stale or foreign publication.
Missing or withdrawn sources retain their snapshots and dependency labels.
Only an independent original can publish; linked chains are intentionally
unsupported. Exported JSON carries snapshots and bindings, not an entire source
catalogue. Reopening on another browser retains the snapshot but cannot invent
its absent upstream notebook. No synchronization service was added.

This is one supported matrix family and one short explanatory-note revision.
It does not establish broad mathematical generation, automatic correctness of
arbitrary prose, general model reliability, or learner transfer. The prompt
already specified the mathematical observation; the model rephrased it.

The final browser pass exposed a command-registry lifecycle defect during
Firefox page teardown. Registry shutdown now retires notifications before child
owners close; notification dispatch snapshots its membership, and stale command
handles cannot resolve retired targets. A deterministic regression covers
subscription replacement and terminal shutdown. This prevents that class of
notification churn; it is not a claim that every browser timing failure is gone.

The exact checks and their results are recorded in Theseus. Run the saved-output
workflow without inference with `npm run visual:matrix-studio-trial -- --resume`.
The combined human checkpoint was the remaining finish condition at delivery;
the subsequent explicit acceptance above closes the final two horizon outcomes.

## Cost and validation

Compared with pre-finish commit `6d9be476c3b2e0d1720e4e9b5046f618c64f74b9`,
`npm run measure:notebook-mathematics -- --baseline 6d9be476c3b2e0d1720e4e9b5046f618c64f74b9`
measured these complete consumers after the lifecycle repair:

| Consumer | Before, gzip bytes | After, gzip bytes |
|---|---:|---:|
| Notebook initial JavaScript | 477,359 | 481,343 |
| Notebook complete JavaScript/CSS, including lazy chunks | 646,108 | 656,764 |
| Native fraction reader initial JavaScript | 124,959 | 124,959 |
| Native fraction reader complete JavaScript/CSS | 340,792 | 340,792 |

The current mathematical reading is 166,479 bytes initial JavaScript and 248,424
bytes complete JavaScript/CSS. These are per-file gzip estimates, not runtime
memory or measured network transfer. All emitted assets were included in the
measurement; no consumer was dropped. Scoped types rose from 178,593 to 179,666,
instantiations from 206,834 to 208,062. No ceiling was raised. One tooling config
hash changed solely to admit the new reuse spec to its existing browser cohort.

Full TypeScript/Svelte checks and architecture passed. Focused command, discovery,
interaction and reuse tests passed (29), as did prior notebook mathematics (43),
studio foundations (38), and eight existing matrix browser preservation cases.
The final eight-case reuse suite adds a 390px picker check in both browsers.
Its first final pass found the Firefox lifecycle issue; the next exposed a test
race between picker dismissal and the asynchronous withdrawal commit. The test
now waits for the actual IndexedDB tombstone and completed undo save before
refreshing, preserving the unavailable-source assertion. Project orientation
also caught a 460-word thread against its 450-word limit; the new review summary
was shortened rather than raising the budget. Final rerun results are in Theseus.
An additional Firefox run passed the withdrawal assertions but stalled waiting
for the whole-page `load` event on reload; a concurrent saved-artifact check
also timed out on `goto`'s `load` wait. Navigation checks now wait for DOM parsing
and the actual notebook-ready marker/content, rather than incidental iframe
loads. The previous successful actual recovery remains retained; later failed
probes no longer overwrite it. This adjustment does not skip notebook readiness
or weaken its mathematical assertions.

**Final gates:** all eight browser cases passed in 53.9 seconds on Chromium and
Firefox. The serial actual-artifact recheck passed in 4.143 seconds with zero
inference, no browser errors and unchanged shared chat. Final node/test types
also passed after the harness changes. These are scoped integration checks,
not the entire repository release matrix. The human checkpoint is now accepted.
