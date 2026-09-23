# Ten-case baseline findings

This current-agent engineering trial exposes useful reuse and two different kinds
of failure. It is not a model benchmark, a curriculum percentage or a learning
experiment. Inputs and expected intentions were frozen at `aa5085bc5`; all ten
first outcomes remain in `baseline/`, and browser outcomes in `preview-baseline/`.

| Frozen case | Owner outcome | Actual preview / interpretation |
| --- | --- | --- |
| `fraction-add-reduce` | Checked; host eligible | Exact source applied in browser fixture; accessible-math preservation failed |
| `fraction-subtract` | Checked; host eligible | Exact source applied in browser fixture; same accessible-math failure |
| `fraction-false-count` | Rejected at `$.moves[1]` | Intended arithmetic negative exercised; no application |
| `algebra-single-digit` | Rejected at `$.states[0].id` | Unexpected author-format failure; factoring and host not reached |
| `algebra-composite-factor` | Rejected at `$.states[0].id` | Intended presentation boundary not reached, despite broad repair-status match |
| `mechanics-declared` | Checked, semantic plan only | Fixed assumption declaration; reference-only, no source application |
| `mechanics-zero-mass` | Rejected at `$.mass` | Intended physics assumption boundary exercised |
| `code-purpose` | Checked, editorial | Canonical programs/stages retained; reference-only |
| `code-boundaries` | Checked, editorial | Same program pins, different emphasis; reference-only |
| `code-changed-source` | Rejected at `$.sourceRevisionId` | Intended source-identity boundary exercised |

Five owner checks succeed and five reject. Nine broad checked/repair predictions
match, but that number conceals the unexercised algebra negative. Both algebra
intentions are unfulfilled. Three checked cases remain reference-only. Two
fractions reach the real host, but zero baseline previews pass every required
preservation gate because native accessible mathematics is missing. These are
separate observations, not one success percentage.

## Where the work went

All ten raw inputs remain unchanged. No per-case adapter or engine edit was made.
Two adjacent fraction Articles were authored to explain the selected chains;
the browser harness and result guards are new shared trial infrastructure.
Existing domain owners, source revisions, native renderer, clock and styles
handled both successful fraction applications. Exact checked moves, ordered
source pins and diagnostics are retained in the raw records.

Checker durations range from 13.8 to 547.7 ms in these local observations. Runs
mix cold owner loading and a second case in the same process, so those values do
not establish comparative speed or marginal engineering time. Engineering minutes
were not measured per case and remain `null`; the record must not convert them
to zero. No paid model calls or external evaluations occurred.

## Candidate repair and limits

The repeated implementation failure is fraction static publication: the same
owner emits only aria-hidden visual KaTeX for both valid inputs. Restoring the
native renderer's existing MathML output can repair this responsible boundary
without changing visual glyphs, input grammar, semantic proof, choreography or
host capabilities. Keep the failing browser gate and repair it in the approved
single-seam slice before release.

The two algebra failures came from authoring unnamespaced IDs. Preserve them in
the rerun and improve guidance for future inputs; do not change those frozen
inputs, weaken their validator or call the mistake a factoring-engine failure.
New mechanics/code application paths are distinct capabilities, not the same
publication defect. They stay outside this repair. Qualified editorial review and
browser harness corrections are documented in [baseline notes](baseline-notes.md).
