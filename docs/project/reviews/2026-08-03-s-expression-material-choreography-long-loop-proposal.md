# S-expression material choreography long-loop proposal

Date: 2026-08-03
Status: approved; execution active
Mode: Theseus long loop
Canonical route: `/tutorials/programming/lisp-function-application/`
Target: `next-action.kp.s-expression-material-choreography-v0`
Contract: `run-contract.kp.s-expression-material-choreography-v1`
Expected duration: 10-16 focused implementation hours, followed by a required
human visual checkpoint

## Why this loop is current

The botanical Lisp treatment proved that KP's shared lesson shell can host a
structurally different domain, but it separates the animation from the code the
learner must understand. The approved replacement treats the visible
S-expression itself as semantic material: atoms jostle within real
parentheses, nested forms fold from leaves toward their semantic roots,
arguments bind through arched transfers, and evaluation gathers inputs into an
operator before a result emerges.

This is larger than a short iteration. It crosses the certified Lisp semantic
asset, recursive choreography, responsive DOM/SVG rendering, lesson sequencing,
deep-link compatibility, review capture, progressive enhancement, accessibility,
and visual/performance certification. The work remains exemplar-first: perfect
one lambda application and stop for human review before using a repeated
variable as the second caller or deleting the botanical rollback.

## Canonical reference and learner contract

The canonical expression is:

```lisp
((lambda (x) (+ x 1)) 4)
```

The canonical semantic result remains:

```lisp
((lambda (x) (+ x 1)) 4) -> (+ 4 1) -> 5
```

The lesson is split into three independently controlled motion blocks:

1. **See the structure:** activate, recursively fold, and reverse-expand the
   S-expression tree.
2. **Apply the lambda:** open the lambda, box binding sites, transfer the
   argument into the parameter, propagate it into the body, and reconstruct
   `(+ 4 1)`.
3. **Evaluate the result:** distinguish a structural `+` bead from actual
   reduction, then gather the inputs and emit `5` from the operator root.

Every meaningful depth frontier is a scrubber checkpoint with a reconstructible
URL. Canonical holds show ordinary valid Lisp. Intermediate inspection holds may
show spatial code and expression beads, but retain an accessible native-code
equivalent.

## Approved visual and semantic grammar

- The visible material is real, selectable semantic HTML code. SVG is limited
  to transient paths or guides; canvas and live physics are excluded.
- Only the active expression jostles. Seeded deterministic paths preserve token
  order, containment, direct seek, rewind, screenshots, and scroll authority.
- Active expressions gain depth-scaled breathing room. Phone layouts use stable
  syntax-aware wrapping rather than reduced typography.
- Collapse begins at the deepest required children. Contents contract before
  their wrapping parentheses; a parent cannot finish before its children.
  Same-depth structural siblings move in parallel unless an explicit semantic
  dependency requires ordering.
- Executable forms gather toward their operator, parameter lists toward their
  centroid, anonymous applications toward their compressed operator, quoted
  data toward the collection centroid, and atoms toward themselves.
- A folded subtree becomes a source-derived bead. Atomic-headed forms retain
  their literal head glyph; anonymous applications retain miniature operator
  and argument material rather than an invented English label.
- Detailed bead interiors appear only during active containment teaching. Each
  visible particle corresponds to a real immediate child; large collections
  aggregate explicitly rather than becoming decorative noise.
- Folding and evaluation are different operations. A fold preserves compressed
  structure. A reduction gathers material into an operator root and creates a
  new value with provenance.
- Lambda application temporarily boxes parameters and matching occurrences.
  The argument follows an implied arch with a transient wake into the parameter
  box, contracts, and reappears through an ordered propagation cascade in the
  body. Strong parameter boxes and lighter occurrence boxes share one temporary
  binding color.
- Consumed application structure recursively folds into a temporary provenance
  bead before the reconstructed body recenters. Rewind is the exact causal
  inverse.
- Motion is organic but restrained: buoyant drift, directed transfer, decisive
  collapse, resistant expansion, and no visible bounce.
- Scroll and playback include real dwell plateaus at semantic holds. Internal
  tuning exposes jostle amplitude, parenthesis lag, depth delay, arch height,
  compression, particle detail, dwell duration, and settling stiffness.
- Public interaction remains guided through play, pause, rewind, Previous/Next,
  and scrubbing. Direct bead selection or token dragging is deferred.
- The display column remains undimmed. Salience comes from motion, temporary
  boxes, semantic color, and the existing prose reader cursor.

## Architecture, preservation, and rollback

The renderer consumes the existing certified semantic authority, extended only
where the exemplar proves missing information: stable syntax identities, source
ranges, semantic form roles, lexical binding links, and transformation
provenance. It must not infer binding or meaning from glyph text or geometry.

Lesson authors compose named operations—initially `activate`, `fold`, `unfold`,
`bind`, `propagate`, `reconstruct`, and `reduce`. The framework-neutral
choreography compiler derives depth timing, responsive geometry, rewind,
reduced-motion projection, and review state. `factor`, `duplicate`, `stream`,
and `compose` remain designed-for vocabulary only; they are not implemented
without a concrete approved caller.

- **Preservation boundary:** the certified evaluator and lambda asset,
  `KpLessonDocument`, shared tutorial shell, TOC and scrubber web components,
  scroll/manual authority, economics behavior, catalogue contracts, theme
  tokens, and development-review production closure.
- **Presentation boundary:** semantic and choreography code remain
  framework-neutral TypeScript; visible rendering remains framework-neutral
  DOM/SVG; Svelte owns only lesson composition and lifecycle.
- **Compatibility boundary:** old Lisp checkpoint hashes remain aliases to the
  nearest new canonical state, while visible labels and newly copied links use
  the new grammar.
- **Rollback unit:** the new renderer is selected behind the existing Lisp
  projection boundary. The botanical renderer stays internal and inactive
  until the canonical visual checkpoint and repeated-variable pressure test
  pass. Each slice is a focused verified commit.
- **Promotion boundary:** the human checkpoint approves only this exemplar.
  It does not approve a universal programming-language renderer, arbitrary Lisp
  execution, free learner manipulation, or catalogue-wide rollout.

## Performance and accessibility constraints

- No new runtime or physics dependency.
- Static readable code and native controls exist before enhancement.
- Zero hydration or animation layout shift.
- Geometry is measured only at setup, resize, or typography changes.
- Only the active on-screen block may own animation-frame work; offscreen work
  pauses completely.
- Animate compositor-friendly transforms and opacity where possible.
- Target no more than roughly 15 kB gzip for the shared renderer before
  expression-specific data.
- Reduced motion removes jostling, arches, wakes, elastic parentheses, and
  automatic scroll seeking while preserving manual checkpoints, binding boxes,
  native code states, and announcements.
- Review capture records the active syntax path, expression, operation, depth,
  source/destination identities, checkpoint class, progress, direction, motion
  authority, theme, and internal tuning values when applicable.

## Human promotion criteria

Generalization is blocked until the canonical contact sheet and live route show:

- immediately recognizable source and result code;
- contents visibly leading parentheses at every recursive depth;
- traceable nested ownership with no crossings, collisions, or illegibility;
- an argument arch that clearly lands in the parameter box;
- binding propagation that reads differently from movement or evaluation;
- structural folding and reduction that are unmistakably distinct;
- exact, intelligible rewind;
- enough dwell time to register every causal result;
- readable phone wrapping without reduced type;
- no movement of the surrounding lesson layout; and
- a useful reduced-motion symbolic projection.

## Ordered slices

Every implementation slice starts a bounded Theseus context receipt, records
proof, validates durable state, and ends in one focused commit. Broad matrices
wait for promotion boundaries; visual discovery uses the canonical exemplar and
the smallest preservation checks.

| Slice | Target and intended change | Risk | Verification and expected checks | Commit boundary | Stop condition |
| --- | --- | --- | --- | --- | --- |
| 01 | Reconcile the clean baseline, record the botanical-to-material pivot, materialize the exact target and approved contract, and freeze source refs plus preservation evidence. | Stale frontier or mixed prior work | **Standard:** clean scoped status, proposal/source-ref audit, `theseus workspace validate` | Commit direction, target, contract evidence, and memory alignment | Prior tutorial work is uncommitted, the old contract is still active, or source refs conflict |
| 02 | Define exemplar-local semantic roles and the proven operation vocabulary without adding speculative factor/stream implementations. | Premature universal ontology | **Focused:** type construction, invalid-role, and operation-contract tests | Commit roles, operations, and tests | The change requires a generic Lisp language pack or peer lesson ontology |
| 03 | Extend the canonical semantic asset with stable parenthesis/token/tree identities, source ranges, form roles, binding links, and transformation provenance. | Meaning inferred from rendered glyphs | **Focused:** asset validation, identity, binding, and provenance tests | Commit semantic extensions and fixture laws | Any binding or root identity depends on text equality or geometry |
| 04 | Compile the asset into a pure source-material projection with canonical code states and explicit inspection-state native equivalents. | Renderer becomes semantic authority | **Focused:** projection snapshots, endpoint fidelity, accessibility-equivalent tests | Commit material projection and tests | Canonical source/result text changes or inspection states lack native equivalents |
| 05 | Implement role-dependent root resolution for executable forms, parameter groups, anonymous applications, quoted data, and atoms. | False operator semantics | **Focused:** root selection and nested-role fixtures | Commit root resolver and tests | Parameter or quoted-data forms are treated as calls |
| 06 | Compile recursive fold/unfold dependencies, inside-out depth frontiers, same-depth parallelism, content lead, and parenthesis lag. | Incorrect causal ordering | **Focused:** dense schedule and invariant tests | Commit recursive schedule compiler | A wrapper begins first or a parent completes before required children |
| 07 | Add deterministic seeded jostle trajectories constrained by token order, expression bounds, and parenthesis containment. | Nondeterminism or illegible collision | **Focused:** repeatability, bounds, non-crossing, reverse-sampling tests | Commit drift projector and laws | Sampling depends on history or tokens cross/reorder |
| 08 | Project depth-scaled breathing geometry and syntax-aware phone wrapping inside a pre-reserved stage envelope. | CLS, overlap, or tiny code | **Standard:** pure geometry, wide/phone fixtures, layout-envelope assertions, typecheck | Commit responsive geometry | Typography must shrink or surrounding layout changes |
| 09 | Implement source-derived folded beads, literal-head retention, anonymous-application miniatures, and semantic child-particle interiors. | Invented notation or decorative particles | **Focused + single-frame visual:** bead projection, aggregation, identity tests | Commit bead model and local renderer primitives | A visible particle has no semantic child or the bead invents code text |
| 10 | Compile authored minor/major dwell plateaus and expose the eight approved internal tuning parameters with bounded defaults. | Fast unreadable pacing or public control clutter | **Focused:** duration, plateau, bounds, serialization tests | Commit timing/tuning projection | Public controls acquire tuning machinery or checkpoints have no dwell |
| 11 | Implement `bind` geometry: lambda expansion, parameter/occurrence boxes, one temporary color family, and implied argument arches with transient wakes. | Connector clutter or ambiguous landing | **Focused + visual spike:** binding geometry, source/destination, path-clearance checks | Commit binding presentation plan | A persistent line is required or an arch cannot avoid obscuring code |
| 12 | Implement ordered `propagate` for one occurrence and exact material provenance from argument to parameter to body. | Teleportation or identity fraud | **Focused:** propagation identity, direction, direct-seek, reverse tests | Commit propagation compiler | Reappearance cannot be distinguished from arbitrary replacement |
| 13 | Implement recursive consumed-shell folding into a temporary provenance bead and native reconstruction as `(+ 4 1)`. | Source material vanishes without reason | **Focused:** material ledger, reconstruction endpoint, rewind tests | Commit reconstruction choreography | Any application material exits without an explicit provenance reason |
| 14 | Implement distinct structural fold versus `reduce`, gathering operands into `+`, emitting `5` from the operator root, and final typographic settlement. | Folding falsely implies computation | **Focused:** operation distinction, result provenance, endpoint and reverse tests | Commit reduction choreography | Fold and evaluation are visually or semantically indistinguishable |
| 15 | Add the framework-neutral semantic DOM token renderer with one visible paint owner, selectable canonical endpoints, and SVG limited to transient guides. | Double paint or inaccessible canvas-like output | **Standard:** DOM ownership, selection, native reading order, endpoint tests | Commit renderer foundation | Settled code is not selectable or two visible representations compete |
| 16 | Render the structural block end to end: activation, drift, recursive collapse frontiers, child interiors, and exact expansion. | Organic motion obscures syntax | **Standard + canonical visual smoke:** representative frames, dense seek/rewind, no-overlap assertions | Commit structural exemplar | The learner cannot trace nested ownership or parentheses lead contents |
| 17 | Render the lambda-application block end to end: open, box, arch, bind, propagate, provenance fold, and reconstruct. | Binding remains pedagogically ambiguous | **Standard + canonical visual smoke:** phase captures, direct seek, rewind, paint ownership | Commit binding exemplar | Argument destination or body correspondence is unclear |
| 18 | Render the evaluation block end to end: structural bead, gathered reduction, result emergence, and native `5`. | Evaluation reads as disappearance | **Standard + canonical visual smoke:** phase captures, endpoint, reverse, ownership | Commit evaluation exemplar | The operator is not visibly causal or final value is not ordinary code |
| 19 | Replace the Lisp presentation through the existing projection boundary while retaining the botanical renderer as an inactive internal rollback. | Semantic or catalogue integration drift | **Broad:** Lisp asset/runtime suites, catalogue hostability, architecture, typecheck | Commit adapter integration and rollback selector | Certified evaluator/runtime truth changes or unrelated catalogue callers regress |
| 20 | Re-author the lesson into the three approved cumulative motion blocks with surrounding prose, independent scrubbers, and no display dimming. | Text/motion mismatch or focus switching | **Standard + editorial/browser:** publication, cumulative handoff, active passage, control ownership | Commit lesson document and local composition | Text must change during playback or more than one block owns motion |
| 21 | Add new structural/binding/evaluation destinations and compatibility aliases for every old Lisp checkpoint hash. | Broken bookmarks or replay-based restoration | **Broad:** URL codec, direct load, Back/Forward, long jump, exact-state tests | Commit navigation migration | Any legacy link cannot restore meaningfully without intermediate replay |
| 22 | Extend generic tutorial review capture with optional expression operation, syntax path, depth, identities, checkpoint class, theme, and tuning evidence. | Domain leakage into shared provider | **Standard:** provider schema/adapter tests plus both lesson submission checks | Commit extensible capture seam and Lisp adapter | Economics must know Lisp fields or production review closure fails |
| 23 | Complete static/no-JS, reduced-motion, high-contrast, screen-reader, keyboard, and stable phone projections. | Motion becomes required for meaning | **Broad:** accessibility and progressive-enhancement browser matrix | Commit accessibility/fallback projection | Any semantic step or control is unavailable without spatial motion |
| 24 | Add stable scoped unit, browser, visual contact-sheet, and performance commands; enforce zero CLS, one active sampler, offscreen suspension, and the renderer bundle budget. | Unrepeatable review or hidden runtime cost | **Broad:** production build, production closure, performance and scoped visual commands | Commit certification harness and budgets | A new dependency, widened ceiling, persistent offscreen work, or layout shift is required |
| 25 | Run the canonical wide/phone/reduced-motion contact sheet and complete boundary verification against the approved promotion criteria. | Inferred aesthetic approval | **Broad + manual:** full Lisp tests, type/build/architecture, comparison smoke with economics, deterministic captures | Commit canonical checkpoint evidence and report `HUMAN_CHECKPOINT` | Always stop for the user's live visual judgment before the second caller |
| 26 | After explicit checkpoint approval, add `((lambda (x) (+ x x)) 4)` as the second caller and prove one-to-many propagation without renderer special-casing. | False abstraction or premature generalization | **Broad + visual:** repeated-occurrence semantic, propagation, reverse, accessibility, and contact-sheet tests | Commit second caller and promotion evidence | The second caller requires expression-specific renderer branches |
| 27 | After the second caller passes, delete the botanical renderer and obsolete tests, update API tiers/project memory, run release closure, and close the contract. | Lossy cleanup or premature API promotion | **Broad release:** all Lisp/economics tests, typecheck, build, production closure, architecture, performance, `git diff --check`, workspace validation | Commit retirement and closeout | Any preserved route, review capture, semantic contract, or performance budget regresses |

## Verification cadence

Inner-loop checks are chosen from changed paths and remain narrowly focused.
Visual discovery uses one Chromium exemplar and deterministic contact-sheet
captures until slice 25. Cross-browser, responsive, accessibility, performance,
production-closure, and both-lesson regression gates occur at the named
promotion boundaries rather than being repeated after every visual adjustment.

Expected boundary commands include existing or newly added stable equivalents
of:

- `npm run test:botanical-lisp-tutorial` (renamed only after compatibility is
  proven);
- `npm run test:browser:botanical-lisp-tutorial`;
- the new scoped S-expression material unit and visual commands;
- `npm run test:browser:tutorial-review`;
- `npm run visual:tutorial-lesson-comparison`;
- `npm run test:economics-demand-shift-tutorial`;
- `npm run typecheck`;
- `npm run build`;
- `npm run check:dev-review-production`;
- `npm run check:architecture`;
- `git diff --check`; and
- `theseus workspace validate`.

Progress heartbeats come from `npm run --silent loop:status` at every slice
start, completion, and commit boundary, and before any stop or handoff.

## Explicit deferrals

- factoring, arbitrary duplication, list streaming, and widget composition
  until concrete approved callers exist;
- nested shadowing, variadic/rest parameters, side effects, macros,
  continuations, mutation, and dialect-specific evaluation order;
- a full Lisp parser, evaluator, debugger, REPL, or cons-cell lesson;
- learner token dragging, free bead manipulation, or a public motion editor;
- generic language-animation schemas, universal scene graphs, or catalogue-wide
  motif migration;
- public-site or Public Editor work; and
- unrelated animation, lesson, dashboard, or API cleanup.

## Contract stop conditions

Stop on semantic authority inferred from rendered glyphs, nondeterministic
sampling, token crossing or order mutation, wrappers leading contents, material
without provenance, folding that implies evaluation, inaccessible or
unselectable canonical code, direct-link replay requirements, scroll/manual
discontinuity, more than one active sampler, layout shift, a new runtime
dependency, widened performance ceilings, framework ownership of semantic
truth, economics or shared-shell regression, overlap with unrelated user-owned
files, missing durable verification, scope expansion into deferred operations,
or the required slice-25 human checkpoint.
