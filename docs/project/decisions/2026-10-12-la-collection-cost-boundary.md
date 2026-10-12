# Bounded LA collection delivery costs

Authority: standing September 10 engineering-budget repair approval, within
`run-contract.kp.la-explanatory-reuse-v1`. This is a measured policy amendment,
not a payload optimization or authorization for another renderer family.

## Diagnosis and explicit amendment

The production build passed, but `npm run measure:semantic-cost` failed the
rectangular page's old 100000 JS / 16000 CSS gzip-byte ceiling. That consumer
includes every lazy mode, including numeric pouring, structure and the three
collection sources. Its measured closure was 111179 / 16157. The default cold
page itself was 94657 / 14686. Removing lazy modes from the old consumer would
hide supported functionality, so the complete union remains measured.

| Complete consumer | Measured JS / CSS gzip bytes | New ceiling JS / CSS |
| --- | --- | --- |
| Rectangular all-view union | 111179 / 16157 | 116000 / 17000 |
| Rectangular default | 94657 / 14686 | 100000 / 16000 |
| Polynomial activation | 106467 / 15412 | 112000 / 16000 |
| Linear-system activation | 107181 / 15412 | 112000 / 16000 |
| Reordered-polynomial activation | 107098 / 15412 | 112000 / 16000 |

The amendment leaves the old cold-page allowance intact under a separately
named gate, adds exact activation closures, and gives the full union about 4.3%
JS headroom. Collection JS headroom is 4.5–5.2%; CSS headroom is 3.8%. All other
entry, menu, forbidden-module and cache limits remain unchanged. Measurements
before and after this policy change were identical: no reduction is claimed.
The subsequent font-readiness fix adds two compressed bytes to each collection
and all-view JS closure: final values are 106469, 107183, 107100 and 111181.
CSS and default-page measurements are unchanged. The final build passes the
same executable ceilings.

The system adds 714 compressed JS bytes over the original collection activation;
the reordered example adds 631. Both share one renderer and CSS. Closure sums
are conservative compressed asset estimates, excluding fonts; actual cold/warm
requests and fonts are measured separately by `npm run visual:semantic-cost`.
Do not equate the all-view union with one visitor's initial download.

Alternatives considered: omitting lazy consumers would undercount; removing
accepted examples would regress scope; a broad renderer refactor is not justified
by this bounded addition. Preserve complete consumers, make activation costs
visible, and retain executable gates instead. This does not justify future
automatic ceiling refreshes.

## Runtime cohort and limits

The real collection view and existing clock now participate in the production
one/ten-instance harness. It measures stages without standalone controls/prose;
the canonical-page cohort measures complete hosts separately. Different-model
cases alternate polynomial and system sources with changed bounded coefficients.

Initial local Chromium samples: 297 elements for one polynomial stage, 2970 for
ten identical stages, and 2515 for ten differing stages. The new collection
element ceiling is 340 per instance (14.5% over this maximum), tightened from
the temporary investigation allowance of 1500. CDP counts include text nodes
and are separate: after teardown and three repeated mount/play/dispose cycles,
nodes returned to 59 and listeners to 29, matching baseline. Warm instances
requested zero new resources. Mounted stage batches took roughly 27–30ms and
60-frame p95 intervals were about 16.8ms on this machine.

These timing samples include harness scheduling and are observations, not
portable performance ceilings or mobile measurements. Shared code/fonts are
cached; DOM/layout and clocks still scale with active instances. No virtualization
or claim of unlimited simultaneously mounted cards is introduced. Forced-GC heap
samples do not measure total process memory or prove absence of every leak.

Reproduce with `npm run build:semantic-cost`, `npm run measure:semantic-cost`,
and `npm run visual:semantic-cost`. Disposable reports live under
`tmp/codex/semantic-cost/`; this decision records the interpretation and limits.
