# First mechanics micro-intuition: changing the origin

Status: SUPERSEDED before implementation by the accepted motion-description delivery.
Current plan: `2026-09-12-mechanics-motion-delivery-proposal.md`. Origin change is
a supporting beat, not the opening lesson's central motivation.
Mode: interactive KP delivery loop.
Authority: the accepted mechanics learning map and completed architecture readiness
pass. This proposal is a new scope, not continuation of the resolved readiness run.

## Outcome and why now

Primary question: **If we change where zero is, did the object move?**

Deliver one small M00–M01 investigation for a reader with strong single-variable
calculus but no assumed remembered mechanics. Introduce modelling only as needed
to distinguish a real object, its represented position, and its coordinate label.
The reader should be able to explain why coordinates depend on the chosen origin,
while displacement between the same two positions does not, provided the unit
and axis orientation remain fixed.

This is the highest-value next package because it delivers actual learning,
exercises the repaired shared boundaries, and begins independently reusable
mathematics. Do not make a miniature survey course or require the whole M00 map.

Ranked alternatives:

1. This origin/displacement unit: high direct learner value, clear visual job,
   modest mathematics, bounded but real new-domain integration cost.
2. Encode additional authoring best practices: useful, but pressure the existing
   explanation-first worksheet with this real lesson before creating more policy.
3. Retained-geometry 3D camera repair: measured need for low-power camera motion,
   but not a prerequisite for this 2D unit; higher implementation risk.
4. Broad test/CSS cleanup: no newly demonstrated blocker justifies postponing
   content again. Retain impact-aware checks and the existing release gates.

## Explanation and attention acceptance

Discover a coherent explanation before fixing its beat count. The intended
reasoning includes motivation for measuring position, a reference mark and length
unit, two unchanged physical positions, and the difference between changing a
description and changing the world. The visual's job is to keep those positions
identifiable while the reference and coordinate labels change.

Prepare the viewing question with stationary text; let the representation own
attention during motion; hold the result before explaining its consequence.
Do not change essential prose while asking the reader to track moving evidence.
Use the existing canonical top narrative and typography policies. Numerical
examples precede or accompany notation; formal cancellation may remain static
KaTeX unless an exact existing governed operation supports its animation.

Required mathematical acceptance: for a fixed signed axis and unit, changing
origin by a has x' = x - a and preserves (x2 - a) - (x1 - a) = x2 - x1.
Physical positions and identities remain fixed during the change of description.
Actual motion is a separate operation. Do not imply that axis reversal, changes
of units, or time-dependent reference frames are covered by this simple rule.

Human acceptance cannot be automated: does the apparent motion communicate a
change of reference rather than movement of the object, and does the explanation
make the invariant feel warranted? Include one fresh prediction with expected
reasoning, not an exam or a claim of demonstrated long-term retention.

## Canonical ownership and current capability gap

Proposed new artifact: a bounded origin/displacement mathematical source and
checked result, with separate mechanics explanation bindings. Proposed shared-
server host: `/experiments/mechanics-origin/` on port 8000. This URL is NOT yet
implemented or ready for review. Do not alter the existing tax or gradient route.

Existing host/scaffold authority: `src/tutorial/focus-deck-scaffold.ts`, its
shared CSS, `src/rendering/focus-card-runtime.css`, and document typography.
Existing control/time authority: focus-deck checkpoint playback, native input,
keyboard binding, and `src/reader/runtime/timeline-playback-clock.ts`.
The accepted gradient host is a composition/attention reference, not a template
to copy wholesale and not permission to import its 3D capability.

Semantic authority: checked coordinate/displacement facts at the mathematical
owner, immutable semantic issuance, stable entity identities, and validated
transformation/correspondence boundaries. Mechanics prose supplies motivation
and modelling assumptions, not independent computed truth.

Renderer: a bounded native 2D/SVG adapter using existing graph projection and
Graph2D lifecycle seams where their contracts match, plus native KaTeX for static
notation. `graph-2d-scene.ts` currently exposes axes/curves and is not itself a
certified origin/point-motion renderer. `author:check -- --list` has no origin
task. Consequently this proposal explicitly includes a small new domain-owned
capability, NOT a claim of existing source-only animation support. Confirm exact
governed construction/registration and motif ownership in P1 before visual code.

New animation must follow the existing governed construction and registered
representation path; shared scaffold alone does not establish pipeline parity.
Do not impersonate supply-tax or quadratic translation semantics. If the needed
capability requires a universal compiler/renderer, unsupported motif, or competing
timeline, return a typed repair gap and stop with a bounded recommendation.

## Packages and gates

P1 — Explanation and exact capability binding (standard; medium uncertainty).
Beneficiary: reader and author. Draft the explanation using the existing worksheet,
identify its inferential bridges and likely wrong inference, and bind each intended
visual job to actual owners. Define the bounded source/checker and supported versus
rejected cases; test origin invariance and physical/reference separation at the
appropriate mathematical boundary. Read the exact renderer/governance contracts
before lowering anything. Cap this investigation at 45 minutes: unresolved major
authority gaps produce a diagnosis, not an architecture expansion. No separate
routine prose approval; bring meaning and rendering together at the P2 checkpoint
unless a substantive prerequisite question requires the learner's input.

P2 — One canonical learner exemplar (standard discovery; medium/high visual risk).
Depends on P1. Implement the bounded domain capability and smallest visible unit
through those owners, shared styles and controls. Preserve a meaningful static
initial state, readable endpoints, continuous control, keyboard/button animation,
reverse, interruption, reduced motion and disposal. Use only focused semantic,
ownership and single-exemplar browser checks during discovery. No large matrix
or shared-motif promotion before human review.

**Required human checkpoint after P2:** provide a confirmed working shared-server
URL, exact changes, established programmatic facts, and two judgments: whether
reference-change versus object-motion is unmistakable, and whether attention/text
order makes the explanation easy to follow. Stop here until visual acceptance.
Revise this exemplar if needed, without restarting unrelated infrastructure work.

P3 — Independent mathematics reuse (standard; medium integration risk).
Depends on P2 acceptance. Expose the same checked mathematics as a standalone
signed-change/reference-choice reading, with a three-observation out-and-back
case rather than only different labels/numbers for the first example. This tests
the distinction between net displacement and accumulated distance and pressures
sequence structure without adding forces, calculus or a general trajectory engine.
Keep physical interpretation outside the reusable mathematical source. Both
callers must share verified calculation and presentation ownership; no duplicated
card styles or copied animation implementation. Report precisely which variants
are source-only and which required engine intervention. No claim of universal
mechanics or graph authoring. A new visual treatment requires another checkpoint;
unchanged approved treatment does not.

P4 — Integration, repairability and handoff (broad; medium release risk).
Depends on P3. Provide independent reading access and unambiguous return context
through existing supported projection/location seams. Prove a changed valid source
updates both presentations and an invalid one preserves last-valid truth. Exercise
shared style ownership. Use the existing immutable writer and transitive dependency
collector for a bounded static reading edition; old edition bytes stay unchanged.
This does not promise interactive exported animation or arbitrary source hosting.
Record learner findings and one accepted/rejected authoring example in the existing
authoring guidance, not a new rubric engine or certification framework.

## Verification, commits, cost and limits

Inspect `verify:impact` selection before execution. Focused tests cover checked
arithmetic, identities and correspondence, invalid data, direct/reverse seek,
control ownership, last-valid Apply, and revision/edition behavior. Prefer narrow
types and constrained APIs; retain runtime checks at external/event boundaries.

At P4 run affected integration, full types, production build, applicable closure/
budget/leakage checks, and representative Chromium/Firefox/WebKit controls and
responsive/reduced-motion checks. Run the existing full unit suite once at release,
not once per package. Any required failed gate must be repaired and rerun; budget
amendments need attribution, not automatic refreshing. No physical-phone or real
Safari-history-gesture certification from desktop automation.

One verified reversible commit per package, or a small documented subdivision
where needed; evidence and implementation together. The rollback boundary is the
new unit/capability commit group. Preserve old artifacts, native renderers, card
styles, clocks, and accepted motion. No merge/push is authorized. Inspect branch
hygiene before starting; this proposal does not create a new branch.

Expected effort: several hours, uncertain. Proposed ceiling: six hours active work
across the run, excluding user wait, with the final 60 minutes reserved for
verification and closeout. Stop taking implementation work when that reserve is
reached. No token budget, agents, paid/external calls or overnight portfolio.
No minimum task count and no optional filler work.

Allowed: the one bounded source/checker/operation/adapter and necessary routing,
shared-owner integration repairs, independent caller, static edition and focused
authoring evidence. Excluded: new universal schemas/renderers, broad migrations,
3D optimization, forces/energy curriculum, whole-course scaffolding, automatic
assessment/SRS platforms, catalogue-wide motif promotion, or unrelated cleanup.

Done means P1–P4 delivered, P2 accepted, required checks passed, and a clear report
of source-only reuse versus engine work and remaining learning uncertainty. Then
stop even if capacity remains. Scope expansion, exhausted resource ceiling,
unresolved authority/correctness failure after bounded repair, or new subjective
judgment triggers the corresponding explicit stop/human checkpoint, not a false
completion. No automatic successor lesson.

## Approval and resumption

Await approval of this four-package scope. Only then create the concrete Theseus
target and contract through supported CLI, linked to this proposal. Theseus owns
live order, receipts, verification and status; this document owns rationale and
scope. No new control record or implementation is authorized by the bare skill
invocation. The existing generic delivery context still mentions historical
algebra; the roadmap and this reviewed scope must govern the new target instead.
