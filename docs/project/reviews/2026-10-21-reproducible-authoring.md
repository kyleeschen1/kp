# Reproducible authoring: evidence and limits

The approved proposal owns scope; `run-contract.kp.reproducible-authoring-v1`
owns execution. The source-only calculus transfer remains mathematical evidence,
not acceptance of its presentation or a learning-effectiveness claim.

Baseline at `3f9116b34`: calculus supports checking and explicit preview, with
source-pinned locations requiring manual source reapplication after reload. There
is no edition command. Composed algebra already has immutable static editions,
exact-source reproduction and altered-byte rejection. Shared boundaries are
the compiled publication envelope, immutable edition writer and stylesheet
closure collector. Their existence does not establish complete output-directory
integrity or concurrent-write behavior; those are investigated in this run.

Baseline command `node --disable-warning=ExperimentalWarning --test
tests/calculus-authoring-transfer.test.ts tests/composed-algebra-publication.test.ts
tests/composed-algebra-publication-v2.test.ts` passes all nine tests.
`npm run measure:change-propagation` measures the existing production output:
76,642 declared initial JS bytes / 25,222 gzip; CSS 40,345 / 10,893 gzip;
HTML 58,781 / 6,004 gzip. This excludes fonts, dynamic editing imports and network
overhead. It is an asset-size baseline, not a timing measurement.

Identity contract: reuse the existing artifact `source.sha256` for exact selected
UTF-8 bytes, calculus `model.revision` for normalized source (including prose and
initial controls), and the writer-issued `byteEditionId` for the complete output
manifest. Whitespace may change source bytes without changing explanation identity;
styles/reader bytes may change the edition without changing the explanation.
Neither a valid envelope nor a digest proves mathematical truth: the domain
compiler must reproduce the publication from the selected source. No universal
identity migration or new identity type is required.

The shared writer now verifies all output entries, including unexpected files,
directories and symlinks. Its manifest algorithm and valid edition identities
remain unchanged. Interrupted writes clean staging; a concurrent rename collision
is accepted only after full verification of the winning directory. Six independent
processes plus injected write/rename/corruption cases exercise this boundary.

The second owner is the existing composed-algebra static edition, including its
four-state two-unknown transfer source and five-state primary source. Both retain
their existing semantic and rendering owners. Their publication checks now also
reject an undeclared nested file while retaining the original reading and byte
identity after removal. No new algebra code, interactive promotion or shared
compiler abstraction was needed.

Slice 18: `npm run check:reproducible-authoring` executes real check/build/check
CLI processes for both calculus sources (static and interactive) and the composed
two-unknown source (static). All five editions reproduce. The existing task
assessor now distinguishes selected function/initial-condition or ordered-state
intent from merely compiling. Valid alternate sources fail the selected task;
invalid sources return repair gaps with CLI exit 2. The first replay exposed an
incorrect harness expectation of exit 0 for repair; the harness now requires 2.
Four fulfillment tests and full typecheck pass. Rubrics are deliberately bounded
to authored notation and do not grade equivalent expressions, prose, author time,
model reliability or comprehension; zero external model calls were made.

Slice 19: all 27 packaged-reader checks pass in Chromium, Firefox and WebKit.
Both selected editions match canonical-editor native math and numerical readouts
at every checkpoint, fractional shrink and reverse. Keyboard Home/End, reduced
motion, 390px width, and interactive-edition reading with JavaScript disabled
pass. Static/interactive requests stay inside the local closure. Full typecheck
passes. Inspected the stationary phone and reversal desktop captures: existing
layout is retained without clipping; the phone remains tall and the presentation
remains dense. These are preservation results, not new pedagogical or aesthetic
acceptance. Reproduce with `npm run visual:calculus-editions` (canonical dev
server on port 8000); captures are disposable Playwright output.

Slice 20 costs (`npm run measure:calculus-editions`, independently built complete
consumers, sum of per-file gzip estimates):

| Consumer | Raw bytes | Gzip bytes |
| --- | ---: | ---: |
| Read-only edition JS, all chunks | 34,538 | 11,845 |
| Editor JS including lazy editing/rendering | 307,463 | 93,879 |
| Stationary static complete archive | 1,231,501 | 889,801 |
| Reversals static complete archive | 1,234,050 | 890,542 |

Static totals include source and publication evidence plus **all** CSS-referenced
font formats (1,076,572 raw font bytes), not merely requested fonts. Each manifest
adds 7,749 raw bytes. Static HTML is 54,329/5,189 and 55,525/5,310 raw/gzip bytes.
Interactive adds the edition JS and its script tag. Editor totals include a
78,760-gzip-byte lazy view chunk; that is excluded from read-only editions.
The earlier application initial-byte baseline is a different cohort and cannot
establish a directly comparable reduction. No font pruning or renderer changes
were needed; copying the complete CSS closure retains portability.

New explicit `calculus-edition-budgets.json` ceilings: edition JS 14,000 gzip,
complete editor JS 105,000 gzip, static closure 1,300,000 raw/950,000 gzip and
manifest 9,000 raw. These retain roughly 5–18% headroom, tighten the provisional
150,000-gzip reader test, and cover both sources and every lazy chunk. The two
cost tests reject over-budget reports. Existing complete matrix/algebra runtime
and TypeScript cohorts also pass `npm run measure:authoring-boundaries -- --check
--types`, without a budget amendment. Full typecheck passes.

`npm run visual:calculus-costs` measures unthrottled Chromium localhost separately
from heavy verification. Three fresh-context loads take 35.8–38.9ms to load;
same-context reloads 17.1–29.9ms. Observed ready (including automation overhead)
is 68.9–72ms cold / 45.6–60.6ms warm. Each requests seven resources plus the
document, 169,562 decoded bytes / 171,962 reported transfer bytes, with no observed
long tasks. The plain server supplies neither compression nor cache headers;
warm reload still transfers the bytes. These are diagnostics, not latency gates
or device-performance guarantees. Ten alternating editor previews keep one
ResizeObserver, zero after disposal, no staging remnants, five newly requested
dev modules on first Apply and zero additional requests thereafter. This guards
observer and preview ownership, not every possible heap leak. Both browser cost
checks pass. No cache architecture was introduced.

Slice 21: the author packet now documents distinct draft/displayed downloads,
static versus interactive editions, whole-location rejection, exact reproduction
and limitations. Real CLI replay passes again; copying the stationary source to
a different directory with the same basename reproduces the identical interactive
edition. The copied scratch source was removed. Both documented dev-server links
return HTTP 200 and a real Chromium check opens their correct embedded source and
active reader. Four packet/inventory tests pass. Roadmap, active thread and model
generation entrypoint now route to the delivered capability without visual promotion.

Exact retained identities (all values use the `sha256:` prefix):

| Source | Source bytes | Explanation | Interactive edition (algebra: static) |
| --- | --- | --- | --- |
| stationary-change | `b72dc94238b7aa8848b61b28563c2a143f8e6e64741e87ae4155a615e454d44b` | `b0a26cc4e04b2c1b7e7dbf437366a9a4024f4ac17b8bd3ce86103c161df0c1f2` | `5c0848ffa95fc23863705135f5e8fb0d34a1bd533cdc0f35d54be1894fd5dff6` |
| two-reversals | `d2295511aaca027f91264a43f52a144ff5fcf4ed6ed33e1f22c6d6f2445c674c` | `f661f8203260cc80a5b26c736ebd2c04e6cd1ed0723a9f3dc85bbf48c9607d34` | `7cd106266bd86fc61a77a05265444aca3001c5e4917451a801627c7b41b8feb9` |
| composed two-unknowns | `bafb57b37490cd33eef4b396b9d2fc0bda3a4ec3fb811575bc2a95c6037b6fa3` | `1c0027dd82c972d13d8ab04b9c3bae5f81beb2b1f9d5b807c8ca9a7f10f79a09` | `1f70c6f53b1fe8122a6a064364725fe101b599edb1c2f094d89a938034b724c5` |

The calculus static edition digests are respectively
`b3afaa6e7ed8cb1945b197b4f1c04b4a7d481dce5cef3eb046d224a0b7349c46`
and `387f194b695589718df5f003b22e64130f858e859beb4af594a8011c1607b497`.
Use the packet's working local URLs or the CLI JSON receipt directory. Renaming
the source basename changes publication provenance and therefore edition bytes;
moving it with the same basename does not.
