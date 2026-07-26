# Fraction typography handoff checkpoint

Date: 2026-07-26

Status: awaiting explicit human visual approval

Canonical exemplar: `/glyph-reconciliation-experiment.html`, “Merge equal
native denominators”

Source proposal:
`docs/project/reviews/2026-07-25-canonical-equation-renderer-convergence-long-loop-proposal.md`

Run contract:
`run-contract.kp.canonical-equation-renderer-convergence-v1`, slice 14

## Decision at this checkpoint

The generic target-style reverse-FLIP handoff fixes the late endpoint collision
in `(x/2 + y/2) → (x+y)/2`. The fraction remains on one stable vertical anchor;
the compositor does not move it to another line to avoid overlap. At 99.9%,
moving glyph paint already uses the native target typography and converges to
its geometry before exact native target ownership begins at 100%.

The retained raw playback reproduces the old defect without a separate legacy
implementation. It uses the same scene and clock while bypassing only the new
typography realization. In the comparison sheet, the raw 99.9% frame visibly
collides through the numerator and fraction rule. The corrected 99.9% frame is
visually continuous with the exact native endpoint in wide and phone layouts,
with normal and reduced-motion media preferences.

## Named visual evidence

Run:

`npm run visual:glyph-reconciliation-experiment`

Review:

`tmp/codex/glyph-reconciliation-experiment/fraction-typography-checkpoint-contact-sheet.png`

The four rows are:

1. wide, normal motion
2. wide, reduced motion
3. phone, normal motion
4. phone, reduced motion

Each row compares the retained raw handoff at 99.9%, the corrected handoff at
99.9%, and exact native ownership at 100%. Disposable source-frame paths and
the row manifest are recorded in
`tmp/codex/glyph-reconciliation-experiment/fraction-typography-checkpoint.json`.

## Objective evidence

- Source and target roots share a center anchor within 0.1 px at every dense
  checkpoint from 96% through 100%.
- At 99.9%, the largest glyph baseline residual is 0.0104 px wide and
  0.0096 px on phone.
- At 99.9%, the largest glyph rectangle residual is 0.0867 px wide and
  0.0098 px on phone.
- Moving glyph material has the native target paint fingerprint before the
  atomic ownership transfer.
- Fraction rules remain on the existing structural geometry path; no
  fraction-specific exception was added.
- One inert, `aria-hidden` material scene owns interior ink. Native source and
  target DOM retain semantic, focus, hover, annotation, Cloze, static-JS, and
  export authority.
- Direct seek, rewind, normal motion, and reduced motion use the same
  deterministic scene plan.

## Human acceptance criteria

Approve only if:

- the corrected 99.9% frame and exact native target read as one continuous
  endpoint rather than a snap;
- the numerator, denominator, and fraction rule do not collide;
- no unexplained line or baseline change remains;
- the result is legible and balanced on both wide and phone layouts; and
- reduced motion preserves the same exact settled state.

## Preservation and rollback boundary

Approval permits slice 15 to begin convergence on one canonical renderer
session with capability-selected native continuity, atom transit, and
checkpoint settlement modes. It does not approve every domain animation or a
global visual rollout.

Rejection rolls back at the fraction typography-realization wiring boundary.
It preserves the native DOM authority model, semantic scene contracts,
measurement telemetry, total reconciliation, structural paint handling, and
the existing non-glyph animation guidance. No second product implementation is
created by this checkpoint.
