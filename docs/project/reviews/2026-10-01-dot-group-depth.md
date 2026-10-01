# Dot passage: group depth and lighter delimiters

Light mode comparison: an explicit toggle in the player and shared menu restores
the earlier 94% cream (#fffdf8), 6% brown (#806548) background mix, with dark
focused math. Theme uses the existing presentation configuration and preserves
the held playhead/geometry. Dark remains the initial default. The full dot
browser suite checks both native and moving ink, reversible theme switching,
size/spacing and the existing motion invariants.

Current size control: Math size spans 20–32px and now defaults to the user's
selected 20px. Column element centers match the measured horizontal spacing of
the corresponding row elements, without scaling glyphs. This is recomputed
with native endpoint measurement on resize/size changes and used by the pivot.
Nine browser checks pass, including spacing equality at 20, 26 and 32px.
Values name
the resulting KaTeX font size, accounting for its 1.21em multiplier. Each player
owns its setting; changing it pauses playback, remeasures native endpoints and
rebuilds material at the same playhead. Stage height reserves proportional room
for the column pivot. Nine browser checks pass, including all three sizes,
reverse, independent players and 32px/max-lift overflow and clipping checks.
The user accepted the finer smoothing below and approved this size experiment;
rectangular integration remains the active continuation.

Typography review before rectangular integration: the user requested thinner
KaTeX numerals/tokens. The exemplar already uses regular KaTeX at weight 400,
with no added stroke except the deliberately strengthened negative sign.
Grayscale font smoothing is now requested on native math and retained in
computed-style material clones. This changes rasterization on supporting macOS
browsers, not the font outlines or metrics; other platforms may look unchanged.
Negative-sign thickness, bracket strokes and all motion remain unchanged.
Eight scoped browser checks pass, including native/material smoothing parity.
Visual usefulness still needs user judgment before extending the treatment.
Rectangular integration remains approved; this requested typography adjustment
is the current visual checkpoint before its new caller is built.

Current revision: shadows and their control are removed at the user's request.
Lift height now ranges from 0–24px, defaulting to 6px, and controls only the
initial rise. The hold, pivot, separate scale control and full-size background
are preserved. Invalid/nonfinite lift heights fail at the projection boundary.

The startup scrollbar flash came from scaling the full-stage material layer
inside an auto-overflow viewport. The dot stage now clips transformed overflow;
its layout minimum width still supplies intentional horizontal scrolling on
narrow screens. The browser regression checks stable scroll extents on desktop
and phone widths throughout departure and reversal, plus visible token bounds
at maximum lift. This fixes overflow ownership rather than hiding scrollbars.
Verification: `npm run test:dot-passage`, `npm run visual:dot-passage`.

Previous shadow candidate (removed): focused tokens received two downward black text
shadows, one tight and one soft, sampled from the existing departure timeline.
The 0–100% Shadow strength slider defaults to 70%; zero removes shadows.
The lifted hold uses offsets of 3px and 10px, settling to 1px and 2px at the
native endpoint. Native and moving glyphs inherit the same paint; reduced
motion uses the settled shadow and forced colors removes it. Background color,
background scale, semantic identities and motion timing are preserved.
This local depth/CSS/player revision is independently reversible; it is not a
shared renderer policy. Review the held focus at 12.5% progress on the canonical
three-term dot page, comparing 0% and 100% shadow strength. The captured maximum
shows a dark shadow below the crisp glyphs, though contrast remains limited by
the dark stage. Six unit and seven browser checks cover projection, disabling,
native/material inheritance, held poses, seeking and existing preservation laws.

Latest focus inspection revision: operators inherit their expression's ink;
negative signs retain their compact size with a .035em paint stroke shared by
native and moving occurrences. Both contributor groups rise 24px and hold for
840ms before pairing. The shared departure sampler holds geometry, foreground
scale and background opacity together; background scale remains exactly 1.
The first transition retains its 2100ms duration, so the hold leaves a shorter
pairing interval. This cadence is provisional for review on the same exemplar.
Semantic product identities and later evaluation phases are unchanged. The
rollback unit is this local CSS/departure revision. Five unit and seven browser
checks pass, including held-pose equality, reverse, sign-stroke parity and
operator color inheritance (`npm run test:dot-passage`, `npm run visual:dot-passage`).

Latest correction: the user requested **no background scaling**. The sampler
now fixes background scale at 1 for every playhead and setting, and the background
scale selector is removed. A separate foreground-lift control preserves the
existing lift comparison. Background opacity remains 40%, with the same bracket
hold/withdrawal timing. Unit and browser checks enforce the fixed background.

## Current revision: stronger separation

The user found the 80% treatment too weak and approved trying 35–45% opacity
with the brackets retained longer. The default is now **40% opaque**; foreground
material remains fully opaque. Brackets retain their presence through lift,
pivot and the paired endpoint, then fade during operator introduction before
multiplication. Background recession (98%) and foreground lift (up to 103%) are
unchanged so this comparison isolates contrast and withdrawal timing. Slider
markup now derives its default from the same settings object as the renderer.

`npm run test:dot-passage` and `npm run visual:dot-passage` check retained bracket
presence with 40% group opacity, opaque moving tokens, delayed continuous
withdrawal, reverse/seek restoration and preserved geometry/evaluation.

## Initial candidate

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
