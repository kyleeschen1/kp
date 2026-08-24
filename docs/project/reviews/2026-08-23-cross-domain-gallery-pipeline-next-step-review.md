# Cross-Domain Gallery Pipeline Next-Step Review

Status: next-week demonstration priority accepted; infrastructure maturation
and programming light mode added; graph packet proposed
Reviewed: 2026-08-23
Active thread: `../threads/animation-catalogue.md`
Decision: `../decisions/2026-08-23-cross-domain-gallery-demonstration-priority.md`

## Finding

KP does not need a new universal content-generation system. It already has the
correct outer seam in `kp.animation-generation-request.v1`: domain, opaque
source payload, semantic intent, expected outputs, and capability pins. The
current code frontends prove that a language can retain its own parser,
legality, bindings, and evidence while using this envelope.

The next useful slice is to make that architecture visible through one curated
cross-domain gallery collection. Graph2D and Graph3D need bounded domain
frontends and real semantic exemplars; code needs a common gallery-facing
result projection rather than another code compiler. Equation work supplies
the mature reference. The collection should use the same seams intended for
later authoring and hosting, so its pinned fixtures become conformance evidence
rather than disposable demo wiring.

## Current Baseline

| Domain | Current maturity | Gallery implication |
|---|---|---|
| Equation | Several `Direct` operations and approved derivative and exponent/log exemplars | Use the approved `2^x = 7` solve as the reference path; do not reopen its choreography |
| Code | TypeScript and Python extract-helper capabilities are `Direct` | Exact canonical revisions can return existing artifacts; variants remain semantic-plan-only |
| Graph2D model | `Exemplar`; economics and physics callers exist | Useful fallback, but the domain frontend and general operation/recipe/corpus are absent |
| Graph2D function | `Missing` | One bounded translation can establish the first honest function frontend and exemplar |
| Graph3D scene | `Exemplar`; lazy WebGL host and SVG fallback exist | The current mesh-to-donut asset proves hosting, not meaningful scene generation |

The two previously found generation/explanation baseline drifts remain a short
preflight repair. They should be fixed before the collection is described as a
generation proof.

## Candidate Comparison

Scores run from 1–5; higher `Risk` is worse.

| Candidate | Authoring | Reliability / demo | Reuse | Risk | Recommendation |
|---|---:|---:|---:|---:|---|
| Four-domain vertical gallery packet | 5 | 5 | 5 | 3 | Do next |
| One new symbolic family | 4 | 4 | 4 | 2 | Retain after the demonstration |
| General Graph2D/Graph3D formula generator | 5 | 4 | 5 | 5 | Defer; too broad for the deadline |
| Arbitrary code-variant animation compiler | 5 | 4 | 5 | 5 | Defer; keep semantic-plan-only honesty |
| Catalogue or public-site redesign | 2 | 3 | 2 | 4 | Do not couple to pipeline proof |

## Proposed Content Pipeline

```text
Natural-language content brief
  -> LLM proposes:
       - learner goal and explanation depth
       - prose claims for review
       - one or more domain generation requests
  -> shared envelope validates domain, intent, outputs, and capability pins
  -> domain router selects an exact frontend
       equation -> verified LaTeX states and operation binder
       graph-2d -> typed function or model transformation
       graph-3d -> typed semantic scene transformation
       code -> compiler, AST, or interpreter trace
  -> frontend returns verified semantic plan or typed repair
  -> pedagogical score selects grouping, disclosure, and attention
  -> domain recipe selects registered motifs
  -> shared asset/vignette packaging supplies timeline, URL, Review, and access
  -> renderer adapter paints KaTeX, SVG, WebGL, or code
  -> grounded explanation and gallery/Article projection
```

The LLM may choose instructional intent and propose requests. It may not author
function truth, surface geometry, program behavior, correspondence, timing,
SVG paths, Three.js objects, or code-token trajectories.

## Shared Result Projection

Every gallery item should expose the same small result vocabulary without
forcing domain plans into one type:

- `compiled-artifact`: an exact verified request resolves to a canonical
  animation asset and vignette;
- `existing-artifact`: the request resolves to an already approved canonical
  artifact;
- `semantic-plan-only`: domain semantics are verified, but no governed visual
  artifact exists for this variant; or
- `repair-required`: the request is invalid, unsupported, ambiguous, or lacks
  required authority.

Each result should retain the request ID, domain, capability pins, frontend
authority, semantic trace reference, artifact/vignette reference when present,
explanation claim references, and diagnostics. This is a projection over
domain results, not a universal domain IR.

## Infrastructure Maturation Rule

The gallery is a thin projection over real production seams:

- checked-in requests enter `kp.animation-generation-request.v1` rather than a
  gallery-specific loader;
- each accepted result names its domain frontend, semantic trace, canonical
  artifact, host, renderer, and evidence;
- the existing player clock, direct URL, Review capture, accessibility, and
  static fallback remain the only lifecycle path; and
- a pinned request plus its expected result disposition remains as a
  cross-domain conformance fixture after the demonstration.

Do not pre-emptively extract a universal semantic model. A shared projection
is justified by all four domains; a renderer or theme seam is promoted only
after a reviewed exemplar and a structurally different caller demonstrate it.

## Proposed Gallery Packet

### Equation reference

Use the approved artifact
`animation.algebra.log-exponent.solve-two-power-x`:

\[
2^x=7
\longrightarrow \ln(2^x)=\ln 7
\longrightarrow x\ln 2=\ln 7
\longrightarrow x=\frac{\ln 7}{\ln 2}.
\]

It is a genuine solve rather than a motif sampler. It composes applying an
operation to both sides, function wrapping, exponent/log structure, a power-law
rewrite, persistent identity, isolation, and fraction construction while
ending at an exact symbolic answer. It is already the approved end-to-end
native-KaTeX pressure caller, so the gallery can demonstrate breadth without
inventing new mathematical choreography for the deadline.

A later pressure caller may use a rational coefficient or a root, but should
establish a distinct semantic need. `x^3=8 -> x=\sqrt[3]{8} -> x=2` is safe
from even-root branching but exercises fewer mature motifs. An equation such
as `\sqrt{x+1}=3` requires domain and extraneous-solution authority and should
remain a typed gap until that solve family is explicit.

### Graph2D primary

Use one exact horizontal translation:

\[
y=x^2 \longrightarrow y=(x-2)^2.
\]

The Graph2D frontend should own function normalization, the translation
parameter, curve identity, point correspondence, domain, and transformation
validity. The fixed axes remain contextual; the vertex and selected sample
points transmit attention from the changed equation parameter to the moved
curve. SVG owns paint and geometry.

This is intentionally one function family and one transformation topology. A
reflection, scale, discontinuity, arbitrary expression, or inferred algebraic
equivalence remains a typed gap.

### Graph3D primary

Use one fixed-camera parameter change over the repository's existing saddle
surface support, such as increasing the denominator in

\[
z=\frac{x^2-y^2}{a}.
\]

The surface identity and `(x,y)` parameter domain persist while the verified
parameter change updates `z`, making the saddle flatten. The camera does not
move. This distinction proves that model change, not view manipulation, owns
the lesson.

The Graph3D frontend should own the surface expression, parameter bounds,
topology invariance, sample domain, and source/target scene truth. The shared
runtime retains one clock; the WebGL adapter owns geometry and materials; the
semantic SVG endpoint remains the loading, failure, and context-loss fallback.

If this cannot reach a clean visual checkpoint within the bounded slice, keep
the existing mesh-to-donut asset as explicitly labeled host/lifecycle evidence
rather than weakening the semantic contract.

### Code reference

Route the exact approved TypeScript extract-helper request through the same
cross-domain envelope and gallery result projection. The TypeScript compiler
frontend remains the source of syntax, bindings, source ranges, and refactor
legality. The existing animation owns its timeline and paint.

Show Python as a second language only if it is a data-only addition to the
collection. Do not promise arbitrary code animation: a valid edited variant
continues to return `semantic-plan-only` until a governed artifact compiler is
separately proved.

Programming also needs an explicit light theme. Port this through semantic
paint roles, not color conversion:

1. keep source identity, syntax kinds, motion roles, focus, presence, and trace
   role unchanged;
2. inventory surface, chrome, foreground, muted, border, syntax, focus,
   transit, withdrawal, selection, and focus-ring paint roles;
3. author separate light and dark optical endpoints for those roles;
4. replace dark-specific glow, `brightness`, and `saturate` treatments with
   theme-resolved attention paint where the light surface needs an outline,
   wash, or stronger local contrast instead; and
5. resolve the theme explicitly from the host/URL so review capture and direct
   seek are deterministic. Operating-system preference may choose an initial
   default, but must not be the only authority.

The TypeScript refactor is the canonical light-theme exemplar. Stop for human
review before applying the treatment to Python. If it passes, Python is the
structurally different caller that can justify replacing the deliberately
duplicated local palettes with one shared code optical profile. Scheme and the
generic programming trace remain later pressure because their renderer and
surface contracts differ.

Palette tooling may generate initial light and dark candidates from semantic
roles and perceptual contrast constraints, but it cannot certify the port.
Both modes require optical tuning for apparent weight, role distinguishability,
context legibility, focus dominance, and accessible focus indication.

### Honest gap

Include one visible request that the system refuses—for example an arbitrary
Graph3D formula or unsupported code refactor—and show the exact missing
frontend, operation, recipe, or artifact authority. Typed refusal is part of
the demonstration, not an error to conceal.

## Gallery Presentation

Keep the existing asset-first Catalogue and player. Add a curated collection or
filter rather than a new card-grid application. Each selected artifact may
show a compact “Generated through” disclosure containing:

- the original teaching intent;
- verified-by frontend and capability;
- selected operation/profile or typed gap;
- grounded one- or two-sentence explanation; and
- copyable direct link.

The stage, scrubber, Review capture, static fallback, and renderer-specific
paint remain unchanged. The gallery should not expose implementation graphs by
default or make provenance badges compete with the artifact.

## Bounded Execution Sequence

1. Repair the two focused generation/explanation baseline drifts.
2. Define the gallery-facing result projection over the existing request
   envelope and code orchestration result.
3. Route the canonical exponent/log equation and TypeScript artifacts through
   it with no choreography change.
4. Build the TypeScript light optical endpoint and stop for human review; if
   approved, pressure it with Python before extracting the shared code-theme
   seam.
5. Build and review the single Graph2D translation exemplar.
6. Build and review the single Graph3D saddle-parameter exemplar, retaining the
   existing host proof as fallback.
7. Assemble the curated collection, one honest typed-gap example, grounded
   explanations, and stable direct links.
8. Run focused lifecycle/accessibility checks and stop for human review.

Do not build complete domain corpora, claim family promotion, generalize graph
formula parsing, or animate arbitrary code variants before the demonstration.

## Acceptance Criteria

- all four domains enter through `kp.animation-generation-request.v1`;
- every accepted case names an exact frontend and capability pin;
- every mathematical, graph, or code claim binds to domain authority;
- equation, Graph2D, Graph3D, and code retain their own renderer adapters;
- all executable artifacts use the shared host clock, direct URL, Review, and
  deterministic seek/rewind contracts;
- Graph3D retains lazy loading, the context lease limit, and meaningful SVG
  fallback;
- code compilation stays outside browser/runtime bundles;
- light and dark code modes share semantic syntax and attention roles while
  retaining separately reviewed optical endpoints;
- direct URLs and Review captures resolve an explicit code theme;
- unsupported and plan-only cases remain visually distinct from executable
  artifacts;
- no silent generic fade or fabricated animation is present; and
- the curated collection is understandable to a visitor without exposing the
  architecture inspector by default.

## Preservation And Rollback

Preserve every approved exemplar, domain frontend, semantic model, renderer,
clock, Catalogue route, dark theme, and family option. The independently
reversible units are the shared result projection, TypeScript light optical
endpoint, shared code-theme promotion, Graph2D exemplar/frontend, Graph3D
exemplar/frontend, and curated collection. A failed light-theme or Graph3D
visual checkpoint must not roll back the shared envelope or another domain's
proof.
