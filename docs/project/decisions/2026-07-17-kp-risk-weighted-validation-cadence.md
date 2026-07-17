# Risk-Weighted Validation Cadence

Date: 2026-07-17  
Status: accepted  
Scope: KP autonomous development loops and animation-system work

## Decision

Use focused verification as the default for each implementation slice, then
escalate according to the risk introduced by that slice. Broad verification is
a periodic and boundary-level checkpoint, not an automatic cost paid after
every adjacent change.

This policy governs future loops as well as the current semantic material
motion run. A run contract may tighten it, but should not silently replace it
with a blanket full-suite cadence.

## Default Slice Gate

Every slice must run:

1. the directly affected unit or contract tests;
2. `npm run typecheck` when TypeScript source or a typed public contract changes;
3. `npm run theseus -- workspace validate` before the slice is completed.

The slice's stored summary must name the expected gate. The completion evidence
must record the checks actually run; a broad checkpoint never excuses a failing
focused regression.

## Risk-Based Escalation

Add only the checks implicated by the change:

- Renderer, interaction, or visible choreography: focused Playwright scenarios
  and manual checkpoint-frame review when motion quality is part of acceptance.
- Imports, lazy-loading boundaries, exports, or production bundling: production
  build and bundle-size comparison.
- Frame-loop work, geometry reads, timing, loading, or cost policy: the focused
  performance harness, including a constrained-device pass when relevant.
- Layout, clipping, containment, or stage sizing: overflow and scrollbar tests
  at representative viewports.
- KaTeX material, typography, or native settlement: focused KaTeX browser tests.
- Accessibility or reduced-motion behavior: the corresponding browser and
  semantic-state checks.

Run the smallest representative browser cohort first. Broaden only when the
failure or architectural surface indicates that neighboring families may have
been affected.

## Broad Checkpoints

Run the full unit suite, production build, representative browser cohort, and
applicable performance/overflow gates:

- after each five-slice block in a long loop;
- at a major shared-abstraction or loading boundary;
- before loop closeout;
- after a focused failure reveals plausible cross-cutting impact.

For the active semantic material motion run, the remaining scheduled broad
checkpoints are slices 19, 24, 29, and the mandatory closeout at slice 30. The
full suite completed after slice 13 is the baseline for slices 14–18.

Do not repeat a broad checkpoint on adjacent slices unless shared code changed
after the preceding checkpoint or a failure supplies a concrete reason.

## Execution Discipline

- Lightweight independent checks may run in parallel.
- Do not co-run the full unit suite with performance measurements or broad
  browser suites: CPU and memory contention make both slower and make timing
  evidence less trustworthy.
- On failure, rerun the exact failing case, fix it, and run its focused
  regression cohort. Escalate only when the failure suggests wider impact.
- Report the achieved verification level accurately. `focused`, `standard`, and
  `broad` describe evidence actually collected, not intent.

## Rationale

Browser and visual checks remain necessary: they have caught ordering,
visibility, typography, and clipping defects that type and unit tests could not.
The avoidable cost came from repeatedly running the same 1,300-plus-test suite
on consecutive slices whose risks were already isolated by focused tests.

Risk-weighted validation preserves the high-value evidence while shortening the
feedback loop. Periodic broad checkpoints cap integration risk and prevent many
small locally-correct changes from drifting into a broken whole.
