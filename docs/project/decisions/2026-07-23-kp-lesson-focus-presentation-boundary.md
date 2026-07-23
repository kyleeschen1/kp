# Lesson focus presentation boundary

Date: 2026-07-23
Status: accepted direction

## Decision

Learner-facing lessons must not show the rectangular token outlines used by
the editor animation player's `flat` focus experiment. This applies to the
promoted exponent splitting, power-to-radical, and function-wrapping
exemplars, and to later lesson integrations that reuse their motion.

The boxes are presentation diagnostics, not semantic notation. Lessons may
retain subtler focus cues such as contrast, salience transfer, bounded
elevation, or a shared non-rectangular shadow, provided those cues do not alter
layout, token identity, accessibility meaning, or the exact motion path.

## Current boundary

The three promoted animations do not yet have published learner lesson routes.
The shared editor player currently defaults to the `flat` focus experiment, so
a lesson that embeds that player without an explicit lesson projection could
inherit its outlines. Promotion of a learner integration therefore requires an
automated assertion that active lesson frames have no visible token outline.

## Preservation requirements

- Keep editor diagnostics and focus experiments available for authoring and
  review.
- Do not remove semantic focus, correspondence, keyboard, touch, or
  high-contrast behavior.
- High-contrast accessibility may use an explicit outline when required for
  perceivable focus; that accessibility projection is distinct from the
  ordinary lesson presentation.
- Preserve exact native endpoints, seek, rewind, and measured motion.
- Enforce the boundary at the lesson projection rather than weakening every
  editor or renderer focus profile globally.

## Promotion check

Before exponent, radical, or function-wrap motion ships inside a learner
lesson, its browser or visual-conformance check must prove that ordinary lesson
presentation resolves `--kp-focus-outline-strength` to `0` at active focus
checkpoints.
