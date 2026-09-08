# R1 release verification

Status: passed; Theseus owns execution progress and contract closeout.
Contract: `run-contract.kp.authoring-round-trip-v1`, s25.

## Release-discovered repairs

The first full `npm test` stopped at the existing equation-authority ratchet:
the bounded authoring host had added a loading timeout. It did not drive motion,
but was unnecessary extra timer ownership. The timer was removed rather than
adding an architecture exception. Native readiness/failure events and explicit
edit/restore/dispose cancellation now own preparation completion.

The first supported-browser authoring cohort passed seven of nine checks.
Firefox and WebKit exposed a resize/seek ordering race: input could project
old measured typography after layout changed but before ResizeObserver delivery.
The existing native surface now checks its geometry key at the paint boundary,
retains current owners during remeasurement, and commits the latest semantic
position with current native measurements. A failed remeasurement does not
attempt to repaint stale geometry. No native paint assertion was weakened.

The geometry key also includes responsive endpoint font size, and the existing
observer watches native display boxes. This covers font changes at constant
card width. The scoped browser test pressures widths 1280, 900, 800 and 390,
with actual material-ink bounds, revision changes, reverse navigation, continuous
swipes, reduced motion and keyboard controls. This is lifecycle repair, not new
choreography or family promotion.

## Inventory and fixture repairs

The broad unit run also found the generated exact reachability inventory stale
after R1's source/test additions (4,311 versus 4,332 scanned files). The existing
generator refreshed six caller edges and the file count; all 68 declared roots
and the nine-path fallback audit remained unchanged. The 12 focused reachability
and API-ledger tests pass. A later build caught a test-fixture inference error
for optional narration; the fixture now constructs that property explicitly,
without changing the runtime request contract.

The full rerun exposed one additional stale coverage-view fixture from s04:
the UI expected four Registered and fifteen Missing rows, while the earlier
evidence repair correctly produces six Registered and thirteen Missing rows.
The test now asserts those counts and explicitly retains the series/fraction
gaps. Direct support remains eleven. That already-failed run was stopped before
a clean rerun; cancellation output from the stop is not product-failure evidence.

## Passing release gates

- `npm test`: all 6,672 tests pass, zero failures/cancellations/skips, plus the
  architecture/conformance/inference/catalog/promotion preflight gates.
- `npm run typecheck`: app, node, tests, Svelte and domains pass on final code.
- `npm run build`: production build passes (1,699 modules). The existing generic
  large-chunk advisory remains; it is not substituted for fixed route budgets.
- `npm run check:reader-production`: all 12 manifest routes pass.
- `npm run check:reader-budgets`: all unchanged 5% growth limits pass.
- `npm run visual:canonical-tax-production -- --project=firefox --project=webkit`:
  all 18 checks pass across Chromium, Firefox and WebKit, including whole-step
  sibling arrows, gradual phone code-card swipes, reduced motion and no-JS facts.
- `npm run visual:authoring-market -- --grep 'equation authoring' --project=firefox --project=webkit`:
  all nine final equation checks pass across the same browsers.
- `npm run test:browser:logarithm-change-of-base`: all three canonical checks pass.
- `npm run visual:authoring-market`: all 13 final combined workflow checks pass,
  including real source break/repair, selected export, filesystem build and no-JS
  equation MathML. Test-owned source edits are restored before completion.
- Canonical tax source and the 63-file reviewed selected edition remain current;
  source and payload digests are unchanged from the checkpoint record.

The actual seven-case live planner trial and its
initial stale-evaluation failure are recorded separately in
`2026-09-07-authoring-round-trip-live-trial.md`.

Release commands and their final outcomes are recorded in Theseus. This is the
bounded R1 release, not certification of every mathematical family. Generated
screenshots, browser traces, live model responses and local reading editions
remain disposable; committed commands/tests and durable fingerprints own proof.
