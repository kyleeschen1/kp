# Dot passage: group depth and lighter delimiters

The user approved a comparison of background recession and foreground lift,
requested the 80% background-opacity setting, removal of separate delimiter
color, and thinner brackets. They clarified that the opacity control was a
slider. The current source had no remaining opacity control, so this candidate
restores a labelled 0–100% slider with a visible percentage. We interpret 80% as
80% opaque, explicitly stated to the user; the opposite interpretation was not
confirmed.

Reference and review URL: http://localhost:8000/experiments/dot-product-passage/.
Also reachable through Three-term dot product in the existing matrix menu.
The same native KaTeX adapter and semantic product remain authoritative. This is
one local exemplar, not a rollout to other matrix renderers.

- Background opacity defaults to 80%; the group recedes to 98% scale.
- A comparison selector offers 100% (no scale motion), 98%, and 95%.
- Moving foreground material briefly reaches 103%, returning to native size
  at the pairing endpoint. No tilt, text shadow, glyph-specific scaling, or
  historical token copies are introduced.
- The background here is the original vector group. Its brackets still fade
  away during the pivot; the control does not resurrect absent material.
- Vector-bracket paint is reduced from .12em to .075em. Parentheses and brackets
  inherit expression/group ink; multiplication and addition retain their
  existing operator color. Delimiter disappearance remains separate from focus.

`sampleDotDepth` is a pure, validated presentation sampler. Scale is applied to
the source group and foreground groups after token placement, and cleared before
endpoint measurement. Reprepare therefore cannot measure already-scaled bounds
and apply scaling twice. Reduced-motion preference suppresses scale movement.
Controls update the held playhead and are cleared during player disposal.

Verification covers bounded scales, source/native endpoint scale, reduced motion,
invalid opacity settings, a real browser reverse/seek round trip, opacity/scale
controls, resize, thinner bracket paint and delimiter color inheritance. Existing
geometry checks run with the new depth controls at neutral settings to preserve
their independent path contract; a dedicated browser check exercises the default
depth treatment. Existing evaluation, identity, shared-host and disposal checks
remain active.

Commands: `npm run test:dot-passage` (5), `npm run visual:dot-passage` (7),
`npm run build:semantic-cost`, `npm run measure:semantic-cost`,
`npm run visual:semantic-cost`, and `npm run typecheck`.
Production dot JS gzip is 91,753 bytes (was 91,193); CSS 14,420 (was 14,403).
No budget increase or new shared framework is needed.

Review the first transition with background scale at 98% versus 95%, and tune
the opacity slider. The main question is whether depth makes the active group
clearer without a distracting size change. This is the independently reversible
unit: local sampler, player controls, delimiter CSS and their tests.
Before broader reuse, the visual-salience skill requires “Ask for visual review
of choreography, emphasis, color, typography, and timing before generalizing.”
See [SKILL.md](../../../.agents/skills/kp-visual-salience/SKILL.md).
