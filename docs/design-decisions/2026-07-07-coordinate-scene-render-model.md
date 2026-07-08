# Coordinate Scene Render Model

Date: 2026-07-07

Status: Accepted

## Context

Kinetic Press currently has separate semantic graph families for 2D and 3D
graphs, while the renderer is moving toward shared projection, animation,
occlusion, lighting, and depth machinery. This should not be graph-specific.
Physics demos, geometric constructions, simulations, and other authored objects
can also live in coordinate systems and should be able to move between flat and
spatial presentations.

## Decision

Any semantic object with a coordinate system should be normalized into a shared
internal coordinate-scene render model.

2D coordinate scenes are treated as constrained 3D scenes:

- 2D points become `{ x, y, z: 0 }`.
- 2D axes and curves become 3D lines/curves on the `z = 0` plane.
- Flat scenes lock the camera to the XY plane.
- Flat scenes hide the z-axis.
- Flat scenes disable z-rotation controls.
- Flat scenes skip depth classification or force all geometry to `visible`.
- Flat scenes disable lighting, cast shadows, and surface occlusion unless the
  scene is explicitly promoted to spatial mode.

Public semantic object types can remain specific and author-friendly, such as
`graph-2d`, `graph-3d`, or future physics scene objects. The shared coordinate
scene is an internal render and animation model, not a requirement that all
public JSON become `graph-3d`.

## Why

This gives KP one place to implement coordinate-aware behavior:

- projection;
- animation and tweening;
- dimensional promotion from 2D to 3D;
- depth and occlusion;
- lighting and shadow;
- hit targets and semantic SVG overlays.

It also makes demos like kernel methods natural. A 2D dataset can begin in a
flat coordinate scene and animate into a lifted feature space without switching
renderer families:

```text
(x, y, 0) -> (x, y, phi(x, y))
```

Physics scenes get the same benefit. A flat projectile, oscillator, field, or
phase portrait can start as a 2D coordinate scene and later expose depth,
camera, trails, surfaces, or spatial force fields by enabling spatial features.

## Consequences

Renderer APIs should move toward names like `CoordinateScene`, `CoordinateAxis`,
`CoordinateCurve`, `CoordinateSurface`, and `CoordinateCamera` rather than
graph-only names.

Graph-specific semantics should be adapters into this model, not the model
itself. Future physics and simulation objects should use the same adapter
boundary.

Feature toggles should be explicit. A flat coordinate scene should not pay for
depth buffers, lighting, shadows, or z-axis controls until those capabilities
are enabled.

## Non-Goals

This decision does not require deleting `graph-2d` or `graph-3d` semantic types.
It also does not require WebGL. The current SVG/software-depth renderer can adopt
the coordinate-scene boundary incrementally.
