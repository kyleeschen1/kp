# Presentation Compiler Continuity Repair Long-Loop Proposal

Date: 2026-07-29
Status: proposed for user approval
Mode: long
Candidate Execution Contract:
`run-contract.kp.presentation-compiler-continuity-repair-v0`

## Objective

Replace animation-local binary paint handoffs with one registry-routed,
type-checked continuity contract for operation evaluation, then prove that the
same unchanged presentation compiler produces:

1. `1 + 2 -> 3`;
2. `5 + 2 -> 7`; and
3. `3/6 -> 1/2`.

After those three callers pass, migrate the exact-fraction quantity exemplar
through the same compiler, derive its pacing from semantic action minima, and
return it to human visual review. The exemplar remains unpromoted until that
review passes.

The canonical authoring path becomes:

```text
verified semantic operation, roles, and lineage
-> versioned operation-presentation registry
-> verified presentation plan and certified paint-continuity plan
-> one existing canonical renderer strategy
-> native endpoint settlement
```

Animation authors and generated drafts may not choose opacity policy, DOM
ownership, glyph paths, handoff instants, or example-specific timing.

## Why This Loop Is Current

The superseded exact-fraction contract reached its release slice with strong
semantic, cross-view, accessibility, responsive, and deterministic evidence,
but human review found persistent flicker and compressed pacing. Investigation
identified three systemic gaps:

- `opaque-binary-handoff` changes source and target opacity discontinuously at
  a readiness boolean while the tests only forbid fractional opacity;
- the exact-fraction symbolic path labels local bindings as
  `operation-evaluation` without resolving them through the shared
  presentation registry/compiler; and
- the exemplar hard-codes one 7.5-second timeline and a fixed
  setup/action/settle ratio instead of consuming the existing semantic
  duration planner.

The prior release slice has therefore been skipped and its contract
superseded. Priority change
`priority-change.kp.presentation-compiler-continuity-repair-v0` records that
continuity is current and exact-fraction release remains at a checkpoint.

## Canonical Reference And Observable Acceptance

The first human-visible reference is `1 + 2 -> 3`:

- `1`, `+`, and `2` participate in one typed evaluation cohort;
- all source material and the operation catalyst converge and shrink into one
  common synthesis junction;
- `3` emerges from that same junction without a fade or non-equivalent paint
  swap;
- source and target endpoints remain native KaTeX;
- direct seek, natural playback, rewind, and repeated playback sample the same
  path;
- phone and wide layouts remain centered and uncrowded; and
- the default action is slow enough to read pedagogically.

The continuity law permits an ownership change only when the outgoing and
incoming paint are equivalent within a certified tolerance or both meet at
the same zero-area topology-changing junction. Opacity remains opaque for
non-zero paint. A boolean source/target swap at different paint geometry is
invalid.

Promotion of the compiler repair requires all of the following:

1. raw binary handoff cannot enter a promoted presentation plan;
2. every animated operation evaluation resolves a version-pinned registry
   entry and verified plan compiler;
3. unsupported or unknown operations fail closed to an explicit static
   checkpoint;
4. natural playback checks every ownership and phase boundary at
   `t-epsilon`, `t`, and `t+epsilon`;
5. visible geometry, opacity, style fingerprint, and owner continuity remain
   within declared tolerances in Chromium, Firefox, and WebKit;
6. `1 + 2 -> 3`, `5 + 2 -> 7`, and `3/6 -> 1/2` use the same implementation
   without per-example opacity, route, scheduling, or geometry configuration;
7. action durations come from semantic minima rather than a single
   proportionally divided total;
8. the shared player offers one bounded playback-speed control while retaining
   one clock and one session;
9. the exact-fraction symbolic path contains no local `motif`, paint-policy,
   or path-family authority; and
10. the repaired four-view exact-fraction exemplar passes a second explicit
    human visual checkpoint before release.

## Exemplar Checkpoints

### Checkpoint A: Shared Evaluation Motif

- **Canonical reference:** `1 + 2 -> 3`.
- **Observable review:** forward, natural replay, direct seek, rewind, wide,
  phone, Chromium, Firefox, and WebKit.
- **Promotion criterion:** no hard cut, fade, glyph/style change, endpoint
  jerk, overlap, or unreadably fast action.
- **Rollback unit:** the verified continuity-plan types, compiler adapter, and
  one evaluation renderer adapter remain independently revertible from later
  callers.
- **Checkpoint rule:** slice 12 stops at `HUMAN_CHECKPOINT`; slices 13-22 do
  not run until the user explicitly approves the exemplar.

### Checkpoint B: Exact Fraction Quantity

- **Canonical reference:** the existing five-beat
  `1/3 + 1/6 = 1/2` four-view exemplar.
- **Observable review:** full symbolic motion and all concrete views, forward,
  replay, direct seek, rewind, wide, and phone at the new default pace.
- **Promotion criterion:** no flicker or fades, all concrete views visibly
  execute, pacing is readable, and no animation-local presentation authority
  was reintroduced.
- **Rollback unit:** exact-fraction migration and pacing integration can be
  reverted without reverting the shared compiler proof.
- **Checkpoint rule:** slice 21 stops at `HUMAN_CHECKPOINT`; release slice 22
  requires explicit approval.

## Preservation Boundary

- Preserve exact quantity mathematics, proofs, trace, stable part identities,
  fold truth, and cross-view correspondence.
- Preserve native KaTeX as settled typography and accessibility authority.
- Preserve one shared clock, runtime session, compositor, scheduler
  vocabulary, Review seam, Animation Library page, and WebGL resource policy.
- Preserve all already approved fraction, radical, distribution, factoring,
  solve-x, and generated-reader behavior unless a focused regression proves
  that it uses the invalid binary policy.
- Preserve static/no-JavaScript, reduced-motion, transcript, screen-reader,
  export, and production-isolation truth.
- Preserve unrelated user-owned dirty and untracked files.

## Allowed Work

- one renderer-neutral verified paint-continuity plan and validator;
- one versioned registry/compiler route for operation evaluation;
- one adapter over the existing canonical native-KaTeX compositor;
- one explicit static fallback for unsupported presentation;
- natural-playback boundary telemetry and stable browser checks;
- integration of the existing semantic-duration planner;
- one shared player speed preference;
- migration of the three named evaluation callers and the exact-fraction
  symbolic path;
- focused architecture and promotion gates that prohibit local bypasses; and
- exact-fraction release only after both human checkpoints pass.

## Disallowed Work

- no second equation compositor, runtime, clock, scheduler, display page, or
  WebGL lease;
- no new DOM animation backend in this contract; stop for an architecture
  decision if the existing canonical renderer cannot satisfy continuity;
- no LLM-authored selectors, roles, DOM, pixels, paths, opacity, keyframes, or
  timings;
- no example-specific route, opacity, handoff, or scheduling exception;
- no whole-expression fade replacement;
- no broad motif-library redesign or migration outside the named callers;
- no change to mathematical semantics merely to simplify presentation;
- no place-value, economics, physics, vector, matrix, generator, or editorial
  feature work; and
- no promotion flag or certificate update before the final human approval.

## Ordered Slices

| Slice | Target and intended change | Risk and verification | Commit boundary and stop condition |
| --- | --- | --- | --- |
| `s01` | Materialize the approved successor contract, link this proposal and the recorded priority change, and prove that the superseded release cannot remain promotion authority. | **Standard:** `theseus plan run`, loop status, promotion-memory gate, workspace validation. | Commit control state only; stop on competing active authority or missing approval. |
| `s02` | Freeze the continuous-carrier/junction reference, tolerances, non-fade law, backend boundary, three-caller proof, pacing requirements, and preservation manifest. | **Focused:** contract and forbidden-field tests. | Commit reference; stop if acceptance requires example-specific pixels or an undefined visual judgment. |
| `s03` | Generate a migration ledger for raw successor bindings, `opaque-binary-handoff`, local motif labels, path-family authority, registry callers, and semantic-duration consumers. | **Standard:** repository inventory test and `verify:impact` inspection. | Commit ledger/gate; stop if a second canonical compositor is found. |
| `s04` | Define the sealed renderer-neutral `VerifiedPaintContinuityPlan`: exclusive owner intervals, topology-preserving carriers, certified synthesis junctions, endpoint settlement, and style authority. Add concise comments explaining why callers cannot author paint policy. | **Standard:** positive and negative type fixtures, typecheck, inference budget. | Commit types; stop if the type must encode DOM or pixel geometry. |
| `s05` | Add the pure trusted continuity validator/mint boundary with complete lineage coverage, legal owner transitions, opaque non-zero paint, and explicit paint-equivalent or zero-area junction requirements. | **Standard:** forged, missing, duplicate, hard-swap, and illegal-opacity cases. | Commit validator; stop if validation depends on browser history. |
| `s06` | Add a renderer-neutral temporal continuity sampler and diagnostics for `t-epsilon`, `t`, and `t+epsilon`, including pose, scale, alpha, style fingerprint, owner, velocity, and topology boundary. | **Standard:** deterministic property tests and bounded sampling cost. | Commit diagnostics; stop if sampling becomes the source of semantic truth. |
| `s07` | Evolve the versioned operation-presentation registry/compiler so a resolved entry returns a verified operation plan plus required continuity-plan compiler; unknown entries resolve only to explicit static checkpoint. | **Broad:** registry pins, extension limits, fail-closed fixtures, operation-presentation laws, architecture. | Commit registry boundary; stop if an extension can bypass minting or if public API compatibility requires parallel animated paths. |
| `s08` | Compile operation roles and total material lineage into one generic opaque junction plan. Catalysts participate in the convergence but cannot contribute material lineage. | **Standard:** sum/product/difference/quotient role fixtures and rewind laws. | Commit compiler; stop if operation text or rendered glyph equality must be inferred. |
| `s09` | Adapt the existing native-KaTeX successor renderer to consume only verified continuity plans. Replace the readiness boolean swap with continuous source and target poses meeting at the certified common junction. | **Broad:** compositor pose/ownership tests, endpoint settlement, neighboring glyph/radical/fraction suites. | Commit adapter; stop on a new lifecycle, scheduler, compositor, or operation-specific branch. |
| `s10` | Compile `1 + 2 -> 3` through the registry with no raw binding or authored paint path; expose stable boundary telemetry in the existing Animation Library. | **Broad:** focused unit/type checks, host lazy-loading, Review capture, exact rewind. | Commit exemplar; stop if it needs example-local geometry, opacity, timing, or path policy. |
| `s11` | Add stable natural-playback browser validation for the exemplar, sampling every phase/owner boundary in Chromium, Firefox, and WebKit and distinguishing loop restart from internal handoff. | **Broad + visual:** scoped browser command, raster/geometry continuity, wide/phone, replay, seek, rewind, resource release. | Commit evidence; stop on any hard cut, style change, endpoint jerk, history dependence, or flaky tolerance. |
| `s12` | Present `1 + 2 -> 3` in the existing Animation Library and stop for human visual approval. | **Manual + broad:** rerun stable visual command and live Review capture. | Commit checkpoint evidence and report `HUMAN_CHECKPOINT`; do not generalize before approval. |
| `s13` | Compile `5 + 2 -> 7` as the second caller using the unchanged registry entry, continuity compiler, and renderer adapter. | **Standard:** architecture assertion for zero per-example paint fields plus browser spot check. | Commit caller; stop if shared implementation changes are needed solely for this numeral set. |
| `s14` | Compile `3/6 -> 1/2` as the third quotient caller, with the fraction rule classified as the operation catalyst and no cancellation dispatch. | **Broad:** typed operation plan, fraction-rule geometry, natural playback, rewind, native settlement. | Commit caller; stop on cancellation semantics, a glyph-specific exception, or a second visual path. |
| `s15` | Add a three-caller conformance gate proving identical compiler and renderer authority, no local paint/path/scheduler fields, complete lineage, and explicit static fallback for an unsupported operation. | **Standard:** generated conformance manifest, negative fixtures, architecture and inference budgets. | Commit gate; stop if conformance is based only on names or snapshots. |
| `s16` | Migrate every exact-fraction symbolic evaluation and successor segment through registered verified plans; remove its local `motif` and `opaqueSuccessor` authority. | **Broad:** exact semantic/projection/runtime suites, three-caller gate, native scene and Review provenance. | Commit migration; stop if exact-fraction needs an operation-specific renderer branch or semantic rewrite. |
| `s17` | Move denominator collision routing from the exemplar-authored `arc-below` field to the existing generic measured collision planner, then delete the local route field. | **Broad + visual:** compositor clearance, wide/phone/DPR, dense affected boundaries, existing fraction-composition regression. | Commit routing repair; stop if generic measured planning cannot find a legal bounded route. |
| `s18` | Connect the exact-fraction beat/action list to the existing semantic-duration planner, assign reviewed minimum durations, and derive the total timeline rather than proportionally splitting 7.5 seconds. | **Standard:** duration coverage/minimum laws, fold truth, direct-seek markers, static/export timing independence. | Commit pacing plan; stop if changing pace changes semantic checkpoint order or creates a second clock. |
| `s19` | Add one shared bounded player-speed control and persistent default while keeping one play/pause/replay control, one session, reduced-motion behavior, and URL/review round-trip. | **Broad:** player unit/browser tests, accessibility, keyboard, production isolation, neighboring library entries. | Commit control; stop if animation adapters must each implement speed or controls fork between pages. |
| `s20` | Run the full continuity matrix over the three callers and exact fraction: natural playback, loop boundary, direct seek, rewind, repeated replay, font readiness, resize, phone/wide/DPR2, three browsers, performance, and resource disposal. | **Release-level:** exact, compositor, player, architecture, inference, browser/visual, build, production closure. | Commit evidence; stop on flicker, fade, endpoint snap, overlap, nondeterminism, browser divergence, or resource regression. |
| `s21` | Present the repaired four-view exact-fraction exemplar at the semantic-duration default and stop for human review. | **Manual + broad:** live Animation Library, Review capture, wide/phone, all views, forward/replay/seek/rewind. | Commit checkpoint evidence and report `HUMAN_CHECKPOINT`; do not promote without explicit approval. |
| `s22` | After approval, mint evidence-derived promotion readiness, update the stable ledger and catalog maturity, record Theseus verification/closeout, and leave the next content promotion inactive. | **Release:** full test, typecheck, architecture, inference, build, production closure, scoped browser/visual commands, `theseus workspace validate`. | Final focused release commit and `COMPLETE`; keep status partial on any failed criterion. |

## Verification Cadence

- At every slice start, completion, commit boundary, and stop, run
  `npm run --silent loop:status`.
- Focused and standard slices begin with
  `npm run verify:impact -- --path <changed-path>` and then run the selected
  stable command.
- Rendering slices run the compositor and exact-fraction suites plus the
  smallest browser command that exercises natural playback.
- Checkpoint A uses one stable repository-owned visual command for
  `1 + 2 -> 3`; later callers extend that committed entrypoint.
- Checkpoint B and release run the exact-fraction unit/browser/visual matrix,
  neighboring canonical fraction/radical checks, player checks, architecture,
  inference, typecheck, build, production closure, and Theseus validation.

## Stop Conditions

Stop immediately if:

- a raw binary or non-equivalent paint-owner swap remains reachable from a
  promoted plan;
- an operation-evaluation caller can bypass registry resolution or continuity
  minting;
- a repair requires example-specific opacity, route, handoff, scheduler, or
  renderer code;
- a new compositor, runtime, clock, scheduler category, display page, or
  WebGL lease is required;
- continuity requires glyph-text inference, authored DOM/pixels, or changing
  mathematical semantics;
- natural playback differs from direct seek or rewind;
- source/target native typography, accessibility, export, fold truth, Review,
  or production isolation regresses;
- the three-caller proof cannot use one unchanged compiler and renderer;
- a visual checkpoint is rejected or unavailable;
- type/inference, performance, resource, or cross-browser budgets regress; or
- unrelated user-owned work must be overwritten.

## Explicit Deferrals

- implementation of a new DOM/FLIP animation backend;
- generalization beyond the three named evaluation callers and exact fraction;
- later fraction-harvest variants;
- place-value, economics, physics, vectors, matrices, graphs, calculus, and
  curriculum expansion;
- problem-generator and LLM editorial integration;
- global motif aesthetic redesign; and
- repository pruning unrelated to the migrated bypasses.

## Expected Learning

Determine whether KP can make a supported operation animation correct by
construction: a generated semantic operation resolves one versioned motif,
receives one certified continuous paint path and semantic duration, and either
renders consistently across browsers or fails closed without animation-level
tuning.
