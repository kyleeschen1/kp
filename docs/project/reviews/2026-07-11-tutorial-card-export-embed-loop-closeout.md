# Closeout Review: Tutorial Card Export/Embed Loop

Date: 2026-07-11
Status: closed loop
Run Contract: `run-contract.kp.tutorial-card-export-embed-loop-v0`

## Summary

Closed the approved tutorial-card export/embed loop after turning export profile
metadata into concrete iframe and static-step artifact records, adding the first
programming tutorial-card sample, and tightening graph/runtime diagnostics
around the shared parent timeline.

The loop was the right loop in hindsight. It kept GIF/video, broad renderer
work, and programming execution traces out of scope until KP had a concrete
artifact boundary for tutorial cards. The result is a cleaner path from
`KpTutorialCardManifest` to exportable tutorial surfaces:

```text
manifest -> parent timeline -> synchronized sampled frames -> export artifact
```

## Completed Commits

- `5db9dfd` Materialize tutorial card export embed loop
- `ab4d4ae` Define tutorial card export artifact contract
- `83dbaf8` Resolve iframe export artifact metadata
- `a82c555` Render iframe export document shell
- `eba3343` Serialize iframe export metadata
- `5f4bbdc` Expose iframe export artifact in dashboard
- `6d34bd8` Add iframe export smoke fixture
- `3b1692f` Define static step export artifact contract
- `f2f8b73` Select static step checkpoints from timeline
- `f7cdcca` Render static step sequence artifacts
- `7e95e80` Expose static step export sample
- `59569d5` Add tutorial export artifact catalog
- `d679672` Define programming tutorial panel contract
- `e6e3c02` Add source file frame adapter
- `306b9c8` Render source file tutorial panel shell
- `802f4bc` Add programming tutorial card sample
- `a49201b` Promote generated fraction katex fixture
- `bd1a457` Add graph parent timeline diagnostic
- `d3ffeba` Refresh export embed readiness report

## What Structurally Improved

- Export artifacts now have a typed contract separate from export profiles.
- Iframe exports can resolve artifact metadata, dependency records, fallback
  metadata, and a minimal HTML document shell from a tutorial-card manifest.
- Static-step exports can select checkpoints from the parent timeline and render
  deterministic step sequence artifacts.
- The dashboard/API catalog now exposes concrete iframe and static-step export
  sample rows instead of only future export profile intent.
- Programming tutorial cards have a first panel contract, SourceFile frame
  adapter, static panel shell, and sample card.
- The generated KaTeX fixture path advanced with a second fixture promotion.
- Graph panels now have a parent-timeline diagnostic that catches progress and
  child-frame drift.

## Product Behavior Unlocked

- The dashboard can search for and inspect export artifact samples, not just the
  live tutorial card.
- An iframe embed can carry manifest identity, dependency metadata, controls,
  and fallbacks through one artifact resolver path.
- Static tutorial cards can be represented as checkpointed frame sequences
  suitable for docs, review cards, and future static exports.
- Programming examples can join the same tutorial-card shell as equations and
  graphs, starting with static SourceFile selectors.
- Future media export work can consume sampled parent timeline frames instead of
  inventing a separate timing model.

## Verification

- `node --disable-warning=ExperimentalWarning --test tests/project-dashboard.test.ts tests/project-dashboard-theseus-adapter.test.ts tests/tutorial-card-export-artifact-catalog.test.ts tests/tutorial-card-static-step-artifact.test.ts tests/programming-tutorial-card-sample.test.ts tests/tutorial-card-graph-frame-adapter.test.ts`
  - Passed.
- `npm run typecheck`
  - Passed.
- `npm run theseus -- validate`
  - Passed.

## Broad Verification Gaps

- No Playwright browser pass was run across the exported iframe/static-step
  launch paths in this loop.
- GIF and video exports are still profile/plan level only; there is no encoder
  output to verify.
- Programming tutorial cards currently cover static source frames, not execution
  timelines, locals, stack frames, or runtime state.
- Graph diagnostics cover the current mesh sample and should be expanded before
  claiming broad graph-runtime readiness.

## Residual Risks

- Iframe/static-step artifacts are concrete but still need hosted packaging and
  dashboard launch smoke coverage.
- Static-step checkpoint selection is deterministic, but richer authoring
  markers, pauses, and annotations need stronger semantics.
- Export artifacts now expose fallbacks and dependencies, but capability loading
  is still not a full package/runtime boundary.
- Generated KaTeX fixtures remain partial; many transform families still rely
  on curated geometry.

## Recommended Next Slices

1. Add browser smoke coverage for iframe, static-step, and programming sample
   launch paths.
2. Add hosted/package readiness checks for iframe artifact dependencies and
   fallbacks.
3. Extend programming tutorial cards from static SourceFile panels into
   execution-trace frames.
4. Start GIF or video export sampling from parent timeline frames after the
   iframe/static-step paths stay stable.
5. Expand graph diagnostics from the current mesh sample into richer graph
   transforms and synchronized comparison cards.
6. Return to the SemanticObject registry and capability loading layer so export
   artifacts can advertise exactly what each card needs.
