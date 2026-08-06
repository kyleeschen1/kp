---
name: kp-visual-salience
description: Design, implement, or review semantic attention choreography across Kinetic Press prose, KaTeX, SVG, Canvas, and WebGL. Use for salience, focus, highlighting, dimming, ghosting, reveal/withdraw transitions, cross-view attention, renderer adapters, theme response, or promotion of a visual motif from an exemplar into shared infrastructure.
---

# KP Visual Salience

Treat Kinetic Press as a salience-transmission system: instructional intent names what deserves attention, semantic state determines its role, and each renderer expresses that role in its own medium. Preserve [the full visual salience handoff](../../../docs/kinetic_press_visual_salience_handoff.md) as the expansive design source; use this skill as the operational workflow.

## Load only the references the task needs

- Read [doctrine-and-state.md](references/doctrine-and-state.md) for every salience task.
- Read [repository-seams.md](references/repository-seams.md) before architecture or implementation work.
- Read [renderer-and-theme-guides.md](references/renderer-and-theme-guides.md) for visual treatment, themes, typography, graphs, KaTeX, Canvas, or 3D.
- Read [verification-and-promotion.md](references/verification-and-promotion.md) before implementing, testing, or generalizing a motif.

## Respect the requested mode

- For brainstorm, explanation, comparison, or diagnosis requests, inspect and report without editing.
- For an approved implementation, name the canonical exemplar, observable acceptance criteria, preservation boundary, and smallest reversible rollback unit before broad work.
- Treat a request to formalize a principle separately from permission to enforce it across the catalogue.

## Follow the semantic pipeline

Use this dependency direction:

```text
instructional intent
  -> attention phase or semantic playhead
  -> pure object-state projection
  -> scene-level salience resolution
  -> renderer- and theme-specific style resolution
  -> DOM / KaTeX / SVG / Canvas / WebGL paint
```

Do not let physical styles, coordinates, opacity values, or renderer nodes become semantic authority. Do not add a new global state store when existing scene, focus, attention, or salience contracts can own the behavior.

## Workflow

### 1. Audit semantic identity and authority

Locate the existing semantic entity IDs, scene registry, authoring intent, reader focus source, attention phase, and deterministic clock. State which layer owns each decision and identify any duplicated authority before editing.

### 2. Declare the instructional intent

Author intent in semantic terms such as `notice`, `compare`, `transmit`, `predict`, `question`, `reveal`, or `supporting-context`. Reference stable entity, group, beat, or correspondence IDs. Reject instructions such as coordinates, DOM selectors, SVG paths, keyframes, or duration values at this layer.

### 3. Project deterministic object state

Derive object state as a pure function of the semantic playhead and active intent. Keep identity, salience, presence, and trace role separate. Make direct seek, reverse, replay, URL restoration, TOC jumps, and interruption reach the same state without replaying intermediate animations.

### 4. Resolve the whole scene

Resolve target and context states together so the focal object is dominant relative to its neighbors. Local adapters may express a resolved state, but they must not independently decide scene hierarchy.

### 5. Adapt by renderer and theme

Translate resolved state into medium-specific properties. Preserve semantic parity across renderers without requiring identical property values. Treat dark, light, high-contrast, reduced-motion, and no-depth modes as explicit optical systems.

### 6. Protect continuity and access

Prefer paint-only salience changes. Keep required instructional information perceivable and represented in the accessibility tree even when visually contextual. Use `presence` for actual reveal or withdrawal, and reserve layout changes for cases where presence genuinely changes.

### 7. Tune one exemplar

Use internal controls to discover thresholds, palettes, response curves, or timing only on the canonical exemplar. Keep tuners internal and avoid promoting provisional numbers into global policy.

### 8. Verify durable truth

Test semantic identity, pure projection, direct seek, reverse, interruption, endpoint stability, theme response, accessibility modes, and previously observed regressions. During visual discovery, run only the smallest preservation and smoke checks necessary.

### 9. Stop at the human checkpoint

Ask for visual review of choreography, emphasis, color, typography, and timing before generalizing. After approval, add motif-specific checks and pressure-test one structurally different caller. Only then propose a shared renderer seam, type family, catalogue rollout, or compatibility migration.

## Authoring example

Prefer semantic intent:

```ts
{
  id: "demand-shift.notice-new-equilibrium",
  kind: "notice",
  targetEntityIds: ["equilibrium.new"],
  summary: "Notice where the shifted demand curve meets supply."
}
```

Let the scene resolver decide what remains normal or becomes context, and let the active renderer decide how those states look. Never encode the teaching idea as `opacity: 0.35`, `stroke: red`, or `translateZ: 8`.

## Guardrails

- Preserve semantic models and authoring contracts when the defect is only presentational.
- Keep visual richness available; disciplined salience does not require permanent monochrome or minimalism.
- Use semantic beat and entity IDs for links, TOC state, and shareable URLs.
- Do not use opacity as the only carrier of meaning or collapse identity, history, and absence into one style token.
- Do not animate font weight or other layout-affecting properties for emphasis.
- Do not canonize exact fonts, palette values, line-width ratios, or response curves while the source handoff marks them open or a current exemplar is still being tuned.
- Do not claim renderer-wide support from one successful exemplar.
