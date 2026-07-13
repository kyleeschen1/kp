# KP Animation Asset Primary Unit

Status: accepted
Date: 2026-07-13

## Context

KP has grown beyond tutorial cards. The same semantic/time protocol should
support lessons, comparison cards, generated worked solutions, flashcards,
program traces, graph scenes, embeds, static steps, GIFs, and videos. Calling
the durable authored unit a "tutorial" narrows the design too early and makes
other use cases feel secondary.

Recent loops promoted generated algebra families into reusable semantic
transformation definitions, made fixtures consume those definitions, exposed
definition provenance in dashboard/export manifests, and attached default
visual motifs plus rewind laws. The next risk is letting future examples become
another set of tutorial-specific fixtures instead of typed, composable
animation assets.

## Decision

The primary KP artifact is now a **composable semantic animation**.

An animation is a typed, annotated asset that can contain:

- semantic objects and selectors;
- semantic transformations and transformation trees;
- correspondence, provenance, and law refs;
- visual motif defaults and overrides;
- timelines, beats, pauses, focus, emphasis, and rewind behavior;
- layout composition such as row, column, stack, tabs, overlays, and synced
  panels;
- renderer-neutral frames and view bindings;
- checks and diagnostics;
- sample targets, export metadata, and dashboard catalog metadata.

Tutorials remain an important use case and existing module boundary, but they
are consumers of semantic animations. New roadmap and Theseus work should use
"animation" for the reusable artifact and reserve "tutorial" for lesson-shaped
presentation flows or historical module names.

## Consequences

- New generated examples should aim to produce animation assets, not only
  tutorial fixtures.
- Builder APIs should compile animation assets into existing semantic objects,
  transformations, visual motif timelines, tutorial-card samples, dashboard
  rows, frame-sequence exports, and law checks.
- Renderer-specific effects remain downstream of semantic animation frames.
- LLM authoring should target a small typed animation API that is concise,
  inspectable, and decomposable.
- Curriculum, problem generation, flashcards, and media exports stay deferred
  until this animation asset contract is stable enough to preserve provenance
  and rewind behavior across consumers.

## Non-Goals

- Do not rename every existing `tutorial-card` module in the short term.
- Do not create a renderer-owned animation format separate from asset calculus.
- Do not broaden into curriculum generation or media encoders before the typed
  animation contract is proven on existing examples.
