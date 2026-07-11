# Tutorial Card Browser Hardening Readiness Refresh

Date: 2026-07-11
Status: active

## Summary

The tutorial-card browser hardening loop has moved KP beyond metadata-only
export confidence. The dashboard and API catalog now expose browser-smokeable
surfaces for iframe/static-step exports, programming execution traces,
synchronized comparison shells, iframe asset manifests, dependency closure, and
fallback readiness.

## What Changed

- Browser smoke coverage now reaches dashboard launch targets, iframe export
  documents, static-step export documents, SourceFile programming cards,
  execution-trace programming cards, and synchronized comparison shells.
- Tutorial cards can be sampled at deterministic progress points with shared
  clock, scrubber, beat, and nonblank panel checks.
- Iframe exports now expose embed policy metadata and serialized asset
  manifests.
- Static-step exports preserve authored markers on checkpoints and rendered
  step frames.
- Graph diagnostics now report active track span, local progress, and explicit
  parent-timeline consistency booleans.
- Project dashboard and API catalog rows expose the hardening artifacts and
  their verification evidence.

## Remaining Risks

- Hosted/package readiness is not yet proven outside the dev server.
- GIF/video export still has no media sampler or encoder path.
- Browser smoke verifies reachability and basic content, not pixel-level visual
  parity.

## Recommended Next Moves

1. Close the browser hardening loop with a concise residual-risk report.
2. Add hosted/package checks for iframe asset manifests and fallback behavior.
3. Start GIF/video export sampling from parent timeline frames.
4. Return to the SemanticObject registry and capability loading layer.
