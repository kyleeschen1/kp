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
- static pre-motion passage preparation without scroll seeking or prose
  auto-scrolling;
- an annotated inline action row that names the moving demand curve and fixed
  supply before motion begins;
- one-shot playback after a 650 ms reading-band dwell when the timeline is
  untouched, with manual interaction taking permanent precedence and
  reduced-motion retaining explicit Play only;
- Previous, Play/Pause, Next, and a marked continuous scrubber;
- a graph-led explanation with equations quiet until verification;
- non-gating prediction and synthesis reveals;
- optional parameter exploration after synthesis with a return-to-example
  action;
- inline KaTeX, compact section headings, and the lower-left Review dock;
- a stable compact phone stage with optional temporary expansion.

The salience-transmission revision adds one economics-local focus target and
context profile per checkpoint. The first human review rejected the cross-page
connector, so it has been removed on every viewport. A subtle graph-local veil
and semantic attenuation still let incidental material recede without hiding
the context needed for the claim. Lesson body paragraphs now begin with a
first-line indent.

The selected follow-up treatment adds a gentle wide-screen page wash with two
soft apertures: the active passage and the complete stage. The wide graph,
header, and controls now share the page background without card border, radius,
shadow, or a separate graph paper plane. The fixed phone dock keeps its paper
surface and shadow. This remains economics-local discovery evidence.

## Review questions

1. Does the prose-stage cadence keep enough conceptual context without making
   either side feel crowded?
2. Does the annotated “Animation ahead” row make the coming motion clear before
   the one-shot scroll handoff begins?
3. Are the semantic buttons and scrubber enough for both stepwise and
   fine-grained control?
4. Are prediction, graph motion, equation verification, synthesis, and
   exploration in the right order?
5. Does the phone dock preserve both graph legibility and reading space?
6. What economics-local revision, if any, is necessary before using generated
   solve-x as the structurally different second caller?
7. Does the graph-local focus treatment answer “where should I look?” without
   dominating the graph or hiding context?
8. Is the page wash strong enough to coordinate attention without making the
   surrounding argument feel unavailable?
9. Do the aperture softness and contiguous stage make text and animation feel
   like one argument, or does either clear region still look boxed in?
10. Does the 650 ms dwell feel calm, and do the demand curves now move smoothly
    instead of jumping as the explanation advances?

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

The broad cross-browser and release matrix remains intentionally deferred until
human selection of this subjective salience treatment, following the accepted
exemplar-first visual verification cadence.
