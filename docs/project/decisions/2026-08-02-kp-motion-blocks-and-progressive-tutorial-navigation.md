# Motion blocks and progressive tutorial navigation

Date: 2026-08-02
Status: accepted
Scope: economics tutorial discovery exemplar and portable tutorial-control
standards
Supersedes:

- the crossing-triggered autoplay and “scroll never seeks” rules in
  `2026-08-02-kp-continuous-explanation-and-attention-coordination.md`;
- the diamond reading-band marker in
  `2026-08-02-kp-stable-prose-focus-divider.md`; and
- client-created shadow-DOM markup as the only scrub-bar rendering path.

## Context

The first economics tutorial plays or rewinds an independent animation clock
when one prose divider crosses the reading band. That avoids curve jumps, but
the animation immediately becomes detached from the learner's viewport motion.
It also treats the lesson as if it had one global animation boundary. The
accepted direction is instead to give every meaningful multi-step animation
its own stable explanatory text, controls, semantic timeline, URL identity,
and bounded scroll corridor.

KP also needs a small presentation grammar for content entering and leaving a
persistent stage, revealing progressively, and composing into multiple
surfaces. Those motifs must remain renderer-neutral and caller-proven rather
than becoming a speculative universal scene graph.

## Decision

### Make the motion block the learner-facing unit

A motion block is one conceptual step with:

- stable explanatory prose;
- one animation reference and local semantic timeline;
- Previous, Play/Pause, Next, Rewind, and continuous scrub controls;
- named semantic checkpoints;
- one bounded viewport-relative scroll corridor;
- an explicit entry state and settled state; and
- the stage focus and composition needed to explain that step.

The prose never changes while the animation plays. The control custom element
remains text-free. Ordinary prose may precede and interpret the motion block,
but each multi-step animation receives its own visible text-and-controls
container rather than borrowing a lesson-global player.

Motion blocks compose cumulatively. When block `n` is active, every preceding
block is projected at its settled state, block `n` is projected at its local
progress, and later blocks remain inactive. Rewinding a later block returns to
the preceding block's settled state rather than resetting the entire lesson.
Direct navigation derives this projection from semantic IDs; it never rapidly
replays all earlier animations or relies on accumulated DOM state.

### Let bounded scroll motion seek the active local timeline

Scroll position is the default progress authority while a motion block owns the
reading band. Its local corridor maps viewport-relative travel to semantic
progress, including authored hold intervals before motion, at important
handoffs, and after settlement. Scrolling down advances; scrolling up rewinds;
stopping stops motion. A short bounded visual follower may interpolate
coalesced input frames, but there is no free-running autoplay clock after the
scroll target changes.

Manual controls remain an explicit alternative. Play, scrub, checkpoint, or
parameter interaction temporarily owns the local timeline. A later deliberate
scroll cancels free-running playback and resumes from the visible frame through
a rebased corridor, without snapping. Reduced-motion remains manual-only. One
lesson coordinator activates at most one block and one scroll animation frame
at a time; individual blocks do not install competing clocks.

### Pressure cumulative motion with a second economics block

The first block retains the approved demand-curve shift. A second block begins
from the shifted equilibrium and explains that supply did not shift. It
emphasizes the unchanged supply curve, traces the equilibrium movement from
`E_0` to `E_1` along that curve, and progressively verifies that both price and
quantity rose. It reuses the exact approved economics model rather than adding
surplus, deadweight loss, or a new economics engine.

### Use a small stage-composition grammar

The portable vocabulary is:

- **stage**: the persistent presentation region;
- **surface**: a graph, equation, diagram, code view, table, or other renderer;
- **slot**: a surface's place in the current composition; and
- **aperture**: the clipped boundary through which a surface is revealed.

The economics exemplar may locally prove split, merge, aperture ingress and
egress, and progressive reveal. The outer stage keeps stable dimensions. End
layouts are computed before motion; internal surfaces use transforms, opacity,
and clipping where possible instead of document-layout animation. Directional
ingress means that content is introduced from outside the current view;
information derived in place reveals locally. Mathematical expressions reveal
as complete semantic KaTeX groups, never character-by-character.

Graph label backings use the exact graph-plane surface token in their neutral
state. They are not white in preparation for a later focus state. Focus is
communicated through foreground emphasis, bounded outline or shadow, and
context attenuation rather than a premature label card.

### Make reading position explicit without another page-wide connector

The wide-screen reading-band diamond becomes a solid right-pointing triangle
whose color matches the active block's left rule. Its tip meets that rule at
the reading band. The marker is fixed above the wash and text surfaces,
ignores pointer input, carries a restrained static shadow, and does not pulse or
bob. Phones use a bounded local treatment or omit the fixed gutter marker.

### Give every block and checkpoint a reconstructible URL

Animation blocks and named semantic checkpoints receive stable URL identities.
URLs encode authored semantic destinations rather than milliseconds, renderer
coordinates, or choreography-dependent fractional progress. Resolving a URL
reconstructs preceding settled blocks, the target local checkpoint, later
inactive blocks, stage layout, focus, reveal state, scrubber state, and active
prose.

Explicit TOC, checkpoint, and browser-history navigation use a transaction:
suspend scroll ownership, derive and seek the complete target projection, move
the target block to the reading band, update controls and URL, then release
scroll ownership. Intermediate blocks must not animate during a long jump.
Passive scrolling replaces history only at semantic boundaries; explicit
navigation creates history entries.

`kp-tutorial-toc` is a framework-neutral custom element over ordinary semantic
navigation links. Major lesson sections and motion blocks remain directly
visible; local checkpoints may nest under the active block. The active link
uses `aria-current`. The element emits navigation intent but does not own
lesson or animation truth.

### Progressively enhance every tutorial custom element

Concise tags and Markdown annotations remain the authoring language, but they
are not the final browser payload. A build or server renderer expands each
custom element into complete, correctly sized semantic HTML before upgrade.
Baseline CSS styles undefined elements at their final geometry. Upgrade binds
behavior to the existing nodes and may add non-layout emphasis; it does not
introduce primary content, replace the control tree, or change occupied
geometry.

The TOC ships as usable links before JavaScript. The scrub bar ships its final
controls and dimensions; checkpoint navigation has link fallbacks and
JavaScript-only transport is explicitly unavailable until enhancement. Direct,
compiler-free embedding may reserve a declared intrinsic size as an escape
hatch, but publication uses pre-rendered markup.

The portable package boundary exposes pure semantic/state resolvers, static
HTML renderers, standalone CSS/tokens, custom-element definitions, properties,
and composed DOM events. Svelte 5 or SvelteKit may place components and invoke
the renderers, but may not own their semantic timeline, checkpoint resolver,
URL contract, or internal DOM after upgrade. App-specific catalogue and editor
UI need not become web components.

### Retain a low-JavaScript delivery path

Prose, inline KaTeX, navigation links, control geometry, and the initial stage
checkpoint render ahead of client enhancement. KaTeX compilation remains off
the learner runtime. Tutorial-control code stays capability-scoped; later
animation surfaces load near use; only the active block samples scroll or
paints frames. Component-upgrade CLS, route transfer, long tasks, and active
frame timing receive stable measurements before this exemplar is offered for
approval.

## Canonical exemplar and acceptance

The canonical reference remains
`/tutorials/economics/demand-shift/`. The exemplar passes objective review when:

- two stable motion blocks have independent controls and exact cumulative
  direct-seek/rewind behavior;
- viewport travel continuously controls only the active local timeline;
- manual takeover and later scroll resumption never jump;
- the second block starts from the first block's exact settled state;
- graph labels blend with the graph plane before focus;
- the verification surface enters, reveals, tiles, and exits reversibly inside
  a stable outer stage;
- the solid reading pointer identifies the active block without obscuring text;
- every block and checkpoint deep link reconstructs the complete visible
  state, including through Back and Forward;
- the TOC and scrubber render at final geometry and remain meaningful before
  upgrade;
- wide, phone, reduced-motion, keyboard, no-JavaScript, and performance checks
  pass; and
- the existing economics model, catalogue asset, graph language, Review
  capture, and exploration parameter remain intact.

## Preservation, rollback, and promotion boundary

The exact economics semantics, approved demand-shift animation, dimensional-
continuity graph profile, native renderer authority, fixed moving-number
format, page prose, Review lifecycle, and tabled linear-algebra frontier remain
preserved. The smallest rollback unit is one verified slice commit. All new
stage, reveal, URL, TOC, and scroll contracts remain economics-local or
explicitly experimental until human review and the generated solve-x second
caller prove a shared boundary.

This decision does not authorize SvelteKit adoption, Public Web, a public or
internal editor, a universal scene graph, a universal motif registry, a global
autoplay/scroll rule, live LLM prose, surplus/deadweight-loss content, or
catalogue-wide rollout.

