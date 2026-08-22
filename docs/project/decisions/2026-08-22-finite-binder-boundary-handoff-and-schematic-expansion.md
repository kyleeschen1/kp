# Finite-Binder Retained Equivalence and Schematic Expansion

Status: finite-sum exemplar approved and performance-qualified;
relation-clearing transit and arrival punctuation may proceed to product
pressure, while broader homomorphism promotion remains gated
Accepted: 2026-08-22
Applies to: finite sum expansion and later finite product pressure

## Decision

Finite-binder expansion must preserve the complete source as stable context.
For the reviewed fixed-range exemplar,

\[
\sum_{i=1}^{3} a_i \longrightarrow a_1+a_2+a_3,
\]

the source, a fixed equality relation, and the final target slots occupy their
settled geometry from the start. A distinct live projection of the source body
generates `a_1`, `a_2`, and `a_3` in range order. The complete source stays
visible while the right side is constructed.

The lower and upper bounds remain semantic provenance for the first and final
references, but their glyphs do not travel. Each target reference owns fresh
paint and a distinct occurrence identity. Connectors may appear only after the
left neighbor has arrived; each finishes appearing with the following term.

The earlier physical boundary-handoff candidate was rejected at human review:
moving the tiny bounds produced an irregular focal path and did not read as a
smooth expansion. The semantic lineage remains useful truth; it no longer
implies paint persistence.

## Accepted Relation And Arrival Laws

Two related laws govern the next visual revision.

### Relations are landmarks, not tunnels

When a continuant travels between opposite sides of a retained semantic
relation such as `=`, `=>`, or `<=>`, the relation remains fixed, legible, and
unoccluded. Presentation declares a protected semantic boundary. The measured
renderer selects the shallowest safe route around its actual ink. Direct
transit through the relation is forbidden unless an explicit, reviewed
instructional exception names the crossing itself as meaningful.

This is conditional on a retained relation. A replacement transition with no
visible relation does not gain decorative curvature merely because an
equivalent relation could have been shown.

### Punctuation prepares the landing

An explicit infix connector belongs perceptually to the target group on its
right. Each noninitial generated successor forms an arrival cohort from its
leading connector and following semantic group. The connector may begin
resolving only after the left neighbor is established, and it becomes fully
realized exactly when the following group settles to its right. Reverse
playback retracts the connector with that follower.

For `a_1+a_2+a_3`, the two cohorts are `+ a_2` and `+ a_3`. For a later
log-product equivalence, the follower is the complete derived application
`ln(y)`, not merely the leaf payload `y`. Implicit multiplication retains a
semantic adjacency but has no connector paint to animate.

### Binder limits are a presentation choice

Finite-binder semantics own lower and upper roles, not their visual placement.
Native KaTeX endpoints therefore expose `above-below` and `side` limit
placements. The finite-sum exemplar defaults to `above-below`, which makes the
range visually subordinate to the large operator and keeps it out of the
body's horizontal reading path. Hosts may request `side` without changing the
operation, lineage, or motion plan.

## Planned Typed Boundary

The authoring and semantic layers continue to name relations, correspondences,
target groups, and adjacency rather than paths or numeric timing. The current
finite-sum plan may prove exemplar-local forms of:

```ts
interface KpTransitBoundary {
  readonly relationOccurrenceId: string
  readonly separates: readonly [string, string]
  readonly policy: "preserve-relation-legibility"
}

interface KpTargetArrivalCohort {
  readonly followerGroupId: string
  readonly leftNeighborGroupId: string
  readonly leadingConnectorId?: string
  readonly reception:
    "connector-completes-with-follower-settlement"
}
```

These names are a recorded design direction, not yet shared API authority. The
renderer compiles measured relation ink into a protected corridor and reuses
the existing equation path planner to select `arc-above` or `arc-below`.
Established source and target ink remain collision obstacles. No authored
pixel offsets, opaque backing plates, per-caller clock, or CSS animation is
permitted.

The candidate validator must enforce:

- a mover crossing a retained relation has a certified relation-clearing
  route or an explicit reviewed exception;
- every visible noninitial connector belongs to exactly one arrival cohort;
- the left neighbor is settled before connector reception begins;
- connector completion equals follower settlement;
- relation geometry remains fixed and visible across direct seek and reverse;
- final paint is exact native KaTeX geometry.

## Promotion Order

1. Perfect only the fixed finite-sum exemplar and stop for human review.
2. If approved, apply the laws to the retained log-product equivalence frame
   as the structurally different caller.
3. Extract only the boundary and arrival contracts both callers actually use.
4. Apply the promoted seam to an exponential equivalence, distinguishing
   explicit connectors from implicit multiplication.
5. Expose semantic retention and operation intent to LLM authoring without
   exposing arc direction, geometry, or timing vocabulary.

Until steps one and two pass, the current log and exponent choreography remains
unchanged and the exact route curvature and reception response stay tunable.

## Approved Exemplar Performance Evidence

Human review accepted the finite-sum choreography on 2026-08-22. A subsequent
phone-viewport probe scrubbed 120 frames under 6x CPU throttling and established
the following repeatable hot-path properties:

- constrained frame p95 remained within the 33.4 ms gate;
- synchronous update p95 remained below 20 ms;
- native target typography is realized before playback and retained rather
  than reconstructed on every frame;
- every moving material owner uses compositor positioning in this exemplar;
- no material visual was replaced, paint alignment was not remeasured, and
  accessibility attributes changed only at the two endpoint handoffs.

Single-run maximum frames and Long Tasks remain diagnostic in this scoped dev
probe because browser scheduling under 6x throttling is noisy. The production
performance matrix continues to own KP's stricter 100 ms maximum-frame and
50 ms Long Task product targets. Continuous manual scrubbing now defers History
API writes until the range control settles; autoplay retains the coarse,
throttled URL projection.

## Schematic Variable Bounds

A later schematic capability should represent

\[
\sum_{i=1}^{n} a_i \longrightarrow a_1+a_2+\cdots+a_n
\]

with a first-class omitted-range object. The ellipsis is not punctuation or a
generic connector. It denotes the ordered portion of the bound range omitted
between the demonstrated prefix and terminal instance. It must therefore be
referenceable, expandable, inspectable, and governed by explicit assumptions
about the symbolic upper bound.

The typed vocabulary should distinguish:

- `exhaustive-expansion`: every proven range value has an instance;
- `schematic-expansion`: representative instances plus an omitted range;
- `range-value-instantiation`: a target reference derives its value from the
  verified range while receiving a fresh representation occurrence;
- `lower-bound`, `range-successor`, and `upper-bound`: provenance categories
  for those values, not prescribed motion routes;
- `omitted-range`: a possibly empty or provably nonempty ordered interval,
  with that distinction made explicit.

Authors choose exhaustive versus schematic presentation. Renderers do not
infer the choice from term count or available width.

## Choreography

For the fixed three-term exemplar:

1. Reserve the complete equation geometry and establish the source plus fixed
   equality relation.
2. Keep the source occurrence frozen and fully visible.
3. Emit distinct body instances from a live projection of `a_i`, left to right.
4. Resolve each target reference in place from verified range truth.
5. After the left term is established, resolve the following connector so it
   completes exactly as its following term settles.
6. Settle the constructed side onto exact native KaTeX target paint without
   moving the source or equality relation.

For a symbolic upper bound, the same boundary handoff surrounds an omitted
range. The ellipsis should become visible only after the prefix and terminal
instances establish what it abbreviates.

## Invariants

- Source, relation, transit, and target representations have distinct
  occurrence IDs under the shared state-retention projection.
- Range provenance does not imply material persistence.
- No source glyph may simultaneously paint multiple target occurrences.
- Symbolic bounds require a typed symbolic-range proof; the explicit-integer
  range authority must continue to reject them.
- An omitted range cannot be synthesized from layout, glyph text, or a generic
  fade fallback.
- Direct seek, reverse, reduced motion, and static endpoints remain
  deterministic under one external clock.

## Promotion Boundary

The retained-equivalence fixed-bound exemplar has passed its human visual
checkpoint and scoped performance gate. Relation-clearing arcs and
connector-led arrivals remain exemplar-local until a log-product pressure
caller passes. Symbolic-bound implementation then requires
its own semantic endpoint, assumptions, omitted-range vocabulary, and
reversible visual exemplar. Finite-product pressure remains necessary before
promoting a sum-specific presentation seam as a general binder motif.
