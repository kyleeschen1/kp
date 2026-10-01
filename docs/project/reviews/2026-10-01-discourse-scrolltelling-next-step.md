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

Default to scroll-selected milestones with bounded transitions, not continuous
pixel-to-animation scrubbing. A reader should be able to stop scrolling and
inspect a settled expression. Preserve explicit stepping and local scrubbing.
Fast jumps must resolve the latest target without queued animations; reverse,
reduced motion and direct links must reach the same semantic endpoints.

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
