# Renderer and theme guides

Semantic parity means each renderer expresses the same instructional hierarchy, not that every renderer uses the same CSS properties or numeric response curve.

## DOM prose and code

- Resolve color, opacity, background, outline, and paint-only transform from semantic state.
- Keep normal reading text stable and readable; do not make the document depend on animation to recover contrast.
- Avoid animating font weight, width, line height, or other metrics that cause reflow.
- Use grouping and a shared field or outline when fragments form one semantic object.
- Preserve keyboard focus indication independently from story salience.

## KaTeX

- Bind salience to authored semantic fragments or stable wrappers, not KaTeX's incidental internal DOM tree.
- Keep inline math sized and optically aligned with surrounding prose.
- Resolve math foreground independently for light and dark themes.
- Avoid relying on a single wrapper opacity when internal fragments need distinct semantic roles or when readability suffers.
- Preserve server-rendered static math; progressive enhancement may add bindings without changing initial geometry.

### Symbol motion and function reception

- Default a persistent symbol to the shortest clear trajectory that preserves
  identity, baseline, and ordinal order.
- Use curvature only when it clears an actual collision, disambiguates
  correspondence, or expresses a named structural operation. Do not add an
  arc merely to make motion more noticeable.
- For function wrapping, stage material transit first, enclosure reception
  second, and operational-syntax resolution last, with enough overlap to keep
  the handoff continuous.
- A function-wrap operation with authored enclosure roles uses outside-in
  reception: the leading and trailing delimiters begin farther apart and
  slightly oversized, then shrink and settle exactly onto the renderer's
  native endpoint geometry. Semantic plans name `leading` and `trailing`;
  renderers own offsets, scale, and measured rectangles and must not infer
  roles from glyph text or incidental DOM order.
- Operators and connectors may share the final syntax-resolution cohort when
  the lesson gives them no separate teaching role. Split them only for a named
  instructional reason.
- Treat exact paths and timing values as motif-owned presentation policy, not
  semantic or renderer-wide authority.

## SVG graphs and diagrams

- Use semantic IDs and CSS variables or resolved attributes rather than query-order or path geometry.
- Prefer paint properties that do not change layout or geometry.
- Use `vector-effect: non-scaling-stroke` where zoom or responsive transforms would otherwise alter canonical strokes.
- Keep arrows, intersections, axes, grids, live curves, and historical traces as distinct roles even when they share a nominal stroke width.
- Express a historical curve through trace styling—such as a neutral core, retained identity edge, or another approved renderer motif—rather than assuming low opacity alone will work.

## Canvas

- Resolve palette endpoints only when state, theme, or accessibility mode changes.
- Sample only active transitions and batch the scene into one paint pass.
- Do not call `getComputedStyle` per object per frame; snapshot theme tokens or pass resolved palette data.
- Suspend offscreen loops and keep a static initial frame available.

## WebGL and 3D

- Pass renderer-independent identity, salience, presence, and trace data into materials or uniforms.
- Keep instructional light separate from physical scene lighting. Camera position, diffuse light, and depth may explain shape; salience must remain legible without corrupting that model.
- Prefer shared materials, palette textures, or uniform buffers over material cloning per object.
- Update uniforms for active changes instead of rebuilding geometry or recompiling shaders.
- Resolve transparent surfaces deliberately: ordering, depth write, blending, and occlusion are part of the adapter contract.
- Use edge, emissive, saturation, roughness, or local contrast response as appropriate; do not assume 2D opacity maps directly onto a 3D surface.

## Themes are separate optical systems

Dark and light themes need separate neutral ramps, accent endpoints, antialiasing checks, and apparent-weight tuning. Do not derive one theme by naively inverting or applying a constant brightness transform to the other.

Keep tokens separated by role:

```text
identity family -> theme endpoint -> salience response -> renderer response
```

Use token names that encode role rather than a literal color. Check apparent weight at final size: bright warm strokes can look heavier than equally sized cool strokes, and light backgrounds can make thin type or lines appear weaker. Prefer optical color correction before introducing inconsistent geometry.

## Provisional aesthetics

The following remain tunable unless a later reviewed decision explicitly fixes them:

- exact typeface and font weight;
- exact light- and dark-theme palette values;
- permanent mappings between semantic categories and hues;
- line-width ratios beyond a motif's current canonical variables;
- opacity thresholds, transition durations, easing, and 3D material curves;
- whether a particular trace uses an outline, neutral core, texture, or another ghost treatment.

Inspect the current canonical exemplar and recent project decisions before changing these. Internal sliders may discover a useful value; they do not make it a standard.

## Performance and layout stability

- Server-render or statically emit the first meaningful frame, including KaTeX where available.
- Keep enhancement geometry-compatible so custom elements and host frameworks do not shift layout on hydration.
- Cache resolved endpoints and sample only active transitions.
- Batch DOM/SVG writes and avoid layout reads inside animation loops.
- Reserve layout changes for semantic presence changes, not routine focus.
- Suspend offscreen animation blocks and avoid one perpetual clock per visualization.
- Prefer shared observers and clocks for pages with many blocks.
