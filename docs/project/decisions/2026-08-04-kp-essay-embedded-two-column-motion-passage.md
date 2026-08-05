# Embed Two-Column Motion Passages Inside Essays

Date: 2026-08-04
Status: implemented economics exemplar; awaiting human visual review

## Direction

Treat the two-column scrollytelling sequence as a bounded motion passage inside
an otherwise ordinary essay. It is not a lesson-wide mode and must enter and
leave normal document flow cleanly.

The passage begins with one semantic `h3` title spanning the combined animation
and prose width. One quiet rule beneath that title spans both columns. Remove
the redundant second title/entrance label. The passage ends with a matching
full-width rule. The rules provide the mode boundary; do not add a surrounding
card, oversized container, or ornamental gate.

On a wide viewport, the stage and first prose paragraph reach their pinned
geometry together. The stage centers and locks while the first paragraph's top
is already at the focus line (currently `35vh`). That paragraph is fully
salient and its exact initial semantic state is already applied. Do not insert
a large blank runway between the top rule and the first paragraph.

The last paragraph settles its effects when its top reaches the same focus
line. The exit rule follows the natural last-paragraph block. A short final
paragraph receives only enough terminal geometry to reach the focus line; a
long paragraph contributes its own height and the rule follows its bottom.
Avoid a universal viewport-sized final spacer. Sticky release and the bottom
rule must derive from the same end sentinel so the graph cannot release before
the final state is registered.

The default interpretation of a rule that “sweeps” both columns is a static
full-span rule. Literal entrance animation remains optional and unapproved; if
tested later, it must use transform-only paint, run once, respect reduced
motion, and never own semantic progress.

## Next-Loop Graph Corrections

- Use black or a neutral near-black for axes in light mode.
- When both displayed domains stop at zero, the x- and y-axes must terminate
  at one exact shared `(0,0)` endpoint. They must not extend past one another
  into crossing tails. Signed domains still use genuine crossing axes.
- Pin the light-mode supply curve to CSS SteelBlue (`#4682b4`).
- Change the dark-mode axis from the current `#aab3c4` to an intermediate grey
  near `#a2acbf`, halfway toward the former `#9aa5ba`, subject to visual review.
- Give `P` and `Q` a larger, tokenized gap from their respective axes while
  retaining midpoint alignment.
- Remove visible curve labels, equilibrium labels, line annotations, and the
  equilibrium tooltip for now. Keep `P` and `Q`; preserve equivalent semantic
  and accessible descriptions outside visible graph paint.
- Retain the former equilibrium's horizontal and vertical guide lines as
  ghost guides after the new equilibrium appears. Preserve their guide-line
  dash language rather than turning them into a different line type.
- Give light and dark ghosts deliberately different role palettes. A shared
  motif may define casing/core relationships, but each theme must own visibly
  distinct casing and core colors rather than relying on values that appear
  identical across backgrounds.

These are economics-exemplar corrections. The ghost treatment remains a
candidate until it passes human review and a second caller.

## Light Prose Diagnosis

The light theme currently uses blue-slate `#263845`, not black, on `#f4f1e9`,
with Source Serif at weight 425. The hue can read as diluted or hazy even at a
nominally heavier weight. In the next loop, compare a neutral near-black around
`#181a1b` at weights 400 and 425. Keep opacity at one and remove text shadow,
filter, or compositing as variables in that checkpoint. Prefer the lowest
weight that remains crisp; do not compensate for a low-contrast color by
continually thickening the font.

## Code And KaTeX Pressure

The passage shell may be renderer-neutral, but code and mathematics need
content-specific fit policies:

- Never scale prose, code glyphs, or KaTeX merely to satisfy the two-column
  geometry.
- Give each stage a declared minimum useful inline and block size. Fall back
  from two columns to stacked sticky or ordinary reading flow when that minimum
  is unavailable.
- Short code excerpts should fit a stable `ch`-based measure. Long code needs
  authored line selection, meaningful wrapping, or a reading-mode fallback;
  an internal horizontal scroller is not the default scrollytelling solution.
- Inline KaTeX inherits prose size. Long display mathematics needs authored
  semantic breaks or a compact notation projection, not blanket CSS scaling.
- Server-render or statically compile KaTeX, preload its required fonts, and
  pre-render code highlighting so late client enhancement does not move the
  focus line or recalculate semantic progress after first paint.
- Font loading, browser zoom, and large-text changes must trigger one geometry
  resample before scroll projection. If readable fit fails, choose ordinary
  reading flow rather than compressing the content.

At the current dimensions, concise Lisp expressions and ordinary inline KaTeX
are good pressure callers. Wide programs, large matrices, and multi-line
derivations are not guaranteed to fit and should test the explicit fallback
contract rather than force a wider universal passage.

## Preservation Boundary

Preserve the economics model, exact semantic frames, scroll reconstruction,
small equilibrium rings, framework-neutral animation asset, theme URL, text-
side URL, line tuner, Review capture, phone fallback, and the accepted default
and inline-sticky routes. This next loop may revise the query-selected
two-column presentation and its economics-local theme tokens; it does not
promote a universal essay embed, graph palette, ghost motif, or renderer fit
policy.

## Exemplar Checkpoint

Stop after the economics essay-embedded passage proves:

- one full-span title and top rule, with no redundant second title;
- synchronized initial pin, first-paragraph focus, and initial graph state;
- no oversized top or terminal whitespace;
- one bottom rule and jump-free final semantic settlement/release;
- the requested light/dark graph and prose corrections; and
- stable phone, large-text, no-JavaScript, URL, and reverse-scroll behavior.

Human review precedes generalization to code, KaTeX-heavy lessons, or a shared
motion-passage component.

## Implementation Checkpoint

The query-selected economics exemplar now implements this decision. Its
section `h3` and top rule span both columns, the redundant entrance title is
absent, the first paragraph reaches the `35vh` focus line as the stage pins at
`14vh`, and a natural terminal block brings the bottom rule and sticky release
forward without a viewport-sized runway. The default and inline-sticky routes
remain independent rollback references.

The graph uses theme-specific axis and ghost palettes, hides contextual curve
and equilibrium labels in this projection, retains only `P` and `Q`, and paints
the former equilibrium's dashed price and quantity guides after the shift.
Light prose uses neutral near-black ink. Zero-bounded graph axes now project
through one reusable shared-endpoint rule, with focused tests proving that
both segments terminate at exactly `(0,0)` while signed graphs continue to
cross.

Automated checks and screenshot review passed for the economics semantic suite,
the two-column Chromium route, its phone fallback, the inline-sticky rollback
route, the default tutorial route, TypeScript/Svelte diagnostics, and the
production build. Promotion to a shared passage shell or ghost motif remains
blocked on this human checkpoint and a structurally different caller.

## Queued Next-Loop Spacing Probe

Add an internal-only spacing tuner to the query-selected two-column economics
exemplar. It should expose the existing
`--kp-two-column-paragraph-gap-vh` token over a deliberately broad `0–100vh`
range in `1vh` steps, retain `16vh` as the current starting value, and sit with
the other bottom-of-page review controls. Persist the experimental value in the
URL and Review capture so a useful setting can be reproduced exactly.

This is a discovery instrument, not learner-facing transport or a promoted
lesson-authoring control. One token must remain the authority for paragraph
spacing; changing it should request one coalesced geometry resample so prose
layout, attention ownership, sticky release, and scroll projection update
together without adding another animation clock. The phone reading fallback
must remain readable at every stored value and may clamp or ignore the desktop
experiment rather than inherit extreme viewport gaps.

The next loop should compare at least zero, the current default, a middle
setting, and the maximum in forward and reverse scroll. Deliberate reflow after
a user changes the tuner is expected; late-load layout shift, semantic snapping,
and a different reconstructed state for the same URL are not.

The current production tutorial baseline passes its existing test with
`321,274 / 360,000` initial transfer bytes, `243,336 / 275,000` script bytes,
`48 / 48` resources, a `140 / 150ms` longest initial task, and a `33.7 / 42ms`
active p95 frame. That is enough for the six-cue exemplar but leaves little
headroom and does not certify a dense essay. Alongside the tuner, add a bounded
stress probe that distinguishes many cues driving one persistent stage from
many independent stages. The former should retain one coalesced scroll frame
and move toward cached document-space cue geometry rather than measuring every
paragraph on every scroll frame; the latter should remain static or dehydrated
outside a small near-viewport activation window. Do not promote a dense-page
claim from the existing six-cue result.

## References

- `2026-08-04-kp-two-column-natural-graph-and-uniform-strokes.md`
- `2026-08-04-kp-economics-question-driven-explanatory-spine.md`
- `../principles/inline-sticky-lesson-layout.md`
- `../threads/explanation-attention.md`
