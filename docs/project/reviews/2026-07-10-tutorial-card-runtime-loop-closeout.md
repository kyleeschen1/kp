# Closeout Review: Tutorial Card Runtime Loop

Date: 2026-07-10
Status: closed loop
Run Contract: `run-contract.kp.tutorial-card-runtime-loop-v0`

## Summary

Closed the approved tutorial-card runtime loop after turning
`KpTutorialCardManifest` from a portable metadata contract into the start of a
renderer-neutral executable tutorial card runtime.

The loop was the right loop in hindsight. It converted the previous roadmap
direction into concrete runtime seams: manifest resolution, parent timeline
sampling, synchronized panel binding, equation and graph frame adapters, a live
linear-solve card sample, an HTML shell with controls, rewind verification,
SourceFile selectors, generated KaTeX fixture metadata, dependency planning,
and iframe/static-step export profile metadata.

## Completed Commits

- `08d2bdd` Materialize tutorial card runtime loop
- `8c4620d` Add tutorial card runtime resolver
- `4f910e7` Add tutorial card parent timeline
- `b595b95` Bind tutorial card layout to parent timeline
- `ccd7a56` Add tutorial card frame sampler
- `f271b2f` Add tutorial card equation frame adapter
- `8badd72` Add tutorial card graph frame adapter
- `6af166f` Add live linear solve tutorial card sample
- `e71c367` Add dashboard tutorial card sample target
- `74c9c10` Render tutorial card preview metadata
- `e33619b` Add tutorial card HTML shell
- `69c48ea` Mount tutorial card equation panel
- `9c5c990` Mount tutorial card graph panel
- `fd75ad2` Add tutorial card shell controls
- `636efee` Verify tutorial card rewind sampling
- `58e2bee` Add parent timeline marker placeholders
- `9537bef` Generate KaTeX fixtures from transformations
- `9e0913a` Add SourceFile semantic object shell
- `2c73116` Add SourceFile range selectors
- `8543a9f` Expose SourceFile in dashboard and API catalog
- `b5b1bb4` Add tutorial card dependency planner
- `89bc1f3` Resolve tutorial card iframe export profile
- `5254a9d` Resolve tutorial card step export profile
- `a49531d` Refresh tutorial runtime readiness report

## What Structurally Improved

- Tutorial cards now resolve typed runtime context from a manifest instead of
  relying on one-off page state.
- Parent timelines can sample child tracks deterministically and rewind through
  the same clock path.
- Layout, equation, graph, and controls panels now share a renderer-neutral
  frame model.
- Dashboard rows can launch and inspect the live linear-solve card sample and
  see current readiness evidence.
- Programming has a first semantic object foothold through `SourceFile` and
  stable source-range selectors.
- Export/embed planning is explicit enough to distinguish iframe, static-step,
  GIF, video, and dependency concerns before building encoders.

## Product Behavior Unlocked

- A tutorial can now be represented as a manifest, resolved into runtime refs,
  sampled at arbitrary progress, and rendered as a synchronized equation/graph
  card shell.
- Rewind can be tested through the parent timeline rather than inferred from
  CSS playback.
- Dashboard search and previews can expose tutorial-card readiness, sample
  targets, SourceFile status, and export profile state.
- Future iframe and static-step exporters have typed metadata to consume before
  media packaging exists.

## Verification

- `node --disable-warning=ExperimentalWarning --test tests/tutorial-card-export-profile.test.ts tests/tutorial-card-dependency-planner.test.ts tests/tutorial-card-manifest.test.ts`
  - Passed.
- `node --disable-warning=ExperimentalWarning --test tests/project-dashboard.test.ts tests/tutorial-card-export-profile.test.ts tests/tutorial-card-html-shell.test.ts tests/tutorial-card-frame-sampler.test.ts`
  - Passed.
- `npm run typecheck`
  - Passed.
- `npm run theseus -- validate`
  - Passed.

## Broad Verification Gaps

- No full browser/Playwright visual pass was run for this closeout slice.
- GIF/video export remains metadata-only, so there is no encoder output to
  verify yet.
- Iframe and static-step profiles are resolved metadata, not packaged artifacts.

## Residual Risks

- The HTML shell is still a static/server-rendered surface; it is not yet a
  packaged iframe or web component.
- Static-step export metadata exists, but no checkpoint document is emitted.
- GIF and video export profiles need concrete sampling and encoding paths.
- SourceFile selectors are not yet consumed by a programming tutorial panel.
- KaTeX fixture generation is still partial and should keep moving from
  curated geometry toward semantic transformation definitions.

## Recommended Next Slices

1. Package the iframe profile into a minimal embeddable card artifact with
   manifest id, dependency metadata, fallback behavior, and controls.
2. Generate a static step-sequence artifact from sampled parent timeline
   checkpoints.
3. Add a programming tutorial-card panel that consumes `SourceFile` selectors.
4. Add a lightweight visual/runtime smoke check for the live tutorial card
   shell.
5. Return to KaTeX transform fixtures and graph panels with the parent timeline
   as the required clock boundary.
