# Discourse tree and scrolltelling: next-step recommendation

Status: implementation approved by “implement”; one visual checkpoint.
Contract: `run-contract.kp.discourse-scrolltelling-v1`.
This approves the bounded comparison, not adoption of a general authoring format.

Source: [imported handoff](../inbox/Kinetic_Press_Authoring_Format_Handoff.md).
Current reference: `/experiments/dot-product-passage/`, also available through
the matrix menu. The existing native KaTeX dot presentation and matrix-product
model retain paint and mathematical authority respectively.

## Candidate comparison

| Candidate | Authoring value | Reuse | Scope/risk | Recommendation |
| --- | --- | --- | --- | --- |
| Discourse-guided scroll projection of the existing dot passage | Tests phrase/context binding directly | Existing clock, semantic references and motion | Bounded; reading rhythm still unproven | First comparison |
| Universal recursive authoring format and editor | Potentially high | Not yet demonstrated | Large scope and premature ontology | Defer |
| Finish all-cell rectangular integration | Already approved after its layout checkpoint | Existing product and dot passage | Bounded but does not test discourse structure | Preserve pending review |

## Recommended experiment

One separate, reversible projection: normal document scrolling beside a sticky
existing dot stage. Five short explanatory sections cover selecting a row and
column, pairing, multiplication, addition and the result. Keep local goal and
necessary ancestry visible. Bind each section to existing semantic references
and milestones, without adding mathematical operations or replacing the clock.

Original proposal used scroll-selected milestones with bounded playback. The
user subsequently requested reuse of the existing split-view work and approved
the recommendation below: continuous scrubbing between settled reading holds
supersedes that initial interaction choice. Preserve explicit stepping and
local scrubbing, deterministic reverse, reduced motion and direct links.

Add one optional “Why pair these entries?” detour. Its opening should not advance
the main explanation merely because disclosure changes document height. Closing
must restore the exact interrupted reading/animation position. Start with a
small typed TypeScript fixture rather than a new language, editor or generic
graph runtime. Keep concept identity separate from occurrence and scope.

## Review and preservation

Compare with the current player: can the reader explain which row/column supplies
each pair, stop at the multiplication/addition boundary, open the detour and
return without losing context? Does the author repeat less semantic information?
Nesting must clarify relationships rather than produce a staircase of fragments.

Existing models, source identities, motifs, timing, standalone player and its
typography remain the preservation boundary. A separate route and its local
projection/fixture are the rollback unit. Ordinary scrolling stays native;
avoid scroll locking or wheel interception. Narrow screens need a bounded stage
that leaves prose readable; no JavaScript still leaves a coherent explanation.

Human review of this one comparison precedes any general recursive schema,
catalogue rollout, reader model, glossary system or generated content. Existing
rectangular review remains pending; this recommendation does not supersede it.

## Implemented review candidate

Open http://localhost:8000/experiments/discourse-scrolltelling/; the matrix menu
also links to this separate page. Scroll through the five sections, scrub to an
intermediate pose, open “Why pair these entries?”, then return. Compare against
the linked original player. Judge whether the prose and calculation stay
connected, whether the pauses are useful, and whether the sticky stage leaves
enough reading space. This is HUMAN_CHECKPOINT, not visual acceptance.

The new local binding fixture retains typed scalar references from the same
product and stable reading occurrence IDs. Prose is static semantic HTML; the
fixture binds sections to existing milestones. It is not yet a recursive format
compiler or an outline editor, and authoring-efficiency gains are not established.
Source references are attached for inspection; the existing dot presentation
continues to own focus and movement. No new animation renderer or clock exists.

The player now returns callable cleanup plus a small host-control surface. Its
resize observer measures the stage, not changing caption/card height: the first
browser run exposed a caption-height change pausing playback. The scroll suite
now checks actual arrival at each endpoint and reverse/jump behavior. Repeated
same-fragment links also restore the requested milestone after manual scrubbing.
The detour freezes main-story selection and controls, and restores exact progress
and scroll position. All prose remains readable without JavaScript.

Checks: four `npm run visual:discourse-scrolltelling` tests, eleven
`npm run visual:dot-passage` tests, two `npm run visual:rectangular-product`
tests, `npm run typecheck:tests`, application TypeScript checking,
`npm run build:discourse-scrolltelling`, `npm run build:matrix-interpretations`,
and `npm run measure:semantic-cost`. Desktop/mobile captures use the scoped
browser command; broad browser certification is deferred until visual selection.
The impact selector had no focused mapping for this new experimental route and
defaulted to broad production checks; this discovery slice uses the scoped
checks above, not an asserted full-repository certification.

The initial isolated production build estimated about 90.5 KB JavaScript gzip
and 15.1 KB CSS, excluding fonts. The combined matrix build shares existing
chunks; its new scroll entry is about 1.36 KB gzip beyond shared dependencies.
Existing measured dot/rectangular closures are 93,835/94,882 B JavaScript gzip
and remain within their budgets. The new page has not received ten-instance
runtime certification. No budget ceilings changed.

## Split-view reuse revision

Approved by “implement rec” after the read-only prior-work report. The earlier
prototype remains historical evidence; its local scroll listener and triggered
autoplay have now been replaced. The same review URL uses
`KpTutorialPageScrollCoordinator`, `projectKpTutorialCorridorTravel` and
`projectKpTutorialRebasedCorridor`, already used by the economics/Lisp and
log-product projections. The mathematical model, glyph renderer and animation
timing/motifs are preserved. No second clock or general discourse schema is added.

Five measured heading landings define four reversible edges. Each edge holds its
source for 20% of document travel, scrubs the existing interval for 60%, and holds
its target for 20%. These local reading holds are provisional, not new animation
timing. Desktop uses the Glance reading-line ratio (36%); the narrow projection
keeps the reading line below the compact stage. Prose retains stable ink; the
heading underline withdraws while an edge is in motion. Manual controls rebase
into the scroll corridor using the existing handoff projection. Geometry is
invalidated after resize/disclosure; a detour freezes projection until exact return.

Verification: `npm run test:discourse-scrolltelling` passes 15 tests including
shared coordinator/rebase laws. `npm run visual:discourse-scrolltelling` passes
five tests, now proving intermediate-frame holds, reverse equality and manual
handoff as well as detour, direct-link, reduced-motion and static reading.
The standalone dot preservation suite passes eleven tests; application/test
TypeScript checks and the isolated build pass. The build now estimates 94.44 KB
JS gzip and 15.09 KB CSS (fonts separate), about 4 KB JS above the initial local
handler. No existing renderer or shared coordinator implementation was changed.

Status: HUMAN_CHECKPOINT. Inspect continuous forward/reverse scroll between the
first two headings, stop midway, then manually scrub and resume scrolling.
Judge the hold length and reading connection. Rollback is the discourse route's
adapter, pure edge projection and local style; existing split callers stay intact.

## Full-screen pairing attention card

User approved a further one-step comparison after clarifying that the equation
remains inside the stage near its left border. Open
http://localhost:8000/experiments/discourse-scrolltelling/?view=attention-card.
The existing split projection remains available without the query parameter.

One viewport-sized card pins across three viewport heights of ordinary scrolling.
The existing KaTeX stage sits inside it near the left edge. The annotation area
shows an explanation, then “Watch the column turn,” then replaces that instruction
with an interactive pairing scrubber, then shows the paired-result interpretation.
Reading, watch, motion and inspection occupy 20/10/50/20 percent of this local
scroll corridor. Only the existing first dot-product interval is sampled; no
mathematical animation or shared renderer changed. Dragging moves document scroll
to the corresponding corridor position. Reverse scroll reconstructs the same
phase and frame. Reduced motion holds the source and then shows the paired endpoint.

The full explanation remains below the bounded card, with a link back to the
original split view and its exact-return detour. Static/no-JavaScript reading
continues to use the original HTML. The attention card is a lazy-loaded local
adapter/style/model; those files and the query branch are the rollback unit.
The plain-language annotation helper owns instructional typography.

Validation: 16 focused unit tests and all six discourse browser tests pass,
including the original split-view/detour coverage, fixed equation position
during the note handoff, viewport card dimensions, scroll/slider correspondence,
reverse and narrow reduced-motion behavior. Application/test TypeScript and the
isolated production build pass. Captures are generated by the existing
`npm run visual:discourse-scrolltelling` command. The new lazy adapter is 1.88 KB
JS gzip plus 0.59 KB CSS; the isolated common entry is now 94.61 KB JS gzip,
excluding fonts. No broad renderer certification or catalogue rollout is claimed.

HUMAN_CHECKPOINT: judge the equation's distance from the border, the annotation
placement, and whether the watch instruction gives enough notice before the
scrubber takes its place. This remains one pairing-step exemplar.
