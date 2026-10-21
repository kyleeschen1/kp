# Shared playback visibility and many-card costs

Approved by the user's “approve. go” following the concise-authoring delivery.
Execution authority: `run-contract.kp.reader-lifecycle-v1`.

Readers should keep their place when an animation leaves the viewport, without
each card allocating its own document listener and viewport observer. Authors
should reuse that responsibility without replacing their domain renderer or
clock. Two current consumers demonstrate the same policy: the free-shipping
code inspection and momentum/energy physics reader.

Packages, in order:

- `visibility`: share pause-on-hide registration at the reader runtime boundary;
  migrate those two consumers and test document isolation, multiple subscribers,
  cancellation, stale deliveries and final teardown.
- `measurement`: extend the existing semantic-cost harness with opt-in visibility
  suspension for actual dot/row/column/collection players. Measure ten-instance
  suspension and repeated disposal; keep the existing concurrent-play baseline.
- `integration`: run affected types, browser preservation and cost checks, record
  measured limitations and update the next-step pointer.

Canonical code artifact is the free-shipping runtime projection, rendered by
the TypeScript refactor DOM session in the code-reasoning publication. Canonical
physics artifact is its checked momentum-energy source, rendered by the existing
momentum-energy stage in mechanics-relations. Their source authorities, clocks,
layout, timing, controls, reduced motion and BFCache behavior remain unchanged.
Visibility only pauses; returning to view does not resume or reset. This is not
an autoplay authorization gate, unmount policy or general host framework.
Rollback units: shared visibility plus its two consumers; independently, the
benchmark extension. No visual treatment or catalogue-wide migration.

Acceptance: one observer and one document listener per document with live
registrations, none after final disposal; no disposed callbacks; real renderer
poses hold offscreen and after reentry until explicit playback. Measure DOM,
listeners and post-GC heap without calling local timings field performance.
Focused tests precede affected type checks and browser tests. Production build
and existing cost budgets bound overhead. Use impact routing and Theseus
validation. Commit implementation with evidence and back up each boundary.

Allow in-scope lifecycle and measured budget repairs. Exclude new pedagogy,
renderers, salience, universal lifecycle models and unrelated dirty files.
Maximum four hours, final quarter reserved for verification/closeout. Finish
when the three packages pass; stop for an unavoidable visual decision, external
blocker or resource ceiling and retain an accurate resumable record.
