# Next: compose the dot passage inside a rectangular product

Status: recommendation following focus tuning; no implementation started by
this review. The existing matrix-authoring contract retains its visual gate.

The current dot exemplar has a 6px default lift, 0–24px height control, 40%
background opacity, no background scaling and no shadows. Its held focus and
native/moving token correspondence are tested. This establishes one working
presentation, not a general-purpose authoring interface or learning outcome.

Recommend the preserved 2×3 by 3×2 integration from
[the approved authoring plan](2026-09-30-matrix-authoring-next-step.md).
Keep both factors and the result visible; choose a result cell, derive its
original row/column relationship, run the existing three-term passage, and
return its value to the corresponding result position. Start with one cell,
then demonstrate all four selections and a second set of values through the
same authoring source boundary. Record any remaining renderer edits honestly.

| Candidate | Authoring benefit | Reuse evidence | Risk | Recommendation |
| --- | --- | --- | --- | --- |
| Rectangular product integrating the dot passage | High | Tests composition and semantic selection | Medium | Next |
| Entry inspection and provenance | Medium | Tests audit usefulness | Medium | Follow integration |
| Polynomial-to-matrix transformation | High | Tests a new representation boundary | Higher | Later pressure case |
| More focus controls | Low | Little new reuse evidence | Low | Only for observed defects |

Canonical host remains the matrix menu; native KaTeX and the existing material
adapter own paint, and `src/math/matrix-product.ts` owns mathematical identity.
Preserve the standalone passage, evaluation choreography and source-only signed
variation. Keep this integration independently reversible and review its layout
before promotion. No universal scene API, arbitrary-dimensional renderer or
new content library is implied.

Success means selecting another cell changes the semantic input and destination,
not the dot-product animation implementation. The old rectangular continuation
is still relevant; the shadow experiment is superseded, and parked symbolic
inspection work is not automatically resumed. This recommendation does not
change Theseus execution status or declare the latest visual changes accepted.

## Return to animations after reader experiments

The user now wants to return from layout, card-lifecycle and speech exploration
to mathematical animation. Recommend finishing the pending rectangular product
first, then testing a new representation boundary with polynomials, then a single
Gaussian-elimination row operation. This is prioritization, not authorization to
implement the proposed sequence or acceptance of the rectangular layout.

| Candidate | Authoring benefit | Reuse | Risk / slice size | Order |
| --- | --- | --- | --- | --- |
| Complete rectangular row-column selection and result placement | High; closes a pending composition proof | Existing dot and product objects | Bounded; first-cell visual checkpoint remains | First |
| Cubic polynomials to coefficient matrix and monomial vector | High; probes semantic regrouping across representations | Coefficients, terms, extraction and alignment | Higher; one fixed example first, explicit missing powers | Second |
| One row replacement with equivalent equation update | High; relates an operation to its mathematical consequence | Scalar-vector multiplication and addition | Medium/high; explicit nonzero elimination pivot | Third |
| More layout, focus-material or speech work | Lower for current animation question | Existing host work | Competes with requested focus | Set aside |

The polynomial exemplar should separate coefficients from the shared ordered
basis (1, x, x², x³), preserving term provenance and inserting explicit zero
coefficients for missing powers. The subsequent row-replacement example should
show R₂ ← R₂ − cR₁ and the corresponding equation change, rather than a complete
elimination algorithm. Later projection, least squares and eigenvector examples
remain attractive but are not part of this recommended first sequence.

Immediate next action: inspect the existing rectangular first-cell host, settle
the connection between source row/column and destination cell, then continue the
previously approved all-cell and changed-input proof. Animated extraction from
full matrices is a possible new addition, not already delivered by that host.
Keep the dot choreography as reference and the current split reader as a host;
reader experiments are preserved, with no further work started by this review.

## Project-wide convergence recommendation

Status: engineering milestone closed under the explicit amendment below;
reader validation deferred. This responds to the user's concern
about fragmentation and no visible finish line and supersedes expansion of animation
topics immediately, not any accepted implementation contract or visual gate.
The reported abrupt appearances concern entire lines of matrix operations and
wrappers, not lines of code. The [execution evidence](2026-10-01-animation-convergence-evidence.md)
now records the column-combination reveal defect and its review candidate.

Recommend one bounded release candidate: an author supplies a short mathematical
argument and semantic references, previews smooth inspectable motion, and changes
the example without editing renderer code. Demonstrate it in matrix multiplication
and an existing algebra family before introducing more domains or reader modes.

1. Make one bounded map of the paths actually needed by these two examples:
   source, semantic authority, checked moves, motion ownership, host and tests.
   Label each competing path keep, adapt, retire or experimental; inspect real
   consumers before migration. No repository-wide unification or generic renderer.
2. Use the current split reader as the provisional workbench. Diagnose one abrupt
   matrix-operation-line entrance and one instantaneous wrapper. Give every
   visible change an intentional treatment or a precise unsupported gap; do not
   infer visual quality from semantic validity or a passing endpoint test.
3. Complete one end-to-end authoring path per domain using existing responsible
   boundaries. Pressure each with three changed inputs, including signs or a
   structural edge case. Record source-only success and every engine intervention.
   Share infrastructure only where actual callers demonstrate shared responsibility.
4. Show the resulting explanations to a few intended users. Ask them to trace an
   entry/term's origin, explain one change, and predict the next result. Compare a
   static explanation where practical; this is formative evidence, not efficacy
   certification. Separate author usefulness from reader usefulness.
5. Close the release: designate canonical examples, archive superseded entrypoints,
   remove verified redundant paths, record remaining unsupported cases, and issue
   an explicit release/readiness decision. An experiment must end in adoption,
   rejection or a named unresolved question rather than permanent active status.

| Candidate | Authoring / reuse | Reliability | Risk | Recommendation |
| --- | --- | --- | --- | --- |
| Two-domain end-to-end convergence milestone | High, directly measured through changed inputs | Targets reported discontinuities and real authoring failures | Bounded if existing owners retained | First |
| More topic exemplars | Potentially high, currently unproven transfer | Can repeat current defects | Expands unfinished surface | Defer |
| Universal renderer/API rewrite | Speculative | Large preservation burden | High | Reject as default |
| More reader/voice exploration | Useful independent questions | Does not settle animation quality | Divides attention | Park during milestone |

Proposed operating constraints: one active outcome, one reviewable exemplar at a
time, and one ranked backlog. Keep the existing human plan and executable Theseus
record; add no management system or parallel plan tree. Batch visual judgments,
continue routine verification autonomously, and make each new tangent an explicit
tradeoff against the active milestone. Set a short review horizon before starting;
if transfer remains expensive, narrow supported scope rather than extending the
milestone indefinitely. Existing pending checkpoints need explicit reconciliation
in an approved contract; this proposal neither approves nor silently abandons them.

Done means two usable checked authoring examples, three source-only variations
per family, reviewed continuous transitions, semantic inspection, deterministic
seek/reverse, preserved accessible static content and measured delivery/runtime
cost. A fresh agent should reproduce one variation from the documented entrypoint.
If these criteria fail, report the specific failure rather than claim broad
Algebra I/II coverage or a general-purpose animation system.

### Approved closeout amendment

The user answered “go” to the explicit question proposing engineering closure
with reader validation deferred. This closes the bounded engineering milestone
and defers the intended-reader study in item 4; it does not mark that study
completed or establish learning effectiveness. The existing Theseus contract
records the reader-review slice as skipped and the engineering closeout as
complete. Older rectangular/basis visual gates remain intact. Deployment and
implementation of the proposed signed-fraction endpoint repair are outside this
amendment. The evidence report owns the final disposition and residual limits.

### Approved execution boundary

User approved the priorities and execution with “Go as far as possible.” Use
`run-contract.kp.animation-convergence-v1` for the new convergence outcome; do not
reopen or declare accepted the older rectangular, basis or reader checkpoints.
The affected canonical matrix exemplar is the existing column-combination host
at `/experiments/matrix-column-combinations/`: `matrix-product.ts` and
`matrix-interpretations.ts` own meaning, the local column presentation owns its
KaTeX paint, and the existing player owns time. The algebra control is the
existing checked fraction-chain authoring/publication path, chosen for demonstrated
source-only reuse rather than inventing another algebra renderer.

Packages: bounded ownership map; independent algebra source/replay proof; one
matrix continuity exemplar and visual review; post-acceptance matrix variations
and integration; formative reader/author review; release and explicit limits.
Theseus owns order/status. Existing blocked work remains preserved and will be
reconciled explicitly if later integration overlaps its scope. No global renderer
rewrite, new curriculum domain, reader redesign, speech, deployment, paid calls,
or unreviewed motif rollout. Use the current branch; do not merge it.

Before the matrix checkpoint, verify semantic invariants, pure sampling, source
and target ownership, reversal and a scoped Chromium capture. Reuse reviewed
motif owners where applicable; do not substitute a generic fade for missing
choreography. Keep that presentation repair independently reversible. Generalize
only after its human review and a second caller. Algebra variations may use the
existing accepted path, with exact-source evidence and no promotion claims.
The fresh-agent reproduction is specifically authorized by the accepted proposal.

Execution ceiling: the named packages, with at most three unsuccessful repair
approaches before a bounded reassessment. Reserve final work for verification,
evidence and clean handoff; this is not permission for an open-ended rewrite.
Stop for the first required visual decision, unavailable human study input,
completion or an unrepairable scope/safety/external blocker. Routine checks and
repairable engineering budgets are not approval stops. No time/quality guarantee
or unrequested token budget is implied.
