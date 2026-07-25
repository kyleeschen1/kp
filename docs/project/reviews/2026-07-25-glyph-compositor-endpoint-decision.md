# Glyph compositor endpoint decision

Date: 2026-07-25  
Status: retained bounded visual risk; native endpoint and semantic behavior pass

## Decision

Keep the generic scene compositor and do not add an endpoint correction for
the `(x+y)/2` fraction-merge exemplar.

The final jerk is real and repeatable, but it cannot be expressed as the one
bounded common scene translation permitted by the approved promotion plan.
The material scene remains the sole visual owner through progress `0.999`;
native KaTeX becomes the sole owner atomically at `1`. The residual is
therefore retained as a known presentation bug while the next inverse-split
exemplar proceeds through its own promotion gate.

Canonical reference:
`docs/project/reviews/2026-07-25-glyph-compositor-promotion-long-loop-proposal.md`.

Preservation boundary: native KaTeX DOM, semantic lineage, accessibility,
Cloze, hover, annotation, export, seek/rewind, and the already approved
fraction compositor remain unchanged.

Rollback unit: revert the endpoint diagnostics, common-alignment model, or
regression matrix independently. No runtime correction needs rollback.

## Measured cause

Dense material/native telemetry rules out reconciliation timing and rule
geometry:

- Exactly one of source native, material scene, or target native owns visible
  paint at every sampled frame. Forward, reverse, direct seek, and repeated
  play produce identical samples.
- At material progress `0.999`, correlated glyph track rectangles are within
  `0.25` CSS px of native target rectangles and structural-rule geometry is
  within `0.25` CSS px.
- The maximum measured glyph baseline residual is about `1.63` CSS px and is
  ratcheted below `2.5` CSS px across the supported matrix.
- The persistent plus clone retains its source font size: `65.824px` versus
  `46.0768px` at the wide checkpoint and `46.464px` versus `32.5248px` at the
  phone checkpoint. Other correlated glyph styles and fraction-rule style and
  thickness match their native targets.

The visible overlap at `0.999` is consequently a paint-style adaptation
mismatch on the persistent plus clone, followed by exact native settlement at
`1`.

## Why no correction was applied

The pure alignment gate accepts a correction only when every correlated atom
agrees on paint identity, style, shape, and one translation bounded to one CSS
pixel. It rejects style mismatches, shape changes, delta outliers, and
unbounded corrections.

The measured plus mismatch fails that gate. Repairing it would require
per-atom font scaling and baseline adaptation while other atoms remain
unchanged. That is not a common scene translation and would cross the
approved boundary into notation-sensitive paint handling. No native DOM
mutation, per-glyph offset, scale exception, or fraction branch was added.

## Regression boundary

The retained behavior is covered at wide DPR1 and phone DPR2, including font
settlement, resized reloads, forward sampling, reverse sampling, direct seek,
and two complete replay cycles.

Required observable checkpoints:

- `npm run test:real-katex-glyph-compositor`: common-alignment consensus,
  inverse, tolerance, outlier, paint, style, shape, bound, and invalid-input
  paths.
- `npm run test:browser:real-katex-glyph-compositor`: exclusive ownership and
  endpoint residual ceilings across the browser matrix.
- `npm run visual:glyph-reconciliation-experiment`: 10 overview and 14 dense
  endpoint captures; material `0.999` must continue to expose the known
  overlap and native `1` must remain exact.
- `npm run perf:glyph-reconciliation-experiment`: isolated cold-plan,
  cached-plan, frame-sampling, payload, and route-growth budgets.
- `npm run check:reader-production`: all manifest reader routes remain closed
  for production.

Evidence commits:

- `b4e23ca2` — atomic ownership trace
- `0f284199` — fail-closed common-alignment model
- `7b726a80` — intentional no-op correction decision
- `42bb72b7` — endpoint regression matrix

## Review-inbox audit

`npm run review:logs -- audit` reports byte-stable source replay and stable
note identity/order. The current round is
`review-round.legacy.2.d0920d5fd3c6` with 16 notes: 15 new and one verified.
None targets the glyph-reconciliation experiment or this endpoint handoff;
the current notes concern older reader routes and remain separate work. No
note status or Codex cursor event was appended.

## Promotion consequence

The endpoint microscope is closed with an explicit bounded risk, not a hidden
fix. The inverse fraction split may proceed only through the existing generic
observation, reconciliation, lifecycle, track, and sampler contracts. A
fraction-specific matcher, lifecycle, structural primitive, timing category,
or endpoint correction remains a stop condition.
