# Stable prose and focus-divider playback boundary

Date: 2026-08-02
Status: accepted
Scope: economics tutorial discovery exemplar
Supersedes: only the animation-phase viewing-copy treatment in
`2026-08-02-kp-continuous-explanation-and-attention-coordination.md`
Superseded in part: the diamond marker and crossing-triggered clock are
replaced by the solid reading pointer and local scroll corridors in
`2026-08-02-kp-motion-blocks-and-progressive-tutorial-navigation.md`.

## Context

The first prose playback boundary placed a changing “what to watch” instruction
inside the custom control element. Although the cue, graph focus, and semantic
timeline agreed, changing prose while the graph moved created an additional
focus handoff at the moment the learner should watch the animation. KP should
transmit salience without making text another animated surface.

## Decision

The explanatory copy remains ordinary, spatially stable lesson prose. The
before-motion paragraph sits immediately above the playback divider and names
the expected change and retained context. The after-motion paragraph sits below
the divider and interprets the result. Playback never replaces or rewrites
either paragraph.

The custom web component contains controls only: Rewind, Previous, Play/Pause,
Next, the continuous scrubber, and its compact progress readout. It contains no
visible title, viewing instruction, or playback-status sentence. Screen-reader
state remains available through control names, the lesson's hidden checkpoint
announcement, and a host label that identifies reduced-motion behavior.

Scroll and playback have separate attention authority:

- scroll position selects emphasized prose through the local reading band;
- crossing the control divider plays downward or rewinds upward;
- playback progress may change graph-local visual focus and the scrubber;
- playback progress does not change the active prose passage or stage heading;
- explicit Previous or Next actions may change checkpoints because the learner
  requested that semantic move.

On wide screens, a small fixed diamond in the prose gutter marks the reading
height at `38vh`. It remains quiet between anchors and strengthens as a passage
or the playback divider approaches. The passage's existing left rule meets the
diamond at crossing. The marker does not extend a line across the page and is
omitted on phones, where the fixed stage already makes the viewport boundary
evident.

The playback divider is one local hairline behind the controls. As it
approaches the reading band, an accent hairline fades in and the Play button
gradually lifts. The stronger button shadow is pre-rendered on a pseudo-element;
only its opacity and the button transform animate. This follows Tobias Ahlin's
[composited box-shadow technique](https://tobiasahlin.com/blog/how-to-animate-box-shadow/)
instead of interpolating `box-shadow` on every scroll frame. Reduced-motion
removes the lift and all transitions while retaining the focus state and manual
controls.

## Preservation and promotion boundary

The exact economics model, graph language, runtime, semantic progress,
directional autoplay, manual ownership, reduced-motion policy, page wash,
phone dock, Review lifecycle, and inline-KaTeX fix remain unchanged. The
smallest rollback unit is the economics tutorial's control element styling,
reading-band marker, local host projection, tests, and this decision.

This is still one-caller discovery evidence. It does not promote a shared
reader schema, global gutter marker, catalogue-wide autoplay rule, or SvelteKit
surface before economics approval and solve-x pressure.
