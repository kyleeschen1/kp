# Linear-equation Visual Exemplar Long-loop Proposal

Date: 2026-07-19  
Status: proposed; explicit execution approval required  
Candidate target: `next-action.kp.concept-room.linear-equation-visual-exemplar-v0`  
Candidate contract: `run-contract.kp.concept-room.linear-equation-visual-exemplar-v1`

## Recommendation

Polish exactly the accepted `2x + 3 = 8` concept room into KP's first front-door
visual exemplar. Use a searchable global-scroll document with one pinned
equation-and-balance stage, four linked explanatory checkpoints, and a shared
scrubbable clock. Stop with a human review package before applying any visual,
motion, projection, or interaction decision to another concept.

This is the highest-value next loop because the architecture is now proven and
the remaining product risk is perceptual: can KP make a familiar idea feel
unusually clear, and can it make the advantages over static text and video
obvious within seconds?

| Candidate | Authoring | Reliability / demo | Reuse | Risk | Recommendation |
|---|---:|---:|---:|---:|---|
| Polish one linear-equation room | 3 | 5 | 4 | 2 | Do next |
| Start the missing-middle area model | 3 | 3 | 4 | 3 | Do after visual language is accepted |
| Connect Ask/LLM correction | 5 | 3 | 5 | 5 | Defer until the room interaction is clear |
| Roll a house theme across existing demos | 3 | 2 | 5 | 5 | Defer until exemplar review |
| Return to FTC or subject breadth | 3 | 3 | 4 | 4 | Retain as later evidence |

## Execution Ownership

This document is the sole human-readable plan. If approved, its Theseus run
contract will own exact slice order, execution state, verification evidence,
and stop status. Do not create a duplicate phase plan. Theseus currently has no
active run contract and its generic refill options predate this accepted
priority; do not select those candidates for this loop.

## Canonical Reference Cohort

The exemplar has three deliberately separate references:

1. **Content and truth:** the accepted generated-and-verified `2x + 3 = 8`
   concept trace and its four checkpoints.
2. **Symbolic motion:** the hand-tuned `x + 3 = 7` `continuity-v1`
   presentation. Persistent mathematical material moves continuously to native
   KaTeX endpoints; cancellation and derivation remain causally legible without
   generalized visual ceremony.
3. **Surface composition:** the FTC learner surface's centered warm-paper stage,
   restrained ink/accent palette, editorial hierarchy, and approximately 2:1
   visual-to-text proportions. The linear room must remove FTC's density rather
   than inherit its number of controls or concepts.

The current unstyled linear room is the regression baseline, not a visual
reference. The proposed behavior is a normal searchable document, not a modal
or scroll-jacked slideshow. On wide screens the stage may pin while checkpoint
prose passes beside it; on narrow screens the same content stacks into normal
document flow.

## Observable Acceptance Criteria

The exemplar is ready for human review only when all of the following are
observable:

1. **Instant value:** the first viewport says “See concepts move,” shows
   `2x + 3 = 8` and its balance geometry together, and exposes play, scrub, and
   checkpoint navigation without an instruction panel.
2. **One causal story:** subtraction and division occur at matching times in
   prose, symbols, and geometry. Hover, keyboard focus, or pinned selection of a
   concept highlights every corresponding representation.
3. **Native math:** equations and applicable diagram labels use KaTeX. Stable
   checkpoints contain native, untransformed KaTeX at exact layout endpoints.
4. **Continuity:** persistent `2x`, equality, `5`, `x`, and `5/2` material is
   traceable through seek and rewind. Whole-equation crossfades are forbidden.
5. **Geometric clarity:** the balance starts with two `x` units plus three unit
   weights against eight units, removes three from both sides, partitions both
   sides into two equal groups, and ends at `x = 5/2` without implying false
   physical arithmetic.
6. **Text advantages retained:** all checkpoint prose is present in document
   order, browser-findable, selectable, printable, and reachable through a
   compact table of contents. There is no internal scroll rail.
7. **Video advantages exceeded:** any moment can be scrubbed, reversed,
   focused, inspected, and linked by canonical URL. Browser history restores
   meaningful states.
8. **Quiet house style:** paper, surface, ink, muted ink, accent, relation,
   focus, and diagram roles resolve from one typed theme into DOM, KaTeX, SVG,
   and Review CSS. Content owns no raw visual values.
9. **Consistent focus:** pointer hover, keyboard focus-visible, and pinned
   semantic focus have related but distinguishable treatments across prose,
   equation tokens, controls, and SVG objects. Focus-visible contrast meets the
   applicable WCAG non-text contrast threshold.
10. **No generated-UI smell:** one primary stage, one control row, and one
    checkpoint rail are sufficient. No card stack, pill cluster, gratuitous
    gradient, decorative badge system, placeholder copy, debug metadata, or
    control without a real state change appears in the learner surface.
11. **Responsive and accessible:** the exemplar remains legible and unclipped
    at representative desktop, tablet, and phone sizes; reduced-motion mode
    preserves causal checkpoint changes without animated transit; high-contrast
    and screen-reader projections preserve the same explanation.
12. **Architecturally unchanged:** exact provider verification, semantic trace,
    state reducer, URLs, snapshots, Review fallback, route strangler, generated
    content, and the seven frozen legacy exceptions remain intact.

## Presentation And Interaction Shape

- Use global document scrolling with checkpoint anchors and a sticky stage only
  while enough viewport height exists. Never trap wheel, touch, or keyboard
  scroll.
- Use a wide-stage/narrow-copy proportion derived from FTC, with the equation
  above the balance geometry inside the same visual field.
- Keep `Equation`, `Balance`, and their existing URLs available, but make the
  coordinated view the front-door explanation rather than forcing a toggle to
  understand the correspondence.
- Use checkpoint links, a restrained play/pause control, a native range input,
  previous/next controls, and direct semantic links in prose. Touch mode should
  mean direct seeking and inspection, not a Brilliant-style quiz.
- Keep unavailable Ask behavior routable and resilient, but do not advertise a
  nonfunctional Ask control as a primary affordance.
- Expose provider verification and provenance through a quiet inspection
  disclosure and Review metadata, not a success badge or developer panel.

## Preservation Boundary

- Preserve the exact-rational protocol, independent provider, canonical seed,
  verified operations, KP anti-corruption mapper, and shared trace.
- Preserve content manifests, generated catalog discovery, canonical URL and
  snapshot schemas, reducer/effect ownership, and no-new-`main.ts`-branch rule.
- Preserve Review HTML, no-JS searchability, failure containment, accessible
  names, and current legacy/editor/FTC routes.
- Keep raw colors, fonts, shadows, focus values, and motion constants out of
  content.
- Keep the balance IR and visual theme exemplar-local. Do not promote either to
  a cross-product contract during this loop.
- Do not add a WebGL canvas. Theme roles should remain renderer-neutral enough
  for a later WebGL adapter, but this loop binds and reviews only DOM, KaTeX,
  SVG, and Review/print output.

## Independently Reversible Rollback Units

Each slice is one focused commit. Theme data and adapters, shell composition,
scroll coordination, playback controls, each symbolic operation, each balance
operation, semantic linking, and Review styling remain separately reversible.
The largest presentation rollback unit is the route-local visual-exemplar
adapter and stylesheet: removing it must restore the accepted plain room
without touching provider, content, kernel, URL, or publication contracts.

## Proposed 25-slice Loop

All slices target
`next-action.kp.concept-room.linear-equation-visual-exemplar-v0`. `Focused`
means only named checks, `standard` adds `npm run typecheck` and
`theseus workspace validate`, and `broad` adds the relevant build, browser,
runtime, accessibility, or integration gate. Every verified slice is one
commit. A stop condition fires before completion or commit.

### Phase 1 — Reference, measurement, and local style contract

| Slice | Target and intended change | Risk / verification | Expected checks | Commit boundary and stop condition |
|---|---|---|---|---|
| `s01` | **Repeatable visual baseline:** add a route-local Playwright capture/audit harness for the plain room, FTC composition reference, and canonical `continuity-v1` equation motion at named viewports and timeline points. Record differences, not golden pixels. | Low / focused plus manual inspection | Capture harness; stable route/timeline selectors; `git diff --check`. | Commit harness and audit only. Stop if the motion reference cannot be launched or sampled deterministically. |
| `s02` | **Inference-first exemplar theme:** define one versioned typed house-style value object for paper, surface, ink, muted ink, accent, relation, focus, typography, spacing, shape, and bounded motion channels. Keep it local to the concept-room boundary. | Medium / standard | Positive/negative type fixtures; deep-freeze and no-raw-content-style tests; typecheck; Theseus validate. | Commit theme schema and one locked value set. Stop if theme values enter content or a repository-wide migration is required. |
| `s03` | **Theme adapters:** emit stable CSS variables and role bindings for DOM, KaTeX, SVG, Review, print, reduced motion, and forced colors from `s02`; preserve structural theme compatibility. | Medium / standard | Adapter parity tests; KaTeX font inheritance/readiness check; SVG/Review role fixtures; typecheck; Theseus validate. | Commit adapters without changing learner composition. Stop on renderer-owned duplicate colors or font metrics that cannot settle deterministically. |
| `s04` | **Focus and correspondence contract:** define ephemeral hover, native keyboard focus-visible, and durable pinned semantic focus behavior over existing semantic IDs; add a pure correspondence index for prose, equation, and balance targets. | High / standard | Focus-state and correspondence unit tests; URL focus round trip; no hover/layout fields in durable state; typecheck; Theseus validate. | Commit contract only. Stop if DOM identity or glyph matching becomes semantic authority. |

### Phase 2 — Frictionless searchable room shell

| Slice | Target and intended change | Risk / verification | Expected checks | Commit boundary and stop condition |
|---|---|---|---|---|
| `s05` | **Route-local visual composition:** introduce the single centered paper surface, restrained header, approximately 2:1 stage/copy grid, equation-over-balance visual field, and one control row using theme roles. | High / broad plus manual runtime check | Desktop structural screenshot; semantic landmark test; existing room smoke; build; Theseus validate. | Commit shell composition. Stop if legacy global CSS or another route changes. |
| `s06` | **Searchable checkpoint rail:** render all four checkpoint sections and compact TOC as normal anchored document content with semantic inline links and explicit current-step treatment. | Medium / broad | Browser Find for all prose; anchor and canonical-link tests; no internal-scroll assertion; print structure; build; Theseus validate. | Commit document/TOC layer. Stop if inactive checkpoint prose must be removed from the DOM. |
| `s07` | **Global-scroll checkpoint coordinator:** map section entry to shared time/checkpoint with hysteresis, URL replace for passive scrolling, URL push for explicit navigation, cleanup, and reduced-motion jumps. | High / broad | Intersection-observer fixtures; scroll/click/history browser tests; disposal; direct URL restore; build; Theseus validate. | Commit coordinator. Stop on scroll trapping, history flooding, or a second semantic clock. |
| `s08` | **Minimal playback controls:** add play/pause, replay, previous/next, and a native scrubber over the room clock with keyboard names and stable URLs; omit nonfunctional Ask from primary chrome. | High / broad | Playback/seek/rewind tests; keyboard and accessible-name checks; route sync; existing smoke; build; Theseus validate. | Commit controls. Stop if controls fork state, hide searchable text, or require autoplay. |
| `s09` | **Responsive and printable shell:** stack the same document and stage at tablet/phone widths, disable sticky positioning when unsafe, and keep Review/print in document order. | Medium / broad plus manual runtime check | 1440x1000, 768x1024, and 390x844 captures; overflow/clipping assertions; print fixture; build; Theseus validate. | Commit responsive rules. Stop if mobile requires a separate content tree or inaccessible carousel. |

### Phase 3 — Traditional symbolic manipulation exemplar

| Slice | Target and intended change | Risk / verification | Expected checks | Commit boundary and stop condition |
|---|---|---|---|---|
| `s10` | **Transition-capable symbolic IR:** extend the pure exemplar projection with operation applications, continuant/lineage refs, phase progress, source/target layouts, and native checkpoint equations derived only from the verified trace. | High / standard | Pure start/mid/end fixtures; persistent-ID laws; exact math and trace-ownership tests; typecheck; Theseus validate. | Commit IR only. Stop if the projection invents algebra, time, or unverified intermediate truth. |
| `s11` | **Measured KaTeX motion stage:** add route-local source/target measurement, font-readiness gating, overlay ownership, resize invalidation, and native endpoint settlement without changing existing generic renderer policy. | High / broad | KaTeX readiness/measurement browser checks; resize and zero-geometry recovery; no endpoint transforms; build; Theseus validate. | Commit stage mechanics. Stop if motion depends on timers instead of sampled progress or leaks observers after disposal. |
| `s12` | **Subtract-both-sides choreography:** render `2x + 3 = 8 → 2x + 3 - 3 = 8 - 3 → 2x = 5` using paired operation introduction, continuous persistent material, meet-and-collapse cancellation, and causal `8 - 3 → 5` derivation. | High / broad plus manual motion check | Named timeline captures; token continuity and phase-order tests; seek/rewind; reduced motion; build; Theseus validate. | Commit subtraction recipe. Stop on whole-equation crossfade, false identity, teleportation, or unresolved clipping. |
| `s13` | **Divide-both-sides choreography:** render `2x = 5 → (2x)/2 = 5/2 → x = 5/2` with matched fraction structures, legible cancellation, exact fractional result, and native KaTeX settlement. | High / broad plus manual motion check | Fraction geometry and lineage tests; named timeline captures; seek/rewind; font readiness; build; Theseus validate. | Commit division recipe. Stop if `5/2` is decimalized, fraction bars detach, or cancellation obscures equality. |
| `s14` | **Symbolic conformance gate:** enforce phase order, identity continuity, bounded opacity, exact endpoints, deterministic forward/rewind sampling, reduced-motion checkpoints, and resize stability for the whole exemplar. | High / broad | Dedicated browser conformance cohort; existing KaTeX regression cohort; animation performance budget; build; Theseus validate. | Commit conformance tests and repairs only. Stop if passing requires changing the accepted generic continuity reference. |

### Phase 4 — Exact balance geometry and synchronization

| Slice | Target and intended change | Risk / verification | Expected checks | Commit boundary and stop condition |
|---|---|---|---|---|
| `s15` | **Exemplar-local geometric IR:** extend the balance projection with two `x` units, integer unit weights, matched removals, exact partition groups, operation paths, and symbolic correspondences for this canonical trace only. | High / standard | Exact-count, equality, grouping, correspondence, and start/mid/end fixtures; typecheck; Theseus validate. | Commit IR. Stop if it pretends to model arbitrary negative/fractional physical weights or is promoted as a universal balance contract. |
| `s16` | **Polished static balance stage:** render quiet SVG pans, variable blocks, unit weights, grouping guides, and KaTeX labels from theme roles with correct accessible grouping and no WebGL canvas. | High / broad plus manual visual check | Static SVG/KaTeX captures; DOM/SVG theme parity; accessible-name tree; responsive bounds; build; Theseus validate. | Commit static renderer. Stop on raw colors, text labels that should be KaTeX, or decoration that competes with the equation. |
| `s17` | **Synchronized subtraction geometry:** remove three unit weights from each side in the same causal phases as symbolic `-3`, preserving balance and cross-view focus throughout seek and rewind. | High / broad plus manual motion check | Cross-projection time/ID parity; paired-removal invariants; named captures; rewind/reduced motion; build; Theseus validate. | Commit subtraction motion. Stop if either side leads semantically, balance tilts falsely, or focus correspondence breaks. |
| `s18` | **Synchronized division geometry:** partition two `x` units and five remaining units into two equal groups, then select one group as `x = 5/2` in time with the symbolic fraction transition. | High / broad plus manual motion check | Exact partition and remainder representation tests; cross-view phase parity; named captures; rewind; build; Theseus validate. | Commit division motion. Stop if the geometry implies rounding, drops a half unit, or visually claims unsupported physical cutting. |
| `s19` | **Coordinated primary stage:** compose equation and balance in one visual field under one clock while retaining direct symbolic-only and balance-only projection URLs and disposal behavior. | High / broad | Composite/single projection route tests; one-clock assertion; mount/switch/dispose smoke; responsive captures; build; Theseus validate. | Commit composite adapter. Stop if projections own separate timing or current URLs become invalid. |

### Phase 5 — Linked explanation, review resilience, and human checkpoint

| Slice | Target and intended change | Risk / verification | Expected checks | Commit boundary and stop condition |
|---|---|---|---|---|
| `s20` | **Cross-representation semantic links:** make approved prose phrases, equation tokens, and SVG objects mutually highlightable by hover/focus and pinnable by click/keyboard using `s04`; ensure links have useful tooltips or inline definitions. | High / broad plus manual interaction check | Pointer/keyboard/pinned-focus browser tests; URL restoration; focus contrast; no hover persistence; build; Theseus validate. | Commit linking controller. Stop if touch users lose equivalent inspection or highlights rely on layout/glyph similarity. |
| `s21` | **Frictionless Watch/Touch/Review modes:** make Watch play the causal sequence, Touch expose scrub/focus/section navigation, and Review return searchable static explanation without becoming a quiz or separate lesson fork. | High / broad | Mode URL/history tests; same-trace assertions; keyboard/touch smoke; no-JS Review regression; build; Theseus validate. | Commit mode presentation. Stop if a mode duplicates content, hides canonical state, or introduces quiz correctness UI. |
| `s22` | **Share and verification inspection:** add understated copy-link actions at meaningful states and a quiet disclosure of exact provider verification/provenance that resolves from existing inspection data. | Medium / broad | Clipboard adapter fixture; copied URL direct-mount tests; provider/provenance content test; failure fallback; build; Theseus validate. | Commit share/inspection affordances. Stop if secrets, raw diagnostics, success badges, or provider implementation details enter the learner view. |
| `s23` | **Accessibility and failure matrix:** reconcile tab order, screen-reader narration, forced colors, reduced motion, focus-visible treatment, provider/renderer failure, and searchable fallback across the polished shell. | High / broad | Accessibility assertions; reduced/forced-color captures; failure matrix; browser Find; existing smoke; build; Theseus validate. | Commit accessibility/resilience repairs. Stop on blank content, inaccessible motion-only meaning, or degraded direct URLs. |
| `s24` | **Anti-template and performance audit:** remove redundant chrome and generic generated-UI smells, enforce one-stage/one-control-row/one-rail limits, and verify layout stability, animation frame budget, and absence of a WebGL context. | Medium / broad plus manual audit | DOM-shape assertions; visual diff review; animation performance check; CLS/overflow checks; WebGL-context count; build; Theseus validate. | Commit audit-driven reductions only. Stop if the remedy changes semantics or broadens into global redesign. |
| `s25` | **Full gate and mandatory exemplar review package:** run the complete project gate, capture named desktop/mobile/reduced/forced-color states and subtraction/division timelines, record durable evidence and residual risks, and mark the contract waiting for human visual review. | High / broad plus mandatory human review | `npm test`; `npm run build`; `npm run smoke:linear-equation`; focused visual/browser cohort; performance check; architecture/catalog/inference gates; `theseus workspace validate`; manual route and Review inspection. | Commit closeout evidence only after automated gates pass, then always stop. Do not generalize, promote, or begin another concept without explicit visual acceptance. |

## Mandatory Review And Promotion Criteria

The exemplar checkpoint is `s25`. The user should review at least the initial,
subtraction transit, subtraction settlement, division transit, and final states
on desktop and phone, plus reduced motion. Review should answer:

- Is the causal relation between algebra and geometry understandable without
  reading instructions?
- Does symbol motion feel inevitable and calm rather than decorative?
- Is the page more searchable and reviewable than video while still making the
  concept visibly move?
- Do focus, hover, links, controls, typography, and color feel like one product?
- Is any element recognizably generic generated-interface filler?

No slice in this contract generalizes the exemplar. Promotion requires a
separate approved contract after human acceptance. The exemplar becomes a
candidate house-style and motion reference only if the review accepts its
clarity, continuity, interaction discoverability, accessibility projections,
and absence of template smell.

## Explicit Deferrals

- Missing-middle, FTC changes, economics, programming, BFS, physics, and other
  concepts.
- Ask/LLM execution, correction choreography, and free-language routing.
- Remote snapshot storage or collaborative retrieval.
- Arbitrary generated linear-equation presentation or a user-step-entry quiz.
- Global theme rollout, balance-capability promotion, generic concept registry,
  and provider-input ownership changes.
- WebGL rendering or a live WebGL theme adapter.
- Modal/popout slideshow behavior, scroll-jacking, internal scroll rails, and
  course/lesson mechanics.
- Full client-side reconstruction of server Review KaTeX/SVG during failures.

## Approval Gate

No visual implementation is authorized by this proposal. Explicit `approve`,
`go`, `execute`, `run it`, or equivalent approval is required. After approval,
create the exact typed Theseus run contract, validate it, and execute one
verified commit per slice until a stop condition or the mandatory `s25` human
review checkpoint fires.

