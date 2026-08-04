# Trial A Reversible Midnight Theme In The Economics Lesson

Date: 2026-08-04
Status: accepted for bounded discovery

## Decision

Add a reversible dark presentation to the economics demand-shift lesson. Its
page and continuous-canvas stage use `#0d0e1c`; prose, mathematical foreground,
muted text, structure, surfaces, and graph roles come from explicit semantic
CSS custom properties. Stable and changing graph curves remain distinct
SteelBlue and red roles, adjusted for contrast rather than replaced with new
semantic meanings.

Light remains the default. `?theme=dark` selects and shares the dark state. A
small switch at the bottom of the lesson changes the theme with
`history.replaceState`, preserving the current layout, model parameters,
semantic hash, scroll position, document identity, and geometry. Returning to
light removes the default-valued theme parameter. A tiny route-head bootstrap
sets the root theme before the application mounts so a direct dark URL does not
begin with a light page flash.

The stage occlusion surface uses the same `#0d0e1c` RGB channels at `0.96`
opacity. Its player and inline-sticky plot plane remain transparent, preserving
the continuous canvas. KaTeX retains its renderer-owned fonts and metrics; only
its foreground role changes. The native switch has stable pre-enhancement
geometry, an accessible label and pressed state, reduced-motion behavior, and
enough wrapping room for large text.

Review capture records stable theme identities:

- `theme.kp.lesson.economics-paper-v1` for light;
- `theme.kp.lesson.economics-midnight-v1` for dark.

## Reason

A dark theme should be a color-role projection, not a second lesson layout or
a fork of graph and control markup. Query state makes the result reproducible,
while an in-page switch lets a reader compare it without navigation, lost
scroll, or layout shift. The early root bootstrap makes direct navigation
visually coherent without adding a theme library or a second client runtime.

## Preservation Boundary

Preserve the lesson prose, mathematical truth, semantic frames, graph geometry,
motion clocks, paragraph-owned scroll projection, controls, TOC, accessibility
truth, and approved light presentation. Theme changes must not alter measured
lesson width, height, scroll position, stage fit, or animation progress.

The economics theme module, its role-token overrides, and its footer switch are
one independently reversible unit. This decision does not establish an
application-wide theme provider, change another lesson, revise the promoted
graph profile, or make dark mode the default.

## Proof Criteria

- direct dark URLs paint the root, page, and inline-sticky occlusion surface
  from the midnight role before the lesson becomes interactive;
- prose and math have readable contrast and the graph preserves structural,
  stable, changing, guide, and focal distinctions;
- toggling in either direction preserves the live document, query state other
  than `theme`, scroll position, and measured lesson geometry;
- the switch remains within wide, phone, and 200%-text viewports;
- reduced motion removes decorative switch interpolation;
- light and dark review notes report the matching stable theme identity;
- static publication, type, architecture, production, and focused browser
  checks remain clean.

## Promotion Boundary

The economics lesson is the only approved caller. A second structurally
different lesson must demonstrate the same semantic role set, early paint,
progressive markup, query contract, and geometry invariance before KP gains a
shared lesson-theme API. Human review may revise the midnight palette before
that pressure test.

## References

- `2026-08-04-kp-paragraph-owned-stage-occlusion.md`
- `2026-08-01-kp-dimensional-continuity-graph-and-diagram-language.md`
- `../principles/inline-sticky-lesson-layout.md`
