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

## Implemented interface ledger

This ledger records the boundary as built by the economics discovery loop. It
does not promote a public package or authorize catalogue-wide use. Names that
look generic identify framework-neutral candidates, not proven universal
abstractions.

### Stability tiers

| Tier | Status | Contents | Change rule |
| --- | --- | --- | --- |
| Durable standard | Accepted | Stable prose during motion; one control set per multi-step animation; cumulative semantic projection; semantic URLs; complete light-DOM fallback; renderer and framework neutrality; one scroll coordinator; static math; bounded performance | Future tutorial work follows these principles or records a superseding decision |
| Portable candidate | Experimental, one caller | `kp-tutorial-url.ts`, TOC model/static renderer/custom element, scrub-bar static renderer/custom element/CSS | May be reused for a second caller, but no shared schema or compatibility promise is inferred before that proof |
| Economics-local discovery | Experimental exemplar | Motion-block registry, corridor keyframes, cumulative lesson projection, stage/slot/aperture geometry, verification reveal, deep-link reconstruction, publication compiler, scroll coordinator | Do not move into a shared reader or motif package until human approval and a structurally different second caller expose the same seam |
| Host integration | Replaceable | `KpEconomicsDemandShiftTutorial.svelte`, its route entry, catalogue preparation, Review host, history and browser lifecycle wiring | Svelte may be replaced without changing semantic state, static renderers, URL grammar, element events, or animation assets |

### Static renderer and custom-element contracts

`renderKpTutorialToc(model)` returns one complete
`<kp-tutorial-toc>` light-DOM navigation tree. Before upgrade it is ordinary
semantic navigation. `KpTutorialTocElement.setActiveDestination({ kind, id })`
owns only `aria-current` presentation. Activating a link emits the bubbling,
composed, cancelable `kp:tutorial-toc-navigate` event with
`{ kind, id, href }`. A host that cancels the event owns the transaction;
otherwise the anchor retains native navigation.

`renderKpTutorialScrubBar(model)` returns one complete
`<kp-tutorial-scrub-bar>` control tree at final geometry. Rewind, Previous, and
Next are native semantic links before upgrade; Play and range seeking remain
disabled because no fallback clock exists. The custom element observes
`progress`, `playback-status`, `direction`, `controls-disabled`,
`previous-disabled`, `next-disabled`, and `manual-claimed`. It exposes
`setReadingBandProjection(...)` and `releaseManualControl()`, and emits:

- `kp:tutorial-scrub-toggle`;
- `kp:tutorial-scrub-rewind`;
- `kp:tutorial-scrub-previous`;
- `kp:tutorial-scrub-next`; and
- `kp:tutorial-scrub-seek` with `{ progress }`.

These events bubble and cross shadow boundaries, although the elements
themselves deliberately use no shadow root. The elements own control
presentation and user intent only. They never own lesson state, checkpoint
meaning, animation clocks, history, or scroll projection. Upgrade binds the
pre-rendered nodes in place; replacing the tree is a contract violation.

### Semantic URL compatibility

The only accepted destination grammar is:

```text
#kp-section-<slug>
#kp-block-<slug>
#kp-checkpoint-<slug>
```

Slugs contain lowercase letters, digits, and single hyphen-separated segments.
The codec rejects numeric progress, malformed encodings, renderer coordinates,
and unknown destination kinds. Serialization replaces an existing fragment but
preserves the route path and query. All authored TOC and control links use the
codec rather than string concatenation. The economics route is internal today;
after any URL is published, renaming its semantic ID requires an explicit
alias or migration rather than silent breakage.

Resolving a URL is pure: it produces the checkpoint, cumulative motion state,
stage composition, reveal, focus, TOC state, and target scroll projection before
mount. TOC and history changes apply that result as one transaction. Browser
layout settlement stays under the navigation lock; only deliberate wheel,
touch, or scroll-key input hands motion ownership back to the corridor.

### Authoring syntax and compilation

The economics source remains concise Markdown with one `#` title, `Kicker:`,
`Assumption:`, `###` section headings, prose paragraphs, and these annotations:

```markdown
<!-- kp:section semantic-section-id -->
<!-- kp:passage semantic-passage-id -->
<!-- kp:motion registered-motion-block-id -->
```

A section annotation appears once before its passages. A passage annotation
precedes its prose. A motion annotation appears at most once immediately after
its passage marker, must match the registered passage, and the lesson must
cover every registered local motion block exactly once. IDs are unique. Raw
HTML, empty passages, unsupported headings, and unclosed inline-math delimiters
fail compilation.

Inline `$...$` math is compiled to KaTeX HTML and MathML by the publication
compiler with `displayMode: false`; the learner runtime does not parse or
compile LaTeX. `compileKpEconomicsDemandShiftPublication(markdown)` is the one
assembly boundary for the lesson model, TOC HTML, both scrub-bar payloads, and
static verification math. Authors provide annotations and prose, not custom-
element internals.

### Progressive-delivery and performance boundary

The static TOC and scrub-bar payloads are useful and geometrically complete
with JavaScript disabled, and custom-element upgrade preserves node identity
and dimensions. The current Vite economics route still mounts its full lesson
through the client entry; complete route-level SSR or static HTML publication
is prepared by the pure compiler but is deferred to the publication/SvelteKit
phase. This distinction must remain explicit in performance or accessibility
claims.

`npm run performance:economics-demand-shift-tutorial` builds the production
route and enforces 360,000 bytes total initial transfer, 275,000 script bytes,
48 resources, CLS at or below 0.02, a startup task below 150 ms, active two-
frame p95 settlement below 42 ms, and no active task above 100 ms. The accepted
2026-08-02 measurement is 301,382 transfer bytes, 229,184 script bytes, 46
resources, startup CLS `0.0000068`, one 106 ms startup task, 33.7 ms active p95,
zero active long tasks, and at most one changing block-progress attribute per
sample.

### Promotion gate

Human approval of the economics exemplar may freeze its presentation, but it
does not by itself promote the corridor, cumulative lesson schema, or stage
grammar. Promotion requires one structurally different caller—currently the
generated solve-x tutorial candidate—to reproduce the boundary without
economics concepts, plus focused regression evidence for both callers. Until
then, consumers import the candidate modules directly and no `tutorial`
package barrel or universal scene graph is created.

## Post-checkpoint navigation and pointer refinement

The 2026-08-03 review makes the lesson TOC a persistent left rail whenever the
viewport can hold the rail, prose, and stage as three non-overlapping regions.
The rail is vertically centered against the viewport, remains independently
scrollable, and keeps the same complete static light DOM, ordinary links,
active-destination semantics, and custom-element upgrade. The three reading
regions use deliberate gutters, and prose uses a slightly more open line rhythm.
At narrower widths the TOC returns to the inline article position rather than
overlaying prose or shrinking the graph below its useful minimum.

The reading pointer is now a stable orientation marker, not a proximity
animation. It is larger, fully opaque, and painted above all passage washes and
the page veil. Reading-band proximity may still select the current passage, but
it must not fade, scale, or otherwise animate the pointer itself.
