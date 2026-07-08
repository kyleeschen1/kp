# Phase 1: Smoothing Helpers

## Goal

Add reusable smoothing primitives and apply them first to low-risk visual paths:

- 2D curve path generation.
- 3D surface visual border data used by SVG/WebGL.

## Scope

- Add a small rendering utility for Catmull-Rom to Bezier path commands or equivalent smoothed polyline metadata.
- Keep mesh internals straight for now; smoothing every mesh line can misrepresent sampled surfaces.
- Preserve existing SVG smoothing metadata (`data-kp-smoothing`) and AD-gradient Bezier behavior.

## Expected Files

- `src/rendering/graph-smoothing.ts`
- `src/rendering/graph-svg.ts`
- `tests/rendering.test.ts` or a focused new smoothing test file

## Verification

- Focused smoothing/rendering tests.
- `npm test`
- `npm run typecheck`
- `npm run build`
- `git diff --check`

## Commit

Commit after this phase with a concise smoothing message.
