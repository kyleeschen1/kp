# Explanation and Attention Thread

Status: active-supporting
Last Updated: 2026-08-04
Current Next Action: Review the code-native S-expression choreography at its
mandatory slice-25 human checkpoint and compare the approved economics split
layout with its bounded `?layout=inline-sticky` proof. The layout proof does not
approve the Lisp visual language, promote a default lesson shell, adopt
SvelteKit, widen the lesson rollout, or change the animation-promotion ledger.

## Goal

Make KP's explanatory text and animation behave as one coordinated argument
without reducing prose to atomic captions or asking learners to read new ideas
while watching essential motion.

## Current Decision

The accepted model is recorded in
`decisions/2026-08-02-kp-continuous-explanation-and-attention-coordination.md`.
Canonical lesson content is continuous structured Markdown. Sparse attention
annotations prepare static semantic checkpoints, focus stage objects, and
coordinate prose salience. They do not replace the prose source.

The accepted product refinement in
`decisions/2026-08-02-kp-salience-transmission-engine.md` treats learner-facing
KP as a salience-transmission engine. Each checkpoint must make the primary
target, necessary context, and attention transition evident. The economics
implementation is local discovery evidence, not a globally enforced schema.

The accepted bounded discovery in
`decisions/2026-08-04-kp-inline-sticky-lesson-layout-proof.md`, revised by
`decisions/2026-08-04-kp-depth-handoff-lesson-layout-revision.md` and refined
by
`decisions/2026-08-04-kp-depth-handoff-punctuation-and-motion-gate.md`, with
the latest visual contract in
`decisions/2026-08-04-kp-shared-plane-midpoint-fade-contract.md`, adds an
alternate one-axis lesson grammar. A diagram begins in document flow and pins
without elevation in the upper viewport. A constant-width cue gathers into a
raised shelf from viewport entry to the stage bottom. Cue and stage use the
same surface token; across the lower half-stage, one eased envelope fades the
cue and returns elevation, depth, scale, and shadow to neutral by the midpoint.
Only then does essential semantic motion begin. The focus shadow is
pre-rendered on a transparent pseudo-element; scroll projects only transform
and opacity. Native scroll snap does not own this geometry. The durable
typography, fit, progressive-enhancement, URL,
accessibility, and rollback rules live in
`../principles/inline-sticky-lesson-layout.md`. Economics is the canonical proof
through `?layout=inline-sticky`; its approved split layout remains the default
pending human comparison and a structurally different second caller.

Learners retain fine-grained control through a block-level prose scrub bar with
Rewind, Previous semantic checkpoint, Play/Pause, Next semantic checkpoint, a
continuously draggable marked timeline, and keyboard equivalents. The local
economics exemplar implements that control as a custom web component rather
than Svelte UI. Scroll projects the same block-local progress in either
direction; any manual interaction takes precedence and the next scroll input
rebases from the visible state. Reduced-motion suppresses continuous seeking,
and no coordination action auto-scrolls the page.

The accepted refinement is recorded in
`decisions/2026-08-02-kp-stable-prose-focus-divider.md`. Stable lesson prose
surrounds the control divider: the paragraph above introduces what to watch,
and the paragraph below interprets the result. The custom element displays only
controls and progress. Scroll owns prose emphasis; playback progress may alter
graph-local focus but never changes the active prose passage or stage heading.
A quiet wide-screen gutter diamond marks the `38vh` reading band. At the
divider, the Play button lifts through transform while a pre-rendered
pseudo-element shadow fades in; phones omit the fixed marker.

The implemented successor is recorded in
`decisions/2026-08-02-kp-motion-blocks-and-progressive-tutorial-navigation.md`.
Each meaningful multi-step animation now owns one stable motion block with its
own text-free controls and local semantic timeline. A viewport-relative
corridor seeks that active timeline continuously; manual control takes over and
later scroll resumes from the visible frame without jumping. Motion blocks
compose cumulatively. The economics exemplar now proves two blocks; no shared
contract was inferred inside that one-caller loop.

The same decision adds semantic deep links, deterministic state restoration, a
progressively enhanced `kp-tutorial-toc`, pre-rendered scrub controls, the
stage/surface/slot/aperture vocabulary, a solid reading pointer, and graph-plane
label backings. Svelte remains a host rather than semantic or component
authority.

The first exemplar is the approved economics supply-demand equilibrium asset.
Its lesson asks why increased demand raises both equilibrium price and quantity
when supply remains fixed. The accepted second caller is now the botanical Lisp
function-application tutorial, recorded in
`decisions/2026-08-03-kp-botanical-lisp-second-caller-and-shared-lesson-seams.md`.
It replaces generated solve-x because the user chose stronger cross-domain
pressure; solve-x remains the recommended third caller. Shared passage,
control, reader, or authoring contracts wait until the completed economics and
Lisp callers demonstrate the same lifecycle.

## Delivered Economics Exemplar

The approved source is `content/lessons/economics-demand-shift.md`. A bounded
local compiler projects its sparse passage annotations into an internal Svelte
5 route at `/tutorials/economics/demand-shift/`. The integrated human checkpoint
is in `reviews/2026-08-02-economics-text-animation-integrated-checkpoint.md`.

The delivered exemplar includes:

- four continuous sections over one persistent graph;
- a graph-led causal argument with equations as later verification;
- a non-gating prediction before motion and synthesis after settlement;
- stable passage, claim, object, and checkpoint references;
- a persistent graph-only stage plus a prose-column custom element containing
  Rewind, Previous, Play/Pause, Next, and a marked continuous scrubber;
- one visible animation boundary that names the demand shift and fixed supply,
  through stable surrounding prose, plays when crossed downward, and rewinds
  when crossed upward;
- a text-free control divider, wide-screen reading-band gutter marker, and
  composited Play-button lift and shadow;
- mirrored direction changes without curve jumps, manual timeline ownership,
  no scroll seeking, and a reduced-motion manual fallback;
- a stable compact phone dock with temporary expansion;
- inline KaTeX with paragraph indentation explicitly reset inside math boxes,
  quiet equations until verification, and the existing Review capture dock;
- economics-local focus profiles, semantic curve/point/equation targets,
  graph-local attenuation, and a graph-local spotlight;
- a gentle wide-screen page wash that leaves the active passage and complete
  stage clear;
- a contiguous wide stage with no card border, radius, shadow, or separate
  graph plane, while the fixed phone dock retains its surface boundary;
- no cross-layout connector on wide or phone layouts after human rejection;
- conventional first-line indents for lesson body paragraphs;
- economics-local rollback and preservation boundaries.

The 28-slice motion-block/publication loop is resolved. Subsequent human-
requested refinements place a fixed TOC to the left of the prose, keep it
vertically centered, strengthen the always-solid reading pointer, widen the
three-column gutters, and increase prose line height. These refinements are now
part of the economics reference baseline for the next caller.

## Accepted Product Boundary

After editorial approval, the first implementation is one bounded internal
Svelte 5 lesson route. Svelte owns host composition only. The Markdown,
semantic asset, exact model, runtime frame, clock, renderer, and attention
meaning remain framework-neutral.

The wide projection uses a persistent stage beside prose. The phone projection
uses a stable compact stage dock at roughly one third of the viewport with
temporary expansion. Active prose receives a subtle positive left rule or
tint. A gentle wide-screen wash lowers surrounding contrast without hiding or
blurring prose; the phone does not use the page wash. Mathematical text uses
inline KaTeX and section headings begin at the visual scale of `h3`.

## Promotion Sequence

1. Human editorial review of economics prose and storyboard. Complete.
2. Economics-local Svelte 5 integrated exemplar with cheap preservation checks.
   Complete.
3. Economics-local two-block, scroll-corridor, deep-link, TOC, progressive-
   enhancement, and stage-composition revision. Complete.
4. Human review and requested navigation/typography refinements. Complete.
5. Lisp semantic asset and local tutorial as the structurally different
   second caller. Complete; the original botanical renderer remains only as a
   rollback reference while the code-native S-expression checkpoint is under
   review.
6. Comparison of economics, Lisp, and the existing lesson document, followed
   by extraction of only caller-proven shared lesson mechanics. Complete.
7. Human review of the code-native S-expression choreography and shared lesson
   ergonomics. Current checkpoint at slice 25; repeated-variable pressure and
   botanical-renderer retirement remain gated on approval.
8. Generated solve-x as a third caller before broad lesson rollout.

## Out Of Scope

- resuming or reranking the tabled linear algebra frontier;
- changing the approved economics graph during integrated review;
- many inline players, unannounced or catalogue-wide autoplay, lesson-global
  scroll scrubbing, or prose auto-scrolling;
- replacing full prose with cue cards or a transcript rail;
- an authoring editor before the hand-authored exemplar passes;
- SvelteKit adoption, Public Web, or a Public Editor during discovery;
- live or runtime LLM prose generation;
- consumer/producer-surplus or deadweight-loss teaching in this lesson;
- a generic programming-language pack, universal scene graph, or catalogue-
  wide lesson rollout inside the two-caller loop.

## Next Human Questions

- Does the code-native S-expression material clarify recursive identity and
  binding without competing with native code?
- Are the three Lisp motion blocks calm enough to preserve the continuous-prose
  cadence established by economics?
- Which lesson-shell behaviors are genuinely identical across graph and code
  stages, and which should remain domain-local adapters?
- After the shared seam is visible in both callers, does generated solve-x
  expose any equation-specific pressure before wider lesson adoption?

## Links

- `docs/project/decisions/2026-08-02-kp-continuous-explanation-and-attention-coordination.md`
- `docs/project/decisions/2026-08-02-kp-salience-transmission-engine.md`
- `docs/project/decisions/2026-08-03-kp-botanical-lisp-second-caller-and-shared-lesson-seams.md`
- `docs/project/reviews/2026-08-03-botanical-lisp-shared-lesson-long-loop-proposal.md`
- `docs/project/reviews/2026-08-02-economics-demand-shift-lesson-draft.md`
- `docs/project/reviews/2026-08-02-economics-text-animation-editorial-checkpoint.md`
- `docs/project/reviews/2026-08-02-economics-text-animation-integrated-checkpoint.md`
- `docs/project/reviews/2026-08-01-economics-equilibrium-exemplar-checkpoint.md`
- `docs/project/threads/cross-domain-tutorial-platform.md`
- `docs/project/threads/animation-library-promotion.md`
