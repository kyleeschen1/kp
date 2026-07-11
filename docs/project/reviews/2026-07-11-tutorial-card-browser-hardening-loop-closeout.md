# Tutorial Card Browser Hardening Loop Closeout

Date: 2026-07-11
Status: closed

## Result

The tutorial-card browser hardening loop is complete. KP now has concrete,
browser-smokeable launch and embed surfaces for the linear-solve tutorial card,
iframe and static-step exports, programming SourceFile cards, programming
execution-trace cards, and synchronized comparison shells.

## Delivered

- Launch-target registry and Playwright dashboard launch smoke coverage.
- Iframe export browser smoke, embed policy metadata, dependency closure,
  fallback readiness, and serialized iframe asset manifests.
- Static-step export browser smoke and authored checkpoint markers.
- Shared seek smoke and nonblank panel probes for tutorial cards.
- Programming execution-trace frame contract, static fixture, panel renderer,
  tutorial-card sample, and browser smoke.
- Expanded graph parent-timeline diagnostics with active track span, local
  progress, and consistency booleans.
- Synchronized comparison card shell with browser smoke.
- Project dashboard and API catalog rows for the new hardening artifacts.
- Refreshed roadmap, semantic-runtime thread, and tutorial launch readiness
  report card.

## Verification Base

- Unit coverage spans dashboard/catalog rows, launch registries, export
  artifacts, fallback/dependency checks, iframe asset manifests, static-step
  markers, programming traces, graph diagnostics, and comparison samples.
- Browser coverage spans dashboard launch, iframe export, static-step export,
  programming SourceFile cards, shared seek/nonblank probes, execution-trace
  cards, and synchronized comparison cards.
- Theseus validation confirms the hardening loop nodes and events are valid.

## Residual Risks

- Hosted/package readiness is not yet proven outside the dev server.
- GIF/video export sampling and encoders are still not implemented.
- Browser smoke verifies reachability, deterministic metadata, and nonblank
  panels; it does not prove pixel-level visual parity.
- The SemanticObject registry and capability loading layer still need to become
  the durable source of dependency advertisement.

## Recommended Next Loop

1. Add hosted/package readiness checks for iframe asset manifests, dependency
   closure, and fallback behavior outside the dev server.
2. Start parent-timeline GIF/video export sampling.
3. Return to SemanticObject registry and capability loading so export artifacts
   can advertise exactly what each card requires.
