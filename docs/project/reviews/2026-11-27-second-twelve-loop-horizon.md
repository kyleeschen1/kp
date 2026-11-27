# Next twelve loops: a reusable mathematical vocabulary

Date: 2026-11-27
Status: proposal only, following the user's acceptance of the studio finish.
No new implementation run, delegation, model call or publication is authorized.
The [first horizon](2026-11-27-twelve-loop-horizon.md) is complete at its bounded
scope; do not enlarge it to track this successor. Theseus owns execution once
the next selected tranche is approved.

## Outcome and judgment

Make it possible to find a mathematical idea, instantiate a supported example,
discover its representations and questions, revise the mathematics through a
checked conversation, and reuse the explanation in reference and practice.
Importing a concept should bring useful selected constructions and explanations,
not force authors to engineer each view or load an entire mathematical library.

The first horizon established seven accepted references, selected-object
discovery, bounded prose revision, and matrix-specific cross-notebook reuse.
It did not establish arbitrary concept imports or model-authored mathematics.
The next proof should therefore improve authoring early and use richer mathematics
to pressure that workflow, rather than treating twelve new standalone demos as
the finish line. The charter's authoring → adaptation → practice progression stays.

## Evidence and priority

Inspected at `5754c3a01`: `src/math-discovery/catalog.ts` enriches nine existing
commands for matrix/vector, quadratic, vector-pair and matrix-pair selections.
It is not a library search interface before an object exists. The accepted local
publication and binding code is explicitly matrix-specific; its Derive means
shared matrix/local vector. It must not become a generic definition of derivation.
The actual revision boundary admits a note and target, not numeric edits or
arbitrary JSON patches. Existing basis/map and differentiable-map owners offer
foundations for later work, not evidence of finished eigen/Jacobian authoring.

| Candidate | Authoring | Reliability/demo value | Reuse/continuity | Risk | Judgment |
|---|---|---|---|---|---|
| Search, guided insertion, checked substantive revision | High | High | High: uses existing rows, sources and history | Moderate | First tranche |
| More isolated mathematical animations | Medium | High visually | Low until authoring/reuse follows | Moderate/high | Integrate as loops 7–10 |
| Universal concept graph, generic editor or plugin framework | Indirect | Unproved | Speculative | High | Do not make a prerequisite |
| Whole-book search and cloud synchronization | Potentially high | Unproved at present scale | Broad migration | High | Later, after a bounded catalogue |

The first choice reduces duplicated host work and preserves session continuity
through existing UUIDs and drafts. Its sources and command adapters are small
enough to checkpoint independently. Evaluate actual integration cost after loop
3 and the distinct reuse caller after loop 4 before investing in general APIs.

## Proposed order

| Loop | Author-visible outcome | Bounded finish and decisive check |
|---|---|---|
| **1. Search the mathematical library** | Find an explanation by question, object, operation, property or visual representation before inserting anything. | Index the seven accepted references and existing capability descriptors through the current row picker. Show requirements and actual support. Search loads metadata, not every renderer or solver. Include exact source links for human/LLM context; no remote MCP server. |
| **2. Guided object insertion** | Choose a matrix/vector or quadratic, fill its typed slots, and choose useful existing views without editing JSON. | Both families work in their supported notebook hosts, preserve UUIDs and native undo, and reject incomplete inputs honestly. A fresh example must use the existing constructor/evaluator/player. This does not silently introduce a mixed-family notebook schema. |
| **3. Let chat change mathematics safely** | Request a substantive change such as “make the two horizontal contributions cancel,” inspect the changed values and explanation, and accept one transaction. | Matrix first: a finite proposal of operand edits and allowed existing view additions, dispatched through domain commands. Source/draft/thread/target checks, preview, rejection, undo and export remain mandatory. Stale or unsupported changes produce typed gaps. One real response is required before claiming useful conversational authoring; no arbitrary code/patch execution. |
| **4. Reuse a genuinely different family** | Copy or transclude a quadratic, and create a derivative that retains a declared dependency across notebooks. | Quadratic/derivative semantics, publication ownership, live/pinned revisions and missing sources are explicit. Pressure native undo, deletion, reload and local viewport state. Reuse persistence/identity machinery where justified; do not stretch matrix-local-vector Derive into a universal rule. |
| **5. Link to meaningful parts** | Point a question, comment or explanation at a matrix entry, column, input or result rather than only the containing block. | Existing semantic member IDs drive inspect/link/return and accepted focus treatments. Edits, reorder, reload and deletion cannot silently retarget links. Missing targets are visible. A second source tests the anchor mechanism; new attention choreography needs its own exemplar review. |
| **6. Import one concept with its useful relationships** | Import projection with a definition, a guiding question, worked example, counterexample, related explanation links and selectable lenses. | A small authored recipe expands to existing vector-pair resources, references and operations; only selected views load. Keep provenance and explicit requirements. Test negative projection, orthogonality and the undefined zero-direction case. This is not automatic theorem discovery or a universal ontology. |
| **7. Explain invertibility and information loss** | Connect determinant, signed area, rank and collapse with examples that answer “can the input be recovered?” | Bounded 2×2 matrices: invertible, rank-one and zero map. Existing determinant/map owners supply truth; visualize image and kernel where supported. Exact or approximate claims are distinguished, and every new treatment gets an exemplar gate. Use the insertion/discovery/reuse path, not a new bespoke application. |
| **8. Make change of basis tangible** | Keep the geometric vector/map fixed while its coordinates and matrix representation change. | Invertible R2 bases, including a nonorthogonal basis; reject dependent bases. Check coordinate round trips and the representation relation using existing basis/map authority. One playhead connects symbols and geometry, with exact return and persistence. |
| **9. Build the eigenvector concept** | Discover invariant directions and compare when an eigenbasis exists or fails. | Bounded real 2×2 cases: distinct real eigenvalues, scalar matrix, defective repeated eigenvalue and rotation with no real eigenvectors. Include characteristic-polynomial and diagonalization lenses with stated applicability. Validate classification and residuals; no general eigensolver or invented real eigenvectors. Integrate questions/examples through loop 6's pattern only after the distinct caller justifies it. |
| **10. Make a Jacobian explain local behavior** | Move a base point, inspect its Jacobian, and compare a nonlinear map with its local linear approximation. | Affine and degree-at-most-two polynomial maps R2→R2, with explicit domain/codomain bases. Existing differentiation and map owners derive the matrix; Graph2D shows local deformation. Pressure singular points and approximation away from the base point. Reuse loop 8's coordinate discipline; no full multivariable CAS, Hessian suite or mandatory new 3D renderer. |
| **11. Turn explanations into returnable practice** | Create prediction/reveal and compare/contrast cards from selected concept views; return to the exact source after answering. | Matrix and projection callers, then a selected accepted eigen example. Card-local response/playback is distinct from shared source content. Show publication revision changes and preserve old attempts/context. Reuse existing return/player seams; no scheduling engine, grading model or retention claim. |
| **12. Prove the authoring library with a connected reference** | Author a compact “what a linear map preserves and destroys” reference with linked explanations, questions and a useful detour. | Assemble accepted hosts/cards through supported references rather than a hidden mixed-book migration. Author one fresh example and revise it substantively in chat; export/reopen, dependency update and exact return must work without new renderer/host code. Measure time to useful result, interventions, initial/complete payload and mounted-player lifetimes. Human judgment selects explanatory quality; learner transfer remains separate. |

## Dependencies, reviews and preservation

Loops 1–3 are the recommended first tranche. Loop 4 pressures portability before
generic reuse promotion; 5–6 establish useful semantic relationships using existing
families. Loop 7 can use current matrix truth while 8 establishes the coordinate
discipline needed by 9–10. Loop 9 depends on 7–8 and selected concept packaging;
10 depends on 8 and existing differentiation, not on an eigen implementation.
Loop 11 can start with accepted matrix/projection sources before eigen material
is admitted. Loop 12 combines only accepted results.

Canonical first artifact: a saved `MatrixVectorDocument` in
`/experiments/fraction-notebook/?notebook=matrix`; second insertion caller:
the existing quadratic notebook. Existing domain evaluators and resource IDs
remain the semantic truth; KaTeX and the accepted Graph2D/column players own paint
and time. The existing reference index at `/experiments/math-reference/` supplies
the first search corpus. Search and insertion must not invent a preview framework.
Later visible loops must name their exact artifact, host and renderer at admission.

First visual gate: search an accepted explanation, insert a new supported object
and open its native view. Review whether the results and typed slots are useful
before generalizing that interaction. Second gate: inspect a genuine numerical
chat revision. Each new mathematical treatment retains a canonical exemplar
review before a second caller and promotion; batch independent judgments, not
routine internal checkpoints. Test semantic laws, native endpoints and lifecycle
first; reserve broad browser/resource certification for accepted promotion.

Preserve current fractions and scrolling, typography/themes, Vim/row semantics,
stored UUIDs, Copy/Derive/Transclude distinctions, native undo and the shared chat.
Keep visible draft evaluation separate from published dependency updates. Do not
replace domain ASTs, introduce universal attention state or assume one WebGL
context/iframe is the architecture. Each capability/host adapter and each new
visual treatment is its own reversible unit; a visual rollback retains source data.

## Proposed execution boundary

This is twelve outcome loops, not twelve equal tasks or one overnight promise.
Loops 9–10 carry the largest domain risk and may require several bounded runs.
Recommended approval: loops 1–3 first, six-hour ceiling with the final hour for
verification, checkpoint and review. That ceiling does not promise all three
will complete; record the exact remaining gate if it is reached. No minimum
runtime and no filler work. Reassess after 3 and 6 using actual authoring cost.

First-tranche verification: metadata/search and applicability laws; real native
history/persistence tests for matrix and quadratic insertion; stale/invalid/cancel
proposal tests; affected types and architecture; complete notebook/reader payload
measurements; one canonical smoke during discovery, then Chromium/Firefox and
390px preservation after acceptance. Later mathematical loops add their domain
laws and supported degeneracies before visual promotion. No gate may be waived.

Routine engineering-budget repairs and observed blockers stay within approved
scope. Stop for completion, required judgment, resource ceiling, user pause or
unresolved authority/external constraints. Create the next Theseus contract only
after approval, with explicit run mode, ceiling, cadence, verification and stop
conditions; the generic planner currently still points at an older deferred
authoring-to-practice run and must not silently resume it.

Actual model calls remain separately bounded: prepare the loop-3 request and
review its scope before authorizing a turn; do likewise for the final trial.
The previous one-turn allowance is exhausted. Automated fixtures may test the
protocol but cannot close those actual-response gates. No new inference is
authorized by this proposal.

Parallel work is possible after shared interfaces are agreed: interaction can own
search/insertion, mathematics own admitted operations, and player own bounded
views. A future worker packet must assign distinct worktrees, paths and one
integrator; this planning request launches no agents. Cloud sync, broad Vim parity,
general MCP hosting, arbitrary CAS/intersections, general complex arithmetic,
PageRank/Markov lessons, whole-book loading and public deployment remain later.
The broader [mathematical programme](../2026-11-25-mathematical-authoring-programme.md)
is retained; this successor selects a finite route through part of it.

## Closure and provenance

The user says “it is great! Propose the next 12 loops,” accepting the
[studio finish](2026-11-27-studio-finish-review.md). Its five execution packages
and the original twelve bounded outcomes are complete. That is not acceptance
of this new proposal, arbitrary mathematical support or measured learning gains.
The earlier [next-step review](2026-11-27-next-step-review.md) is completed
provenance; rejected scrolling/window treatments and unrelated contracts remain
parked. Current strategy is unchanged. No product implementation changes here.
