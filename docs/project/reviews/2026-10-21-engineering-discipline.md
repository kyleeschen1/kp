# Engineering discipline: measurements and decisions

Scope: [approved portfolio](../2026-10-21-engineering-discipline-portfolio.md).
Theseus owns execution state; this review records findings, not a second queue.

## Baseline

The retained production build reproduces 392,893 initial gzip JS bytes for the
tax page. Six browser samples (three each at 1x/6x CPU) pass existing activation
acceptance. At 6x: ready 1,318–1,457 ms, startup script 767–813 ms, maximum
interaction frame gap 216–266 ms. At 1x: ready 274–601 ms, max frame gap
32.5–34.1 ms. Local M2 Chromium with built-file fulfillment; no field latency
claim. Command: `npm run audit:architecture-cost -- --browser --tax-only --activation --acceptance`.

`npm run measure:revision-preparation` consumes complete source/check/static
HTML results across 25 repeats. Bayes median 4.72 ms / p95 8.07 ms; algebra
median 3.17 ms / p95 5.69 ms. It does not measure browser mount/layout. Small
warm compilation costs argue against a general compiler cache; eliminating a
demonstrated duplicate check is simpler and safer.

Concrete opportunities:

- A prepared logarithm card still imports the full 63,504-byte source metadata
  catalogue to select one descriptor. The numeric authoring card does the same.
  Generated per-consumer data can retain exact metadata without building a new
  descriptor policy. Measure actual emitted/requested savings before claiming it.
- Bayes history restoration checks a source, validates its location, then
  passes the serialized source to a session that checks it again.
- Bayes has its own document/viewport pause wiring despite the accepted shared
  visibility owner. Its native preparation and restoration remain domain-local.
- Offscreen retained DOM alone does not authorize eviction or new interaction
  policy. Larger savings requiring that change must be separately reviewed.

The workspace doctor reports no failed checks or incomplete transaction.
Existing queue choices, locally modified generic skills, older open receipts
and missing-source audit pressure are not owned by this delivery. Do not clear
them merely to make a readiness report green; the approved explicit run owns
this work and its local receipts.

## Exact prepared descriptors

The existing metadata generator now also emits two typed, narrow projections
for the prepared log/exponent card and numeric change-of-base authoring card.
Both retain exact descriptor equality against the complete catalogue, including
promotion and controls. The full picker remains unchanged. Static runtime
closure tests prevent either standalone caller from importing that catalogue.
No descriptor policy or alternate hand-maintained data was introduced.

Tax initial JS: 1,448,733 → 1,400,803 raw bytes; 392,893 → 387,663 gzip
bytes (5,230 bytes, 1.33%). Deferred additional JS stays 140,669 gzip bytes.
This is a measured loading reduction, not a demonstrated latency improvement:
the new 6x samples show ready 1,248–1,541 ms and max frame gaps 200–216 ms,
with noisy scheduling and overlapping local verification. Existing cost
ceilings remain unchanged; dependency and exact-value checks protect the repair.

Metadata parity tests, full typecheck, production build and six production
tax loading samples pass. Eight focus-deck browser checks preserve first input,
deferred activation, pagehide, reverse and URL ownership. The numeric authoring
host is checked through its existing browser command.

## Lifetime ownership

Bayes now uses the existing document-owned playback visibility mechanism.
Its signal is aborted before the clock is disposed; resize, fonts, BFCache and
history remain local. Repeated source swaps pass with zero idle mutations and
no surviving writes to detached cards. No scene eviction or automatic resume
policy was introduced, and mounted DOM is not claimed to have shrunk.

The new initial-hidden pressure case failed before the repair: immediate pause
called the subscriber directly and threw out of registration. Both immediate
and later notification now use the same error-isolating owner. Both cases pass,
including reporting the original error and allowing the other card to pause.
The full seven-test semantic-cost cohort passes, covering four ten-player
families, repeated disposal, multiple documents, cold/warm and concurrent use.
Full types and Bayes responsive/repeated-Apply browser tests pass.

The first fixture run waited on missing built files after a main build cleared
dist; rebuilding the existing fixture allowed the intentional regression to
execute (one pass, one failure). This is an execution prerequisite problem,
not a runtime failure or a passing pre-repair run. P6 will make it explicit.
