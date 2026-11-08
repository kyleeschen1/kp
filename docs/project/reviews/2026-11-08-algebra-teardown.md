# Algebra card teardown evidence

Scope and approval: [bounded delivery](../2026-11-08-algebra-teardown-delivery.md).
Execution: `run-contract.kp.algebra-teardown-20261108`.

## Failure and owning invariant

The unchanged implementation again emitted `Reader timeline clock is disposed`
from the card's `visibilitychange` listener during Firefox page closure. The
24-case native mount run still reported passing test bodies. Explicit page-error
collection through `page.close()` did not reliably receive this final browser
protocol event; the Vite forwarded error did. A passing body was insufficient.

The shared `src/experiments/composed-algebra/card.ts` owner disposed its native
surface (including the timeline) before unregistering browser listeners. Its
resize callback checked the local disposed state; its visibility callback did
not. The violated invariant is that a card's external callbacks cannot command
its clock once card teardown begins. The clock's strict disposed-command error
is correct and remains unchanged.

The deterministic regression starts real canonical playback, then delivers
visibility while scheduler cancellation is releasing the clock. This is an
ordering pressure test, not a claim to reproduce Firefox's internal event
mechanism exactly. Against the unchanged implementation it failed all six
combinations: composed algebra, extended intuition and distribute/collect in
Chromium and Firefox, with the same disposed-clock stack. Ordinary synthetic
departure had passed six cases and missed the vulnerable interval.

## Repair and prevention

The existing card owner now unregisters resize/visibility/media listeners and
clears controls before releasing input, playback and the native surface. Its
visibility callback also checks the existing disposed state. No clock behavior,
presentation authority, native compositor, CSS or editor code changes.

This removes the listener before its resource becomes invalid and guards a late
or reentrant callback at runtime. Browser event ordering is not a static type
guarantee. The executable regression supplies that pressure; the clock unit test
also explicitly retains rejection of `pause()` after disposal. This is a narrow
lifetime repair, not a claim that all future browser lifecycle bugs are excluded.

## Focused evidence

- `npm run visual:algebra-mount -- --project=firefox --grep 'composed remount lifecycle'`:
  six failures before the fix; six passes after it. The scoped script includes
  Chromium and Firefox. Final departure, reentrant hiding, repeated disposal,
  resize/font notifications and stale controls are covered.
- `node --disable-warning=ExperimentalWarning --test tests/reader-timeline-playback-clock.test.ts tests/focus-deck-travel-playback.test.ts tests/composed-algebra-owner-paths.test.ts tests/composed-algebra-extension-architecture.test.ts`:
  15 passed, including strict clock disposal, revoked travel capability and
  canonical operation ownership.

## Integration evidence

- `npm run visual:algebra-mount -- --project=firefox`: all 24 passed, including
  native stops/reversal, interruption, Apply/remount, practice/source round-trip,
  collapsed viewport recovery and the new teardown probes. The previous Firefox
  closure diagnostic did not recur in this run.
- `npm run visual:algebra-editions -- --project=chromium --project=firefox`:
  23 passed; the existing Firefox performance-only probe remains skipped.
  Both complete production sources retain exact position and usable controls
  after retained-page pause, then release final ownership in both visibility
  event orders. Native motion, reload/reverse, local closure, no-script reading,
  departure during preparation and history coalescing also pass.
- `npm run build`: full application, Node, test, Svelte and domain typechecks,
  publication checks and production build pass. Svelte reports zero errors and
  warnings. This repair makes no claim to remove existing large bundle costs.
- `npm run check:architecture`: all boundary/authority gates and eight
  cross-domain registration checks pass.
- `npm run measure:algebra-editions`: every existing complete-consumer and
  static/interactive edition budget passes unchanged. Estimated per-file gzip
  totals are 374,347 bytes for edition JS and 406,572 for the authoring consumer,
  respectively +1 and +4 bytes from the maintenance measurement. CSS is
  unchanged; no new module, package, scheduler or lifecycle abstraction is added.
  These gzip sums are estimates, not measured HTTP transfer or speed gains.

No new human visual approval is required: this is deterministic behavior
preservation. The integrated annotation reader's earlier visual checkpoint
remains separate and pending. The next product step is that retained review,
then the already proposed explanation-first authoring experiment; this repair
does not authorize another maintenance campaign.
