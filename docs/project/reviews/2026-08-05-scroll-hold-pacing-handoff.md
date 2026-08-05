# Scroll Hold Pacing Handoff

Date: 2026-08-05
Status: accepted interaction intent; implementation handoff; candidate tuning
values remain subject to one economics visual checkpoint

## One-Sentence Handoff

Make important scrollytelling states harder to blow past by mapping a bounded
interval of physical scroll travel to one unchanged semantic animation frame,
while preserving native page scrolling, direct position authority, exact
rewind, and deterministic settlement.

## Execution Boundary

This is a successor handoff, not an expansion of the active essay motion-bridge
and semantic-transit run. That run currently owns the relevant economics host,
motion-bridge projection, geometry, tests, and visual checkpoint. Do not edit
those files in parallel merely to apply the values below.

Begin this experiment only after the active run reaches its motion-bridge human
checkpoint or otherwise releases the files. Re-read the resulting bridge
contract before implementation. Reuse its final `short`, `standard`, and
`extended` physical-distance authority instead of adding a duplicate
motion-end token when that authority remains suitable.

Canonical rollback reference: the accepted economics two-column route at
commit `aa943107`, as identified by
`2026-08-05-essay-motion-bridge-semantic-transit-long-loop-proposal.md`.

Canonical discovery caller: the opt-in economics demand-shift motion bridge.
The first and only scroll-hold exemplar should be the stable equilibrium
handoff at semantic progress `0.72`. Do not apply the treatment to the supply
movement, another lesson, or ordinary paragraphs before human review.

## Problem

The current two-column mapping gives a learner too little physical distance to
inspect an important intermediate state. Its motion begins at `62vh` and ends
at the `35vh` prose focus line, so the entire transformation consumes only
`27vh` of scroll travel.

The demand-shift corridor already contains a semantic hold:

```text
authored travel 0.57 -> progress 0.72
authored travel 0.69 -> progress 0.72
```

The two-column projector removes the outer entry and terminal holds and
normalizes the active authored interval `0.14–0.94` to physical travel `0–1`.
The existing handoff therefore occupies:

```text
hold start = (0.57 - 0.14) / (0.94 - 0.14) = 0.5375
hold end   = (0.69 - 0.14) / (0.94 - 0.14) = 0.6875
hold width = 0.15 of the physical corridor

physical hold = 0.15 * 27vh = 4.05vh
```

At an `800px` viewport height, `4.05vh` is about `32px`. A routine trackpad or
touch gesture can cross it before the intermediate frame is perceptible.

## What A Scroll Hold Is

A scroll hold is a flat segment in the pure mapping from normalized geometric
travel to normalized semantic animation progress:

```text
semantic
progress

1.00 |                         /
     |                        /
0.72 |             ----------
     |            /
0.00 |-----------
     +----------------------------> physical bridge travel
```

The bridge first derives physical travel from scroll position:

```text
travel = clamp((start - anchorTop) / (start - end))
```

It then samples semantic progress from a piecewise mapping. Between two
consecutive points with the same semantic progress, interpolation returns that
same value for every physical position:

```text
[travelA, 0.72]
[travelB, 0.72]
```

While the learner scrolls from `travelA` through `travelB`:

- the document continues moving normally;
- prose and bridge punctuation may continue their geometry-derived passage;
- the graph remains at the exact `0.72` semantic frame;
- stopping leaves the graph at that frame; and
- reverse scroll traverses the identical plateau without reconstructing event
  history.

This is a distance hold, not a time hold. A slow learner may remain there for
seconds; a fast learner may cross it quickly. It increases the deliberate hand
movement needed to leave a meaningful state without claiming that every user
must watch it for a minimum duration.

## Accepted Interaction Constraints

Preserve the existing authority model:

- physical scroll position remains the only automatic progress authority;
- use no document-level or local CSS Scroll Snap;
- do not cancel or rescale wheel, touch, keyboard, or scrollbar input;
- add no timeout, spring, delayed smoothing clock, or post-scroll playback;
- keep direct URL, TOC, history, manual takeover, and reverse settlement
  deterministic;
- keep reduced motion in ordinary readable flow with manual semantic access;
- keep IntersectionObserver limited to coarse activation rather than progress;
  and
- do not infer a shared scroll-hold authoring type from one economics caller.

The internal `snapTolerance` projection is not the desired mechanism. It pulls
nearby travel samples directly onto keyframes and may introduce visible entry
or exit discontinuities. A keyframe plateau is continuous at both boundaries
and expresses the semantic reason for the dwell directly.

## Candidate Exemplar Tuning

Prefer the active motion bridge's `standard` distance, currently specified as
an exact `50%` of the usable viewport, rather than recreating the earlier
`62vh -> 12vh` suggestion as separate layout authority.

For the demand-shift handoff, retain arrival at authored travel `0.57` and
trial a later departure at `0.77`:

```text
[0.57, 0.72]  arrive at equilibrium handoff
[0.77, 0.72]  leave equilibrium handoff after the hold
```

Within the active authored interval `0.14–0.94`, that becomes a normalized
plateau from `0.5375` through `0.7875`, or `0.25` of the bridge. In a standard
`50%` usable-viewport bridge:

```text
physical hold = 0.25 * 50vh = 12.5vh
```

That is about `100px` in an `800px` viewport, versus roughly `32px` in the
accepted two-column baseline.

Use these as comparison candidates rather than silently accepting one number:

| Candidate | Bridge span | Plateau share | Physical hold |
| --- | ---: | ---: | ---: |
| Accepted two-column baseline | `27vh` | `0.15` | `4.05vh` |
| Preserve current plateau | `50vh` | `0.15` | `7.5vh` |
| Medium hold | `50vh` | `0.20` | `10vh` |
| Recommended first exemplar | `50vh` | `0.25` | `12.5vh` |

The paragraph-gap tuner remains a separate cadence instrument. Increasing the
gap can add inter-beat reading room, but it does not by itself enlarge the
intra-animation plateau and must not become scroll-hold authority. Ordinary
essay paragraphs should retain the active motion-bridge experiment's natural
spacing.

## Implementation Shape

After the current motion-bridge checkpoint releases its files:

1. Freeze the accepted bridge capture and confirm its final physical-distance
   presets and semantic progress seam.
2. Keep geometric bridge travel linear and normalized from `0` through `1`.
   Apply the hold only when projecting that travel into demand-shift semantic
   progress.
3. Express the plateau economics-locally using the existing strictly ordered
   travel/progress representation if it still fits the completed bridge. Do
   not create a generic hold API during the exemplar.
4. Ensure manual takeover at progress `0.72` resolves to the closest physical
   position inside the plateau so returning to scroll cannot jump to a distant
   edge.
5. If the bridge renders a progress fill, derive that fill from semantic
   progress so it holds with the graph. The physical rail itself may continue
   to mark the full scroll corridor.
6. Capture the demand-shift exemplar forward, stopped inside the hold, leaving
   the hold, and in reverse. Stop for human review before changing the supply
   movement or another caller.

Re-resolve exact source seams after the active run. The current likely seams
are:

- `src/tutorial/kp-tutorial-motion-bridge-projection.ts` for pure geometric
  bridge travel;
- `src/tutorial/kp-tutorial-motion.ts` for the existing piecewise corridor
  sampler and manual-progress resolution;
- `src/tutorial/economics-demand-shift/economics-demand-shift-motion-blocks.ts`
  for the economics-local `0.72` semantic checkpoint and plateau;
- `src/tutorial/economics-demand-shift/economics-demand-shift-layout.ts` for
  current two-column normalization evidence; and
- `src/tutorial/economics-demand-shift/KpEconomicsDemandShiftTutorial.svelte`
  for host projection only, not semantic or clock ownership.

## Observable Acceptance Criteria

- The graph reaches the identical semantic frame at progress `0.72`; economic
  truth, graph geometry, and renderer output do not change.
- A standard bridge requires approximately `10–12.5%` of usable-viewport scroll
  travel to leave the candidate handoff state.
- Progress is continuous at both plateau boundaries with no snap, jump,
  overshoot, or post-scroll motion.
- Forward and reverse samples at the same scroll position are identical.
- Direct URL, TOC, history, reload, and manual settlement reconstruct the same
  semantic state without replaying the plateau.
- Prose clears before essential graph motion and does not reappear merely to
  justify added scroll distance.
- A large fling may still cross the hold; native scrolling is never captured
  to guarantee viewing time.
- Phone, large text, short viewport, and reduced-motion projections remain
  readable and do not inherit a compromised sticky simulation.
- The accepted route remains unchanged and available as the rollback
  reference.

Focused durable verification should include:

```text
npm run test:economics-demand-shift-tutorial
npm run test:tutorial-motion-page-scale
npm run visual:economics-motion-bridge
npm run typecheck
```

During visual discovery, the first two focused suites plus the single exemplar
capture are sufficient. Run the broad responsive and cross-browser release
matrix only after the human checkpoint approves the treatment.

## Preservation And Promotion Boundary

Do not change economics semantics, authored checkpoints, graph frames, renderer
ownership, prose source, URL meaning, TOC behavior, theme identity, Review
capture, or the accepted route. Do not turn all stable checkpoints into holds:
the dwell must correspond to an inspection-worthy semantic state.

The smallest rollback unit is the economics-local piecewise mapping and its
focused tests on the opt-in demand-shift bridge. Removing it must restore the
completed linear bridge without removing the bridge primitive, semantic
transit work, or accepted two-column route.

Human approval of the demand-shift exemplar may authorize tuning the second
economics motion block. A shared authoring contract still requires a
structurally different caller demonstrating the same need.

## References

- `docs/project/reviews/2026-08-05-essay-motion-bridge-semantic-transit-long-loop-proposal.md`
- `docs/project/decisions/2026-08-04-kp-depth-handoff-punctuation-and-motion-gate.md`
- `docs/project/decisions/2026-08-04-kp-essay-embedded-two-column-motion-passage.md`
- `docs/project/principles/inline-sticky-lesson-layout.md`
- `src/tutorial/kp-tutorial-motion.ts`
- `src/tutorial/economics-demand-shift/economics-demand-shift-motion-blocks.ts`
- `src/tutorial/economics-demand-shift/economics-demand-shift-layout.ts`
