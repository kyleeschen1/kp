# Phase 1: Neutral Numeric Paint

## Goal

Keep `number` as a syntax and semantic role while resolving its optical paint to
the ordinary code foreground. A later instructional beat may still focus a
specific literal through its semantic identity.

## Expected files

- `src/editor/programming-surface.css`
- focused syntax-paint tests for TypeScript, Python, and Scheme

## Verification

- number-role spans remain present;
- the shared number paint token aliases the normal foreground;
- existing cross-language conformance checks remain green.

## Stop boundary

Do not alter tokenization, source semantics, trajectories, or salience state.
