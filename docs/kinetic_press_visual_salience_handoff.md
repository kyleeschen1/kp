# Kinetic Press Visual Salience System
## Design and Engineering Handoff

**Status:** Working design specification

**Primary decision:** Kinetic Press uses discrete semantic salience states with animated interpolation between renderer-specific visual targets.

**Typography decision:** Use **Source Serif 4 Regular** for lesson prose. KaTeX retains its native mathematical faces, while technical UI may use a separate companion face; Gill Sans has been discarded.

**Visual-direction correction:** Do **not** define Kinetic Press by strict minimalism or monochrome austerity. The system may use the complete color palette and visually rich artifacts. Coherence should come from disciplined salience behavior, not from color scarcity.

---

# Implemented boundary as of 2026-08-06

The first portable semantic visual-treatment seam is implemented and proven by
two structurally different callers:

- the economics demand-shift SVG is the reviewed first caller;
- the fraction-composition reader is the second caller and binds the same
  treatment to native KaTeX-owned DOM.

The shared boundary is framework-neutral. A pure facade resolves semantic role,
identity family, salience, and presence into a complete visual treatment; thin
renderer adapters translate that treatment into SVG or DOM/KaTeX paint. Theme
data supplies separate dark and light optical systems. Forced-colors falls back
to system colors and a non-color underline distinction. Svelte may host these
callers, but it does not own their semantic state, treatment resolution, clock,
or renderer contract.

The fraction caller proves several additional constraints:

- one reader clock determines checkpoint attention;
- instructional attention lineage is distinct from semantic preservation
  lineage, so persistent identity does not force every retained term to remain
  focused;
- direct seek and rewind resolve the same endpoint treatment;
- native KaTeX remains the sole settled typography and accessibility owner;
- repeated endpoint projections are cached, and unchanged presentation
  revisions skip DOM paint;
- CSS does not introduce a second animation clock between deterministic
  endpoints.

This is a deliberately narrow promotion. It does **not** claim a catalogue-wide
rollout, a universal focus store, or implemented Canvas, WebGL, or Graph3D
adapters. Sections 11.4 and 12 remain design guidance until a real caller proves
those renderer seams. The broader canonical fraction compositor also still
rebuilds its session 30 times in the existing rapid-seek pressure test even
though material churn is zero; this salience run did not redesign that cadence.
The economics production payload gate also remains red under its unchanged
budget, so the visual-system promotion is not a bundle-release claim.

Durable implementation and release evidence are recorded in
`docs/project/reviews/2026-08-06-semantic-visual-salience-theme-closeout.md`.

---

# 1. Product-level visual idea

Kinetic Press should be understood as a system for **choreographing attention through persistent formal objects**.

Its visual language should make clear:

- what currently matters;
- what remains relevant context;
- what has receded;
- what corresponds across representations;
- what persists through a transformation;
- what is entering or leaving the scene.

The core distinction is not “colorful versus monochrome.” It is:

> Visual treatment should follow the instructional state of an object rather than decorate it independently of the explanation.

Kinetic Press may use color, dimensionality, texture, motion, thickness, and lighting freely. These channels should be coordinated by one semantic salience system.

---

# 2. Positioning

Kinetic Press should occupy a different reference class from:

- traditional presentation slides;
- static textbooks;
- ordinary syntax-highlighted code examples;
- game-like educational interfaces;
- cinematic math animation in which visual identity is authored frame by frame.

The distinctive capability is that mathematical and technical objects retain identity across:

- prose;
- KaTeX;
- code;
- SVG;
- Canvas;
- graphs;
- diagrams;
- WebGL simulations;
- authoring and direct manipulation.

A term in an equation, a variable in code, and a vector in a 3D scene may be three renderings of the same underlying object. Salience belongs to that object, not to any one rendering.

---

# 3. Governing principles

## 3.1 Salience is semantic

Authors should express instructional intent:

```ts
object.setSalience("focus");
surface.setSalience("context");
grid.setSalience("ghost");
```

They should not need to author raw renderer properties:

```ts
material.opacity = 0.37;
material.emissiveIntensity = 0.12;
element.style.fontWeight = "600";
```

Raw properties are consequences chosen by each renderer.

## 3.2 Rendering is medium-specific

The same semantic state should not produce identical physical styling in every medium.

For example, `dim` might mean:

- KaTeX: lower chroma and contrast while remaining readable;
- graph curve: lower chroma, narrower stroke, reduced edge emphasis;
- code: quieter foreground without compromising punctuation;
- 3D surface: matte, desaturated, low-specular, but still opaque;
- historical trace: low opacity and no depth-writing.

## 3.3 Identity, salience, and presence are separate

```ts
interface VisualState {
  identityColor: ColorFamily | "neutral";
  salience: SalienceState;
  presence: number;
}
```

- **Identity color** indicates visual grouping or correspondence.
- **Salience** indicates how strongly the object solicits attention.
- **Presence** indicates whether the object exists fully, is entering, or is leaving.

Core rule:

> Withdraw attention primarily through perceptual styling; withdraw existence through opacity or removal.

## 3.4 Attention is transferred, not merely accumulated

When one object rises in salience, competing objects may recede.

This can affect:

- color;
- lightness;
- chroma;
- stroke weight;
- edge emphasis;
- label visibility;
- surface detail;
- lighting contrast;
- motion;
- spatial framing.

The system should support coordinated attention handoffs rather than merely adding highlights.

## 3.5 Color is dynamic, not permanently tied to syntax

Color may be plentiful when an explanation benefits from it, but it should not be assigned thoughtlessly by static category conventions.

Examples:

- functions need not always be blue;
- comments need not always be green;
- every graph series need not retain a fixed color across an entire tutorial;
- colors may temporarily express correspondence or instructional role.

This is not a mandate for color scarcity. It is a mandate for semantic use.

---

# 4. Discrete semantic states with animated interpolation

## 4.1 Canonical states

```ts
type SalienceState =
  | "focus"
  | "normal"
  | "context"
  | "dim"
  | "ghost"
  | "absent";
```

Suggested meanings:

### `focus`

The current instructional subject.

Typical effects:

- strongest usable color;
- high contrast;
- reinforced line or edge;
- full detail;
- visible annotations;
- stable legibility.

### `normal`

An ordinary participating object.

Typical effects:

- clear identity color or foreground neutral;
- ordinary stroke and detail;
- no exceptional emphasis.

### `context`

Relevant but not currently acted upon.

Typical effects:

- reduced chroma;
- restrained contrast;
- ordinary presence;
- readable labels where necessary.

### `dim`

Available structure that should not compete.

Typical effects:

- low chroma;
- lower contrast;
- reduced width or edge strength;
- fewer labels and details;
- generally still opaque in 3D.

### `ghost`

A historical, latent, inferred, or transitional trace.

Typical effects:

- very low chroma;
- partial transparency where appropriate;
- sparse geometry, wireframe, silhouette, or trace;
- not relied upon for primary reading.

### `absent`

Not currently rendered or perceptually available.

Typical effects:

- opacity zero;
- removed from drawing;
- optionally removed from picking, layout, and accessibility trees.

## 4.2 States are authoring targets, not visual jumps

The renderer should animate continuously between discrete targets.

```ts
interface SalienceTransition {
  from: SalienceState;
  to: SalienceState;
  progress: number; // 0–1
  easing: EasingFunction;
}
```

The authoring model remains simple:

```ts
await object.animateSalience("focus", {
  duration: 320,
  easing: "ease-out",
});
```

The renderer resolves both endpoint styles and interpolates their physical properties.

## 4.3 Interpolation should be property-aware

Do not apply one scalar indiscriminately to all properties.

Possible interpolation rules:

- color: interpolate in OKLCH or another perceptually suitable space;
- GPU color: convert resolved endpoints to linear RGB before shader use;
- opacity: interpolate numerically;
- line width: interpolate in screen-space pixels;
- point size: interpolate in screen-space pixels;
- visibility flags: switch at explicit thresholds;
- geometry detail: use thresholds or cross-fades rather than naïve interpolation;
- labels: animate color and opacity, then remove from layout if absent;
- depth writing: change only at a defined transition boundary.

---

# 5. Color system

## 5.1 Dark background

Primary dark background:

```css
--kp-bg: #0d0e1c;
```

Approximate perceptual character:

- extremely dark;
- slightly indigo;
- softer and more distinctive than pure black;
- compatible with cool and warm accent families.

Supporting surfaces:

```css
--kp-surface-1: #141628;
--kp-surface-2: #1b1e34;
--kp-grid:      #2b2e48;
```

## 5.2 Accent families

The initial palette contains six core hue families:

- cyan;
- blue;
- violet;
- red;
- amber;
- green.

Each family contains semantic gradations.

| Family | Focus | Normal | Dim | Ghost |
|---|---|---|---|---|
| Cyan | `#07d0d8` | `#42a3a8` | `#4c6a6b` | `#344040` |
| Blue | `#7cbdff` | `#6796c7` | `#546577` | `#37404c` |
| Violet | `#bda7ff` | `#9687c4` | `#646076` | `#3d3c44` |
| Red | `#f07972` | `#bd746e` | `#705956` | `#423a3a` |
| Amber | `#fb9d59` | `#bd835b` | `#735e50` | `#443b36` |
| Green | `#7acf7e` | `#6fa170` | `#576957` | `#374238` |

The `context` state may initially be derived between `normal` and `dim`, then promoted to explicit tokens after artifact testing.

## 5.3 Palette construction model

Approximate dark-theme OKLCH targets:

| State | Lightness | Chroma |
|---|---:|---:|
| Focus | 78% | 0.14 |
| Normal | 66% | 0.09 |
| Dim | 50% | 0.035 |
| Ghost | 36% | 0.018 |

General form:

```css
--family-focus:  oklch(78% 0.14  var(--family-hue));
--family-normal: oklch(66% 0.09  var(--family-hue));
--family-dim:    oklch(50% 0.035 var(--family-hue));
--family-ghost:  oklch(36% 0.018 var(--family-hue));
```

Key design choice:

> Chroma decreases faster than lightness.

This allows an object to retain family identity while becoming much less insistent.

## 5.4 Approximate hue anchors

| Family | Hue |
|---|---:|
| Cyan | 200° |
| Blue | 250° |
| Violet | 295° |
| Red | 25° |
| Amber | 55° |
| Green | 145° |

These are not intended to be mathematically equidistant. They were chosen for practical separation and visual balance.

## 5.5 Contrast bands on the dark background

Approximate intended bands:

| State | Contrast range | Intended use |
|---|---:|---|
| Focus | 9:1–10:1 | strong text and graphics |
| Normal | 5.9:1–6.4:1 | ordinary text, math, and graphics |
| Dim | 3.1:1–3.3:1 | contextual graphics and larger forms |
| Ghost | 1.7:1–1.8:1 | nonessential structural traces |

Contrast is a validation tool, not the sole construction rule.

---

# 6. Neutral system

## 6.1 Dark theme

```css
[data-theme="dark"] {
  --kp-bg:             #0d0e1c;
  --kp-surface:        #15172a;
  --kp-surface-raised: #20233a;

  --kp-white:          #ffffff;
  --kp-black:          #000000;

  --kp-ink-strong:     #f4f4f8;
  --kp-ink:            #d6d7df;
  --kp-ink-secondary:  #a6a9b7;
  --kp-ink-context:    #7d8193;
  --kp-ink-dim:        #5a5e70;
  --kp-ink-ghost:      #393d50;

  --kp-line-strong:    #696e83;
  --kp-line:           #42465b;
  --kp-line-subtle:    #292d42;
}
```

## 6.2 Light theme

```css
[data-theme="light"] {
  --kp-bg:             #f6f7fb;
  --kp-surface:        #ffffff;
  --kp-surface-raised: #eceef5;

  --kp-white:          #ffffff;
  --kp-black:          #000000;

  --kp-ink-strong:     #151622;
  --kp-ink:            #292b3a;
  --kp-ink-secondary:  #4f5364;
  --kp-ink-context:    #707586;
  --kp-ink-dim:        #9599a7;
  --kp-ink-ghost:      #b9bdc8;

  --kp-line-strong:    #74798a;
  --kp-line:           #aeb2bf;
  --kp-line-subtle:    #d7dae3;
}
```

True black and white should remain available, but ordinary foregrounds should generally use the softer strong-ink values.

---

# 7. Dark and light modes are separate optical systems

Light mode should not be a mechanical inversion of dark mode.

Thin dark elements often appear weaker against white because of:

- contrast-polarity effects;
- antialiasing;
- display glare;
- delicate mathematical hairlines;
- projector and monitor limitations.

Therefore, light mode may require:

- heavier minimum strokes;
- darker context colors;
- higher opacity floors;
- stronger borders;
- less reliance on subtle gray distinctions;
- slightly increased mathematical display size;
- carefully tested font weights.

Example renderer tokens:

```css
[data-theme="dark"] {
  --kp-hairline: 1px;
  --kp-stroke: 1.5px;
  --kp-stroke-emphasis: 2.75px;
  --kp-opacity-context: 0.62;
  --kp-opacity-dim: 0.36;
}

[data-theme="light"] {
  --kp-hairline: 1.25px;
  --kp-stroke: 1.8px;
  --kp-stroke-emphasis: 3px;
  --kp-opacity-context: 0.72;
  --kp-opacity-dim: 0.50;
}
```

Principle:

> The themes should preserve the same hierarchy, not necessarily the same measurements.

The dark palette is more mature. The light palette should be finalized through artifact testing.

---

# 8. Typography

## 8.1 Selected reading font

Preferred lesson-prose font:

> **Source Serif 4 Regular**

Intended uses:

- explanatory prose;
- headings and lists within the reading column;
- prose-adjacent controls when visual continuity matters.

Reasons:

- the economics exemplar demonstrated better long-form readability than the
  monospace companion;
- its serif texture distinguishes explanatory language from technical chrome;
- Regular provides the preferred default density while discrete 300, 500, and
  600 faces preserve the existing weight tuner without synthetic bolding.

## 8.2 KaTeX

KaTeX should retain its own intended math fonts and metrics.

Do not casually replace KaTeX’s internal fonts through CSS. Doing so can damage:

- spacing;
- delimiter sizing;
- vertical alignment;
- symbol metrics.

Treat Source Serif 4 as prose typography rather than a direct KaTeX font override.
Technical UI and code may retain a separate mono or sans companion without
changing lesson prose.

## 8.3 Gill Sans

Gill Sans has been explicitly discarded and should not appear in the implementation plan or visual specification.

## 8.4 Internal application chrome

Internal Studio, the Animation Catalogue, and general application chrome use
the platform system sans stack:

```css
ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

Do not hardcode the macOS-resolved face or wait for a downloadable chrome font.
This removes font transfer and settlement from the application shell while
leaving lesson-specific prose and KaTeX under their existing owners.

## 8.5 Typography remains an open validation area

Test:

- long-form reading in Source Serif 4 Regular;
- inline code beside KaTeX;
- small labels;
- light-mode rendering;
- regular versus explicitly selected heavier weights;
- punctuation and operator legibility;
- fallback behavior;
- variable-font or static-font loading strategy.

Do not share or distribute font files without confirming their licensing and distribution requirements.

---

# 9. Shared renderer architecture

## 9.1 Architecture overview

```text
Tutorial semantics
        ↓
Object identity and state store
        ↓
Discrete salience targets
        ↓
Animated transition coordinator
        ↓
Renderer-specific adapters
        ↓
DOM / KaTeX / SVG / Canvas / WebGL
```

## 9.2 Core object state

```ts
type ColorFamily =
  | "neutral"
  | "cyan"
  | "blue"
  | "violet"
  | "red"
  | "amber"
  | "green";

interface KPSalienceState {
  level: SalienceState;
  presence: number;
  identityColor: ColorFamily;
}

interface KPVisualObject {
  id: string;
  salience: KPSalienceState;
}
```

## 9.3 Renderer adapter interface

```ts
interface SalienceAdapter<TObject, TResolvedStyle> {
  resolve(
    object: TObject,
    state: KPSalienceState,
    context: RenderContext,
  ): TResolvedStyle;

  interpolate(
    from: TResolvedStyle,
    to: TResolvedStyle,
    progress: number,
    context: RenderContext,
  ): TResolvedStyle;

  apply(
    object: TObject,
    style: TResolvedStyle,
    context: RenderContext,
  ): void;
}
```

```ts
interface RenderContext {
  theme: "dark" | "light";
  pixelRatio: number;
  reducedMotion: boolean;
  medium:
    | "dom"
    | "katex"
    | "svg"
    | "canvas"
    | "webgl";
}
```

## 9.4 Shared object identity

Example:

```ts
salienceStore.set("eigenvector-v1", {
  identityColor: "cyan",
  level: "focus",
  presence: 1,
});
```

Subscribers may include:

- a KaTeX symbol;
- a code token;
- a graph curve;
- a 3D arrow;
- an annotation;
- a linked explanatory phrase.

The renderers do not need to know why the object matters. They only interpret the state.

---

# 10. Transition coordination

## 10.1 Transition command

```ts
interface SalienceCommand {
  objectIds: string[];
  target: Partial<KPSalienceState>;
  duration: number;
  easing: EasingFunction;
}
```

Example:

```ts
await salience.animate({
  objectIds: ["matrix-A", "matrix-A-code", "matrix-A-3d"],
  target: {
    level: "focus",
    identityColor: "violet",
  },
  duration: 320,
  easing: easeOutCubic,
});
```

## 10.2 Coordinated attention transfer

```ts
await salience.transaction([
  {
    objectIds: ["source-term"],
    target: { level: "context" },
    duration: 280,
  },
  {
    objectIds: ["destination-term"],
    target: { level: "focus" },
    duration: 280,
  },
]);
```

Transactions should synchronize transitions across renderers using one timeline.

## 10.3 Interruption and reversal

The transition system should support:

- scrubbing;
- reversing;
- jumping to a beat;
- interrupted animations;
- retargeting from the current interpolated style;
- reduced-motion behavior;
- deterministic replay.

When interrupted, a renderer should begin the next transition from the currently displayed style, not from the previous semantic endpoint.

---

# 11. DOM, KaTeX, SVG, and Canvas behavior

## 11.1 DOM text

Possible channels:

- foreground color;
- chroma;
- opacity;
- font weight where semantics permit;
- background or underline treatment;
- visibility;
- local isolation of surrounding content.

Small text should maintain a higher contrast floor than large graphical artifacts.

## 11.2 KaTeX

Possible channels:

- foreground color;
- chroma;
- opacity with conservative floors;
- temporary enclosure or bracket;
- local background treatment;
- motion and spatial isolation.

Avoid using bold solely for salience where bold may carry mathematical meaning.

Do not make small operators, fraction bars, punctuation, or subscripts illegible in dim states.

## 11.3 SVG

Possible channels:

- stroke color;
- fill color;
- stroke width;
- opacity;
- dash pattern only when semantically meaningful;
- marker and label visibility;
- edge and outline emphasis.

Use screen-space reasoning for important instructional strokes.

## 11.4 Canvas

Canvas should use the same compiled theme and resolver logic as SVG and WebGL.

Do not hard-code separate colors inside individual drawing routines.

---

# 12. WebGL and 3D

## 12.1 Palette data must be renderer-independent

Store canonical palette definitions in TypeScript or JSON.

Generate from one source:

- CSS custom properties;
- SVG and Canvas colors;
- GPU-ready linear RGB values;
- theme-specific renderer targets.

```ts
interface CompiledTheme {
  cssVariables: Record<string, string>;
  colors: Record<ColorFamily, Record<SalienceState, ColorValue>>;
  gpuColors: Record<ColorFamily, Record<SalienceState, LinearRGB>>;
}
```

Reading CSS variables through `getComputedStyle` may be useful as a bridge, but CSS should not be the only source of truth.

## 12.2 Shader inputs

Typical uniforms:

```glsl
uniform vec3 uColor;
uniform float uOpacity;
uniform float uEdgeStrength;
uniform float uDetailStrength;
uniform float uSpecularStrength;
uniform float uInstructionalStrength;
```

The CPU should usually resolve perceptual color endpoints and pass compiled linear RGB values to the shader.

## 12.3 Curves

Important curves should not rely on implementation-dependent native WebGL line widths.

Prefer:

- screen-space ribbons;
- expanded triangle strips;
- camera-facing geometry;
- extruded tubes where appropriate.

Potential dark-theme widths:

| State | Width |
|---|---:|
| Focus | 3.5 px |
| Normal | 2.25 px |
| Context | 1.7 px |
| Dim | 1.35 px |
| Ghost | 1.1 px plus partial transparency |

Light mode should use slightly heavier minimums.

## 12.4 Surfaces

Surface salience may control:

- perceptual color;
- chroma;
- roughness;
- specular strength;
- lighting contrast;
- edge strength;
- grid and annotation visibility;
- geometry detail;
- shadow casting;
- opacity.

Suggested behavior:

### Focus surface

- full identity color;
- strong silhouette;
- controlled shading;
- relevant contours or annotations.

### Normal surface

- ordinary color;
- restrained lighting;
- ordinary detail.

### Context surface

- lower chroma;
- matte;
- reduced shading contrast;
- fewer annotations.

### Dim surface

- nearly neutral;
- high roughness;
- little or no specular highlight;
- no unnecessary edge enhancement;
- usually still opaque.

### Ghost surface

- partial transparency, sparse wireframe, silhouette, or historical trace;
- careful depth-writing and draw-order behavior.

## 12.5 Transparency

Transparency in 3D changes spatial meaning and creates blending and depth-order issues.

Use opaque-but-muted materials for contextual 3D objects.

Reserve transparency for:

- actual entry or disappearance;
- historical ghosts;
- x-ray explanations;
- explicit visibility-through-surface demonstrations.

## 12.6 Instructional and physical lighting are separate

A dim object should not become salient merely because it catches a bright highlight.

Possible controls:

- minimum ambient or diffuse contribution;
- restrained specular response;
- controlled exposure;
- instructional color contribution;
- salience-based silhouette edges;
- stable screen-space stroke widths.

Avoid relying on bloom or glow as the normal focus mechanism.

## 12.7 Depth and camera changes

Depth, scale, camera position, clipping, and transparency can be interpreted as mathematical changes.

Use them only when their explanatory meaning is clear.

Safer salience channels:

- color;
- chroma;
- line width;
- point size;
- edge strength;
- lighting contrast;
- detail;
- labels;
- surrounding-object dimming.

---

# 13. Animation grammar

Recommended semantic moves:

## Reveal

```text
ghost → context → normal or focus
```

## Withdraw

```text
focus or normal → context → dim
```

## Transform

The object persists while its representation changes.

## Correspond

Two or more representations temporarily receive coordinated visual treatment.

## Transfer

Salience moves from source to destination.

## Preserve

An invariant maintains salience while surrounding structure changes.

## Resolve

Temporary emphasis settles into a stable ordinary state after the explanation completes.

These moves are semantic operations, not a ban on richer animation. More elaborate effects may be used when they communicate the underlying transformation.

---

# 14. Code presentation

Avoid allowing conventional syntax highlighting to determine instructional salience.

Possible baseline:

- neutral code foreground;
- restrained syntactic differentiation where useful;
- salience states override ordinary syntax styling;
- linked code and visual objects share identity and state;
- comments and punctuation maintain adequate contrast.

Example progression:

```ts
const result = transform(matrix);
```

A tutorial may sequentially focus:

1. `matrix`;
2. `transform`;
3. `result`;

with linked objects responding in other renderers.

---

# 15. Graph and diagram behavior

Graph and diagram renderers should use multiple coordinated channels:

- color family;
- salience color;
- stroke width;
- point size;
- marker visibility;
- label visibility;
- opacity;
- local isolation;
- edge strength;
- motion continuity.

Color may be used extensively when comparison requires it. The renderer should still ensure that a dim saturated color does not remain more visually forceful than a focused color from another family.

Large filled regions may require lower chroma than thin lines at the same semantic state because occupied area contributes to salience.

---

# 16. Artifact-specific response curves

The state names are shared, but the resolved targets depend on object type.

```ts
type ArtifactKind =
  | "body-text"
  | "small-label"
  | "katex-inline"
  | "katex-display"
  | "code"
  | "graph-line"
  | "graph-region"
  | "diagram-node"
  | "diagram-edge"
  | "point"
  | "vector"
  | "surface"
  | "volume"
  | "annotation";
```

Example resolver:

```ts
function resolveStyle(
  kind: ArtifactKind,
  state: KPSalienceState,
  theme: Theme,
): ResolvedStyle {
  // Select the artifact-specific response curve.
}
```

A universal salience scalar may exist internally for interpolation or authoring convenience, but it should not directly map to the same opacity or lightness for every artifact.

---

# 17. Testing requirements

Create a permanent visual test harness covering both themes.

Include:

- one-pixel and two-pixel graph lines;
- crossing curves in every color family;
- large and small KaTeX;
- fractions;
- radicals;
- delimiters;
- subscripts and superscripts;
- code punctuation;
- code at several weights;
- filled regions;
- arrows;
- points;
- overlapping translucent objects;
- labels;
- 3D curves;
- 3D surfaces;
- specular highlights;
- wireframes;
- ghost states;
- transition interruption;
- dark/light theme switching.

Test on:

- Retina and non-Retina displays;
- multiple device pixel ratios;
- bright and dim monitors;
- projectors;
- browser zoom levels;
- reduced-motion settings;
- common forms of color-vision deficiency;
- light and dark ambient conditions.

The palette should be evaluated horizontally:

- compare every focus color;
- compare every normal color;
- compare every context color;
- compare every dim color;
- compare every ghost color.

The goal is equivalent visual force within each semantic tier.

---

# 18. Accessibility

Requirements:

- color must not be the only indicator of a critical distinction;
- small text must retain adequate contrast;
- ghost content must not contain required information;
- reduced-motion mode must preserve semantic transitions through non-motion channels;
- focus and selection states must remain visible in both themes;
- screen-reader and accessibility-tree presence should be controlled independently from visual opacity;
- WebGL scenes need textual alternatives or synchronized accessible representations where appropriate.

---

# 19. Recommended implementation sequence

## Phase 1: Theme source of truth

Build:

- canonical TypeScript theme definition;
- OKLCH color tokens;
- dark and provisional light themes;
- CSS variable compiler;
- GPU linear-RGB compiler.

## Phase 2: State model

Build:

- object identity store;
- salience states;
- presence channel;
- transaction API;
- event and subscription model.

## Phase 3: DOM, KaTeX, and SVG adapters

Implement and tune:

- artifact-specific target styles;
- interpolation;
- interruption and reversal;
- theme switching.

## Phase 4: Visual test harness

Rebuild the existing color playground as a permanent internal tool.

Add:

- artifact-kind selectors;
- transition scrubbing;
- side-by-side dark/light comparison;
- endpoint and interpolation inspection;
- contrast readouts;
- device-pixel-ratio simulations.

## Phase 5: WebGL adapter

Implement:

- GPU theme compilation;
- curve materials;
- surface materials;
- edge and lighting controls;
- transparency policies;
- synchronized cross-renderer identity.

## Phase 6: Authoring API

Expose high-level operations such as:

```ts
focus(object);
withdraw(object);
correspond(source, target);
transferAttention(source, target);
ghost(object);
restore(object);
```

These should compile into state transactions rather than renderer-specific commands.

---

# 20. Current decisions

## Accepted

- Salience is semantic.
- Rendering is medium-specific.
- Identity, salience, and presence are separate.
- Discrete semantic states are used.
- Transitions animate continuously between state targets.
- State interpolation is property-aware and renderer-specific.
- Attention can be transferred across linked objects and representations.
- The complete color system remains available.
- Chroma should generally fall faster than lightness as objects recede.
- Dark and light modes require separate optical tuning.
- Theme data should be shared across CSS, SVG, Canvas, and WebGL.
- WebGL contextual objects should generally remain opaque but visually muted.
- Transparency is reserved for presence, ghosts, x-ray views, and disappearance.
- Source Serif 4 Regular is the lesson-prose default; KaTeX retains its native
  faces and technical UI may choose its own companion font.
- Internal application chrome uses the native system sans stack and ships no
  custom Computer Modern Mono font by default.
- Gill Sans is discarded.
- Strict minimalism is discarded as a defining constraint.

## Clarification on simplicity

Kinetic Press may still value clarity, coherence, and disciplined attention.

However:

- it is not committed to monochrome;
- it is not limited to one active hue;
- it is not required to remove visual richness;
- it should not treat austerity as a product identity;
- it may use complex and expressive visuals when they improve explanation.

Simplicity should arise from a coherent semantic system, not from forbidding expressive channels.

---

# 21. Open decisions

## `context` token

Decide whether `context` receives explicit color tokens or is derived between `normal` and `dim`.

## Color semantics

Decide whether any colors receive stable meanings, such as:

- amber for changed values;
- green for resolution;
- red for warning or contradiction;
- cyan for primary interaction.

The safer default is flexible identity colors unless a stable semantic mapping proves useful.

`red` is an identity family, not a salience command. Authors express semantic
attention such as “focus demand”; the renderer resolves that object's retained
red identity through the active theme and salience band. A warning role may use
red without making every red object a warning.

## Long-form prose font

Source Serif 4 Regular is selected for lesson prose after the economics human
checkpoint rejected universal monospace typography. Keep code and technical UI
typography independently selectable.

Gill Sans should not be reconsidered unless the product direction changes explicitly.

## Light-theme palette

The light theme still requires dedicated tuning against real artifacts.

## Transition durations

Define defaults by semantic move and artifact kind.

## WebGL material strategy

Decide how much of the material system is:

- custom shader code;
- Three.js materials and hooks;
- a shared shader graph;
- renderer-specific special cases.

## State versus scalar API

Discrete states are canonical. A secondary continuous salience scalar may still be useful for:

- scrubbing;
- authoring;
- interpolation;
- procedural simulations.

It should resolve through artifact-specific response curves rather than directly controlling opacity.

---

# 22. Concise implementation doctrine

> Salience belongs to the underlying instructional object.

> Authors target discrete semantic states.

> Renderers translate those states into medium-appropriate visual properties.

> Transitions interpolate continuously and can be scrubbed, reversed, interrupted, and synchronized.

> Color, thickness, lighting, detail, and opacity are coordinated channels rather than independent decoration.

> Dark and light modes preserve the same semantic hierarchy through separately tuned optical behavior.

> Kinetic Press is not constrained by strict minimalism; its coherence comes from semantic consistency across rich visual media.
