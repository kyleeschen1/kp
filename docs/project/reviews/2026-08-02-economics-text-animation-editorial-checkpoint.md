# Economics text-animation editorial checkpoint

Status: `HUMAN_CHECKPOINT`
Review type: prose, cadence, claims, and storyboard
Implementation status: not started

This checkpoint asks whether KP has the right explanation before it builds a
new lesson surface. Review the lesson draft at
`docs/project/reviews/2026-08-02-economics-demand-shift-lesson-draft.md` first.
No Svelte lesson UI, shared attention schema, editor, reader migration, or
animation revision is included in this checkpoint.

## Canonical reference and preservation boundary

The cadence reference is Better Explained: begin with the organizing question
and intuitive relationship, use the visual at the conceptual bottleneck,
interpret it immediately, and let notation verify or compress the idea. KP
keeps its own voice, exact semantic authority, learner control, graph language,
and accessibility contracts.

Preserve:

- the exact economics model and before/after equilibria;
- the approved dimensional-continuity graph and its compact catalogue host;
- deterministic seek, rewind, parameters, nonvisual summary, and Review;
- continuous Markdown prose as the canonical explanation;
- the tabled matrix checkpoint and the existing promotion ledger.

The smallest future rollback unit is an economics-only lesson route, attention
annotations, and local Svelte host composition. The animation asset, catalogue,
current readers, framework-neutral runtime, and prose source remain intact.

## Editorial acceptance criteria

- The lesson answers one question: why higher demand raises both equilibrium
  price and quantity while supply remains fixed.
- It remains coherent without animation and does not reduce the argument to
  cue-sized captions.
- Its four sections build a single reasoning chain and stay near the agreed
  800–1,200-word prose target.
- The graph leads the causal argument; equations verify the same result later.
- It distinguishes a shift in demand from movement along an unchanged supply
  curve.
- The concrete strawberry market clarifies the model without becoming a cute
  analogy the learner must decode.
- The prediction and synthesis pauses are useful but non-gating.
- Scope language identifies comparative statics and does not imply a literal
  time path, welfare conclusion, or universal numerical result.
- Every mathematical assertion is supported by the exact model or identified
  as a proposed claim-contract gap.
- The tone is calm and explanatory, with occasional attention prompts rather
  than constant commands.

## Attention storyboard

Passage selection prepares only the checkpoint in the “Static stage” column.
Only the explicit learner action in the “Motion” column may start animation.
While motion is in progress, prose emphasis remains on the initiating passage.

| Order | Semantic checkpoint | Prose moment | Static stage and focus | Learner action and motion | Settlement or disclosure |
| ---: | --- | --- | --- | --- | --- |
| 1 | `checkpoint.econ.orient-market` | concrete market and curve schedules | progress `0`; whole graph, axes, then supply and demand | none | concise nonvisual orientation announces axes and both schedules |
| 2 | `checkpoint.econ.initial-equilibrium` | equilibrium definition | progress `0`; focus $E_0$, guides, then before-state snapshot | Previous/Next may inspect; no autoplay | show $Q=6.00$, $P=8.00$ and the clearing claim |
| 3 | `checkpoint.econ.identify-change` | demand increases; supply stays fixed | progress `0`; pin supply, preview demand and intercept parameter | none | equation labels remain quiet; text distinguishes shift from movement |
| 4 | `checkpoint.econ.predict` | “Can the old point still clear?” | progress `0`; hold $E_0$ and both original curves | optional prediction; no gate and no correctness branch | reveal old-price shortage explanation in prose; a future visual witness is optional |
| 5 | `checkpoint.econ.ready-to-shift` | “Now play the shift” | progress `0`; focus demand, supply, and initial equilibrium | Play/Next moves through establish and shift; scrubber remains continuous | prose remains fixed while demand and intersection move up/right |
| 6 | `checkpoint.econ.handoff` | new intersection takes the role | progress near `0.72`; this is a semantic scrubber mark, not a scroll-prepared intermediate state | learner may pause, scrub, or continue | old demand and $E_0$ remain quiet references; new point owns equilibrium role |
| 7 | `checkpoint.econ.settled` | interpret the new clearing point | progress `1`; focus $E_1$ and after-state snapshot | none | show $Q=8.00$, $P=10.00$ and the clearing claim |
| 8 | `checkpoint.econ.compare-equilibria` | shift versus movement and model scope | progress `1`; compare $E_0$, $E_1$, and unchanged supply | Previous returns exactly; object selection identifies related prose without scrolling | state that supply stayed fixed while equilibrium moved along it |
| 9 | `checkpoint.econ.equation-check` | algebra verifies the graph | progress `1`; equations become salient without changing geometry | none, or inspect equation focus links | reveal the two exact solves; notation is verification, not a new story |
| 10 | `checkpoint.econ.synthesis` | “Why did quantity rise?” | progress `1`; supply and both equilibrium points | optional answer, then explicit reveal; no gate | model explanation names a new point on the same supply relationship |
| 11 | `checkpoint.econ.explore` | parameter exploration after synthesis | progress `1` at lesson default; guided prose remains complete | open secondary Parameters, change final demand intercept, play or scrub | always expose “Return to lesson example” restoring $14\rightarrow18$ and the guided checkpoint |

The semantic control strip should therefore expose marks at the stable before,
handoff, after, equation-check, and synthesis states. It need not expose a
separate button for every prose paragraph. Fine-grained control comes from the
continuous scrubber; conceptual navigation comes from semantic checkpoints.

## What the current asset already supports

| Requirement | Current evidence | Disposition |
| --- | --- | --- |
| exact domain truth | supply $P=2+Q$; demand $P=14-Q\rightarrow18-Q$; $E_0=(6,8)$; $E_1=(8,10)$ | reuse unchanged |
| misconception target | supply identity persists while demand and equilibrium change | strong semantic basis; prose must make the distinction explicit |
| deterministic motion | `establish`, `shift`, `handoff`, and `settle` stages over a reversible runtime clock | reuse; add semantic control projection later |
| stable before/after states | semantic state objects and equilibrium selectors for both endpoints | reuse for passage preparation and focus |
| graph-led explanation | approved native SVG dimensional-continuity graph with fixed supply and historical demand/equilibrium references | reuse unchanged for editorial discovery |
| exact verification | synchronized supply, demand, equilibrium equations and fixed two-decimal moving readouts | reuse; change salience timing in the lesson host, not model truth |
| parameters | bounded demand-intercept query and Parameters control | reuse after synthesis, secondary by default |
| accessibility | current synchronized nonvisual summary and semantic object identities | preserve; expand to concise checkpoint announcements later |
| fine seeking | Play and continuously reversible scrubber | reuse; Previous/Next semantic checkpoint projection is missing |
| framework boundary | animation asset, runtime frames, model, and renderer remain TypeScript contracts outside Svelte | preserve when the internal lesson host is built |

## Gaps exposed by the storyboard

These are findings, not authorization to implement them yet.

1. **Dedicated lesson surface.** The catalogue is an asset browser, not a
   continuous reader with one pinned stage beside four prose sections.
2. **Continuous-prose document projection.** The current lesson compiler
   centers an animation-story block with atomic beat captions. It does not yet
   attach sparse passage annotations to a longer argument without making those
   annotations the prose source.
3. **Semantic checkpoint controls.** Play and scrub exist; compact Previous and
   Next controls over authored semantic checkpoints do not.
4. **Passage-to-stage coordination.** No stable reading band, hysteresis,
   static state preparation, positive passage emphasis, or motion guard
   currently connects prose and the economics stage.
5. **Stage-to-prose coordination.** Semantic objects do not yet expose a
   reverse passage index or identify prose without auto-scrolling.
6. **Phone stage dock.** The accepted roughly one-third-height dock, stable
   dimensions, temporary expansion, and reading/control collision rules are
   not implemented.
7. **Editorial claim granularity.** The five runtime claim IDs cover the motion
   spine but do not separately identify curves as schedules, shift versus
   movement, old-price shortage, comparative-static scope, or fixed curve
   versus fixed quantity.
8. **Prediction and synthesis disclosure.** The current host has no non-gating
   answer/reveal projection tied to a held semantic checkpoint.
9. **Equation salience.** Equations are synchronized, but the lesson host needs
   an attention rule that keeps them quiet until exact verification.
10. **Exploration boundary.** Parameters exist, but the guided-to-exploration
    handoff and “Return to lesson example” action do not.
11. **Checkpoint accessibility.** The existing full-frame summary is useful,
    but rapid continuous updates should not become the default reading
    experience; concise state-change announcements still need definition.

The asset already contains semantic shortage and surplus sides, and the exact
model can classify the shifted market at the old price. The graph does not
currently draw a quantity-gap witness at $P=8$. That visual may be helpful, but
it is optional until prose review shows that the textual and curve evidence is
insufficient. Consumer/producer-surplus shading and deadweight loss remain
explicitly outside this lesson.

## Post-approval implementation order

If this editorial checkpoint is approved:

1. compile the accepted prose and a minimal economics-local annotation map
   without first declaring a shared passage schema;
2. build one bounded internal Svelte 5 lesson route with persistent stage,
   compact semantic controls, wide reading layout, and phone dock;
3. add the smallest semantic, keyboard, static/reduced-motion, and single-route
   checks needed for an integrated human checkpoint;
4. stop for visual and reading-cadence review;
5. after approval, pressure the boundary with generated solve-x;
6. promote only the contracts that both callers actually share, then run the
   broader responsive and browser certification.

This sequence does not authorize SvelteKit, Internal Editor, Public Web, Public
Editor, or M5 LLM editorial candidates.

## Reviewer decisions required now

1. Does the prose preserve enough context without feeling too long or
   repetitive?
2. Does the strawberry market help, or should the lesson stay abstract?
3. Is the old-price shortage paragraph necessary before motion, or does it
   answer the prediction too early?
4. Does the graph-first, equations-later sequence make the causal mechanism
   clearer?
5. Does the closing synthesis explanation repair the intended misconception?
6. Which paragraphs, if any, are expendable before implementation?

Approval of this checkpoint authorizes only the bounded integrated economics
exemplar described above. Revisions return to the Markdown draft without
creating UI churn.
