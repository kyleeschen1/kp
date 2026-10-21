# Concise authoring and prepared-card loading

Scope: the approved October 21 architecture agenda. Theseus owns package state.
No new visual treatment, semantic operation, renderer or learner claim.

## Authoring result

`content/authoring/convergence/matrices.ts` now imports one domain namespace and
uses `M.matrix`/`M.product`, removing its local scalar-and-matrix construction
helper. Literal dimensions, stable scalar IDs and object identity remain intact.
The two composed-algebra-intuition page/editor callers use `algebra.compile`,
`algebra.serialize`, and `algebra.session`. These algebra exports are aliases,
not a new chain language; existing source complexity remains. The concise guide
is `../authoring/concise-domain-api.md`.

`tests/concise-authoring.test.ts` compares canonical math objects and complete
algebra animation artifacts, exercises source mutation, dimensions, nonfinite
values, malformed shapes, source round-trip and located invalid-math repairs.
Matrix, composed-algebra, architecture and full typecheck commands passed.

## Loading diagnosis and repair

Invariant: a host holding its exact checked asset and registering its renderer
must not activate a whole catalogue pack merely to initialize playback.
`hydrateKpEditorAnimationPlayers` with asset overrides still called catalogue
loading. The logarithm card now uses the existing
`hydrateKpPreparedEditorAnimationPlayer` owner. No clock, catalogue protocol or
rendering semantics were replaced. Failure is surfaced on the card, pending
initial polling is cancelled, and disposal prevents late error writes.

On production tax-page requests through startup plus the first interaction:

| Measurement | Before | After |
| --- | ---: | ---: |
| JavaScript raw bytes | 1,892,900 | 1,448,733 |
| JavaScript gzip bytes | 512,946 | 392,893 |
| Additional resources after remaining card activation, gzip | 140,669 | 140,669 |

The initial JavaScript saving is 120,053 gzip bytes (23.4%). Wholly offscreen
cards remained idle; the partially visible logarithm stage activated as before.
No page errors were observed. This is local Chromium at 390×844, with 1x/6x CPU
sensitivity samples on M2; it is not field-performance certification. Timings
remain variable with significant throttled stalls, so no startup-speed
improvement is claimed. The deterministic result is the request reduction.

Reproduce with `npm run build:bundle`, then
`npm run audit:architecture-cost -- --browser --tax-only --activation --acceptance`.
The request acceptance rejects algebra catalogue chunks even below byte ceilings.
Initial JS ceiling tightened from 550,000 to 425,000; activated JS from 660,000 to
570,000; total resource ceilings from 625,000/740,000 to 500,000/650,000. CSS and
font ceilings are unchanged. These retain headroom above complete measured
consumers; no consumer or field is omitted to claim the saving.

The focused browser cohort initially passed six tests and failed two older
checks that assumed offscreen cards were eagerly ready. Those tests now cause
visibility before requiring live renderers, retaining all original assertions.
Rerun passed all eight checks: prepared forward/reverse, delayed first keyboard,
button and travel input, pagehide disposal/persistence, four card hosts and URL
ownership. Command: `npm run visual:focus-deck-input -- --grep 'prepared logarithm|deferred|semantic navigation|one route hosts'`.
The 31-test multi-card unit suite and two loading acceptance tests passed.

## Verification boundaries and next work

The first full-suite attempt could not bind loopback HTTP test servers under the
sandbox (`listen EPERM`), confirmed separately in `server/app.test.ts`; it was
interrupted and rerun with local-server permission. This is not a passing suite
claim; the final run outcome is recorded separately in Theseus.

The permitted full run completed with 7,321/7,323 passing. The generated
reachability inventory differed only in `scannedFileCount` (4,979 → 4,996),
with unchanged roots and callers; the supported generator refreshed that count
and all 12 reachability/caller checks passed. The CLI test's subprocess returned
no exit status under a long run; its unchanged five-test file passed separately
(the stdin subprocess check took 539 ms). No timeout was raised or check removed.
A clean full rerun is required before reporting full-suite success.

Next architectural priorities remain reducing repeated host lifecycle wiring
and measuring many-card idle/disposal costs. Reuse the existing clocks, frame
scheduler and deferred sessions. Do not expand this narrow loading fix into a
new renderer or a catalogue-wide API rename. The prior calculus visual gate
remains unaccepted and is not resolved by these engineering checks.
