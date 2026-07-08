# SVG Light and Shadow Rendering

Date: 2026-07-07

Status: Accepted

## Context

The SVG 3D renderer already computes surface normals from executable math
expressions and AD-backed gradients. It also builds a camera-space software depth
scene for axes, borders, curves, and surface visibility metadata.

Lighting and shadow should build on that semantic geometry instead of switching
the renderer to WebGL. The goal is clearer educational 3D diagrams that remain
inspectable SVG with semantic metadata.

## Decision

Implement light and shadow in stages:

1. Make light settings explicit semantic graph data.
2. Move per-cell lighting into a testable renderer helper.
3. Render improved ambient/diffuse/depth-haze lighting from graph light settings.
4. Add projected ground-plane shadows as the first shadow feature.
5. Keep light-space self-shadowing behind debug/prototype flags until it proves
   useful and affordable.

## Rendering Model

Surface cells remain fully opaque. Light changes cell color; it does not use
surface opacity as an occlusion mechanism.

Projected shadows are SVG geometry derived from the same sampled surface quads.
They should render as low-opacity polygons behind the lit surface, not as CSS
box shadows.

Self-shadowing, if added, should use a separate light-space software depth scene
that is analogous to the existing camera depth scene. It should report metadata
and budget impact before becoming a default visual feature.

## Consequences

The renderer keeps one semantic/event surface: SVG. Light settings, shadow
settings, and diagnostic metadata must be visible in the emitted asset.

Flat coordinate scenes should keep lighting and shadows disabled unless promoted
to spatial mode, matching the coordinate-scene render-model decision.

Performance budgets must include any extra depth buffers or shadow geometry so
lighting improvements do not silently make SVG rendering too expensive.

## Non-Goals

This decision does not require WebGL, physically correct global illumination,
soft shadow simulation, or default self-shadowing.
