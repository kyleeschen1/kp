# Explanation and Attention Thread

Status: active-supporting
Last Updated: 2026-08-02
Current Next Action: Human-review the integrated economics tutorial at
`/tutorials/economics/demand-shift/` for reading cadence, stage coordination,
semantic controls, and the compact phone dock. Do not generalize the local
lesson compiler or begin the solve-x caller before this checkpoint is approved.

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

Learners retain fine-grained control through Previous semantic checkpoint,
Play/Pause, Next semantic checkpoint, a continuously draggable marked
scrubber, and keyboard equivalents. Scroll may select a passage through a
stable reading band and prepare a static state, but it never autoplays and no
coordination action auto-scrolls the page.

The first exemplar is the approved economics supply-demand equilibrium asset.
Its lesson asks why increased demand raises both equilibrium price and quantity
when supply remains fixed. The generated solve-x lesson is the second caller.
Shared passage, control, reader, or authoring contracts wait until both callers
demonstrate the boundary.

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
- a persistent stage, explicit Previous/Play/Next controls, and a marked
  continuous scrubber without page reloads;
- a stable compact phone dock with temporary expansion;
- inline KaTeX, quiet equations until verification, and the existing Review
  capture dock;
- economics-local rollback and preservation boundaries.

## Accepted Product Boundary

After editorial approval, the first implementation is one bounded internal
Svelte 5 lesson route. Svelte owns host composition only. The Markdown,
semantic asset, exact model, runtime frame, clock, renderer, and attention
meaning remain framework-neutral.

The wide projection uses a persistent stage beside prose. The phone projection
uses a stable compact stage dock at roughly one third of the viewport with
temporary expansion. Active prose receives a subtle positive left rule or
tint; surrounding prose is never dimmed or blurred. Mathematical text uses
inline KaTeX and section headings begin at the visual scale of `h3`.

## Promotion Sequence

1. Human editorial review of economics prose and storyboard. Complete.
2. Economics-local Svelte 5 integrated exemplar with cheap preservation checks.
   Complete.
3. Human review of cadence, choreography, controls, wide layout, and phone dock.
   Current checkpoint.
4. Generated solve-x as a structurally different second caller.
5. Promotion of only caller-proven shared attention and document contracts.
6. Broader responsive, accessibility, cross-browser, and release checks.

## Out Of Scope

- resuming or reranking the tabled linear algebra frontier;
- changing the approved economics graph during integrated review;
- many inline players, autoplay on scroll, or prose auto-scrolling;
- replacing full prose with cue cards or a transcript rail;
- an authoring editor before the hand-authored exemplar passes;
- SvelteKit adoption, Public Web, or a Public Editor during discovery;
- live or runtime LLM prose generation;
- consumer/producer-surplus or deadweight-loss teaching in this lesson;
- a generic reader schema or catalogue-wide rollout before solve-x pressure.

## Open Human Questions

- Does the persistent stage coordinate attention without making the prose feel
  subordinate or crowded?
- Are Previous/Play/Next and the marked scrubber sufficient for both conceptual
  and fine-grained control?
- Does passage selection prepare the right static state without surprising
  motion?
- Is the phone dock large enough to read while leaving enough room for prose?
- Should any local cadence, emphasis, or control detail change before solve-x
  pressures the boundary?

## Links

- `docs/project/decisions/2026-08-02-kp-continuous-explanation-and-attention-coordination.md`
- `docs/project/reviews/2026-08-02-economics-demand-shift-lesson-draft.md`
- `docs/project/reviews/2026-08-02-economics-text-animation-editorial-checkpoint.md`
- `docs/project/reviews/2026-08-02-economics-text-animation-integrated-checkpoint.md`
- `docs/project/reviews/2026-08-01-economics-equilibrium-exemplar-checkpoint.md`
- `docs/project/threads/cross-domain-tutorial-platform.md`
- `docs/project/threads/animation-library-promotion.md`
