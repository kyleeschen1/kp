# Focus Deck Shared Shell And Log-Exponent Pressure

Status: accepted
Date: 2026-09-01

## Decision

Keep the approved supply-tax Focus Deck as the visual reference and place the
canonical `2^x=7` logarithmic solve on the same page as a bounded second caller.
Both cards use one projection scaffold for frame, header, stage/passage
geometry, scrubber, navigation controls, and accessibility hooks. Economics
and equation semantics, deterministic clocks, and SVG/Native-KaTeX renderers
remain domain-owned.

The logarithmic card reuses
`animation.algebra.log-exponent.solve-two-power-x`, its governed operations,
canonical timeline, native endpoints, and existing compositor. Page or deck
code may select semantic beats and explanatory prose; it may not recreate the
equation transformation, infer lineage from glyphs, or substitute a generic
transition.

## Deferred Work

Defer the surface-to-contour Graph3D card. Its 3D transition is broken and its
stage still escapes the card. Preserve the experiment and fit work as
diagnostic evidence, but do not promote either as shared Focus Deck authority.

## Boundary

This decision authorizes one shared projection-shell extraction and one
equation caller. It does not authorize automatic Article-to-deck generation,
a universal deck runtime, a shared cross-domain semantic model, or migration
of the catalogue. Human review of the two-card page remains the promotion gate.
