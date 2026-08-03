# Economics text-animation integrated checkpoint

Status: `HUMAN_CHECKPOINT`
Review type: reading cadence, attention coordination, controls, and responsive layout
URL: `/tutorials/economics/demand-shift/`

## Delivered exemplar

The approved four-section demand-shift explanation now has one dedicated
internal tutorial URL. `content/lessons/economics-demand-shift.md` is the
canonical prose source. A deliberately economics-local compiler recognizes
sparse passage annotations and inline mathematics; Svelte 5 owns only host
composition around the existing framework-neutral animation asset and runtime.

The route provides:

- continuous prose that remains coherent without motion;
- one persistent graph, with no navigation reload while attention changes;
- static passage preparation without autoplay or prose auto-scrolling;
- Previous, Play/Pause, Next, and a marked continuous scrubber;
- a graph-led explanation with equations quiet until verification;
- non-gating prediction and synthesis reveals;
- optional parameter exploration after synthesis with a return-to-example
  action;
- inline KaTeX, compact section headings, and the lower-left Review dock;
- a stable compact phone stage with optional temporary expansion.

## Review questions

1. Does the prose-stage cadence keep enough conceptual context without making
   either side feel crowded?
2. Do passage changes prepare the graph state you expect, without unwanted
   motion?
3. Are the semantic buttons and scrubber enough for both stepwise and
   fine-grained control?
4. Are prediction, graph motion, equation verification, synthesis, and
   exploration in the right order?
5. Does the phone dock preserve both graph legibility and reading space?
6. What economics-local revision, if any, is necessary before using generated
   solve-x as the structurally different second caller?

## Preservation and promotion boundary

Preserve the approved economics model, graph treatment, catalogue host,
framework-neutral asset/runtime contracts, exact seek and rewind, URL state,
accessibility summary, and Review lifecycle. The smallest rollback unit is the
tutorial route, its local compiler, local checkpoints, and local styles.

Approval authorizes generated solve-x as the second caller. It does not yet
authorize a shared passage schema, catalogue-wide rollout, SvelteKit migration,
editor implementation, public site, live LLM prose, or changes to the tabled
matrix frontier.

## Verification evidence

- `npm run test:economics-demand-shift-tutorial`
- `npm run visual:economics-demand-shift-tutorial`
- `npm run check:animation-library-display-catalog`
- `npm run check:architecture`
- `npm run typecheck`
- `npm run build`
