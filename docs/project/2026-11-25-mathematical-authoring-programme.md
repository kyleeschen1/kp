# Discoverable mathematical objects and major animations

Date: 2026-11-25
Status: M0 quadratic exemplar approved; remaining programme is proposed
Source: the user's mathematical-object, autocomplete, multiplication and linear-algebra discussion
Inspection basis: product worktree at `8143b42594108ce0d1dde672480d1c47f4549558`
Companion: [Vim and semantic-command design](2026-11-25-vim-semantic-command-design.md)

## M0 implementation approval

The user says "please do it for me" after the saved quadratic workflow was
recommended following acceptance of the workspace frame. Execute M0 only through
`run-contract.kp.quadratic-authoring-20261125`; M1 and the remaining portfolio
retain their gates. Two recoverable packages cover the resource/operation boundary
and its integrated notebook exemplar. Six hours is the ceiling, with the final
ninety minutes reserved for verification and closeout; stop at G1 visual review.

Canonical artifact: a selected mathematical notebook fixture in the existing
`/experiments/fraction-notebook/?notebook=quadratic` workspace. The existing
expression/differentiation and semantic-state graph/cache owners supply truth;
KaTeX and the existing Graph2D scene/SVG path supply representations. The graph's
2D paint entry must stay independent of 3D imports. No hardcoded quadratic
branching presentation is treated as an arbitrary polynomial renderer.

Preserve fraction drafts and their native reader, chat sessions/composer history,
fixed split, accepted frame, modal command ownership, and distinct copy/derive/
transclude semantics. Use explicit resource UUIDs, registered versioned recipes
and occurrence references. Narrow optional document data and a selected-fixture
adapter avoid migrating the existing fraction source. Rollback units are the
resource adapter with its tests and the integrated exemplar with its fixtures,
commands and preservation evidence. No shared visual promotion before G1.

The earlier row-picker commitment below describes the inspection date. The frame
is now accepted; this explicit M0 successor owns current execution. The tabled
matrix Pour treatment and historical runs remain unaccepted and unresumed.

## 1. Outcome and finite finish line

An author can create supported mathematical objects, discover applicable
operations through autocomplete, construct related objects, and compose linked
symbolic/2D/3D explanations. Changing a source updates its declared dependents;
identity, links, local overrides and explanation context survive save/reload.
The same validated operation is callable from the UI and a headless authoring
adapter. Concept recipes expand into ordinary domain-owned objects and relations.

The proposed programme finishes when the 24 named outcomes in section 5 work
through the product for their declared families, their representative visuals
are accepted, a structurally different caller exercises each promoted mechanism,
and the preservation/performance gates pass. Reusing existing accepted work counts;
an inventory entry, standalone fixture, catalogue thumbnail or passing parse alone
does not. This is a finite supported workbench, not arbitrary computer algebra.

Every outcome must state separately: mathematical support, available view,
animation support, authoring discoverability, persistence/reuse, and human review.
Do not collapse these into one supported flag or claim learning effectiveness.

## 2. Direction, predecessors and execution authority

The user requested planning, preceded by Vim documentation/review. The accepted
Vim priority is a conventional core plus semantic commands, with remaining parity
gaps visible. Copy, Derive and Transclude are accepted as distinct operations.
This programme does not require completing Vim, a universal editor,
all keymap customization, or a general knowledge graph first.

The current [roadmap](roadmap.md) commitment remains the checked row-picker
candidate and its open review. The [promotion ledger](threads/animation-library-promotion.md)
retains its earlier ordering and the tabled matrix-to-linear-map treatment. This
proposal recommends a new authoring-led portfolio that includes LA; accepting it
must explicitly record the changed priority and disposition of those older ranks.
Do not silently mark the old matrix Pour treatment accepted or resume its deferred
slices. The accepted authoring-to-practice direction remains the product rationale.

One human-readable proposal lives here. After scope approval, one correctly
configured Theseus contract owns package order, status, receipts and evidence.
No duplicate phase-plan tree or progress table belongs in another document.
Before starting, bind the exact new contract explicitly: the November 25 generic
`theseus plan run` inspection selected an older authoring-to-practice contract
and reported metadata/source/done-contract hygiene gaps. This is a planning
finding, not authorization to resume or repair every historical run.

## 3. Inspected foundations and actual gaps

| Responsibility | Existing owner/evidence | Reuse and missing work |
| --- | --- | --- |
| Expressions, evaluation, differentiation | `src/math/expression.ts`; `typed-semantic-math.ts` | Preserve the bounded language; real-number evaluation is not complex arithmetic or arbitrary CAS |
| Spaces, bases, linear maps | `src/math/algebra/`; two-basis pressure test | Preserve map vs matrix representation and explicit coordinate authority |
| Mathematical metadata | `src/math/authoring/construct-descriptor.ts`; generated construct plumbing | Jacobian/Hessian metadata exists; it is not connected to the current picker |
| Persistent identity and selected edits | `src/math/typed-math-state-value.ts`, `typed-math-state-optics.ts`; `src/semantic-state/` | Reuse immutable versions, pins, selected rewrites and callable/data separation |
| Dependencies and cache | `src/semantic-state/derived-graph.ts`, `derived-evaluator.ts`, `derived-cache.ts` | Existing requested-chain recomputation; integrate notebook references, do not make another reactive store |
| Reusable notebook resources | `src/notebook/model.ts`, `resolve.ts` | UUIDs, lexical bindings, imports, cycles and signatures are proved for bounded matrix scenes |
| Rich authoring host | `src/fraction-notebook/` | Strong editor/workspace foundations; current schema and compiler remain fraction-specific |
| Commands and rows | `src/editor-commands/registry.ts`; `src/editor-rows/` | Preserve captured targets and disposal; add mathematical providers and domain validation |
| Symbolic/graph correspondence | `src/projections/quadratic-equation-graph-sync.ts` | Existing shared-clock/root correspondences; general source-driven authoring is additional work |
| Graph2D/Graph3D | `src/semantic/graph.ts`; graph scene/runtime/adapters | Preserve explicit/parametric distinctions; current governed generation examples are tightly pinned |
| Multiplication/LA | `src/math/matrix-product.ts`; matrix-column authoring; polynomial collection; dot projection | Adopt existing semantic/provenance and accepted visuals; do not infer all shapes are rendered because math supports them |
| Algebra/calculus sources | `author:check`; composed algebra; change propagation | Reuse each domain's checker and canonical mount; preserve bounded support and unaccepted aesthetics |

The immediately preceding inspection ran 97 focused tests across math, basis
projection, command/row handling, notebook references, shared equation/graph
playback, typed persistence and derived evaluation. All passed. No browser,
full-repository type or release certification was run for that assessment.

Current executable discovery: `npm run author:check -- --list`. It exposes
bounded matrix columns, change propagation, fraction/algebra, selected reasoning,
and graph callers with distinct check/apply/export limits. Preserve those limits.
Use [the generation entrypoint](authoring/llm-generation-entrypoint.md),
[concise domain APIs](authoring/concise-domain-api.md),
[calculus source packet](authoring/calculus-change-packet.md), and
[matrix source packet](authoring/matrix-column-authoring-packet.md).

## 4. Contracts to establish through the first two callers

### Resource and authority

- Notebook content references a mathematical resource; it does not embed a second
  evaluator or make rendered text the source of truth. Map persistent notebook
  UUIDs to existing semantic entity/version identities explicitly.
- Keep source resource, derivation, and view occurrence identities separate.
  Reordering/renaming prose cannot rename the mathematics. Copy, derive, transclude
  and move have distinct semantics as recorded in the Vim design.
- Store expression/object data, operation/version, inputs, arguments, assumptions,
  basis/coordinate/field information and provenance. Rehydrate executable behavior
  through registered capabilities; never serialize closures or evaluate JSON code.
- Resolve bindings before rendering. A derivative, tangent, root or matrix
  representation is created by its domain owner. A view cannot claim mathematical
  validity by supplying its own coordinates, labels or replacement answers.
- Preserve existing domain ASTs and exact-operation authorities. Use narrow adapters
  between them, with declared losses/unsupported cases. No universal replacement AST.

### Discovery and invocation

- Extend existing construct/operation metadata with applicability, typed arguments,
  output kinds, requirements, examples, cost class and capability/version references.
- Query results distinguish ready, needs input, unsupported and unavailable owner.
  Missing basis, field, interval or second object is shown as a meaningful prompt.
- Rows display the result; the command owner revalidates the captured resource and
  revision at execution. Command lists and search do not run mathematical solvers.
- UI, source checker and future LLM/MCP adapter invoke the same operation contract.
  No remote MCP service or paid model execution is required by this proposal.
- Search a metadata index; load the selected solver/renderer lazily. Existing
  generated metadata and command registries remain the starting owners.

### Derived state and edits

- Source edits use validated transactions and existing revision checks. An invalid
  draft retains the last valid mathematical result and the user's draft.
- Use existing dependency declarations and caches; one source revision computes
  a requested result once per applicable cache owner, then views reuse it.
- Distinguish visible draft previews from committed versions. Save may run broader
  dependency checks; offscreen work need not run on every keystroke.
- During parameter dragging, replace obsolete pending work; commit the intended
  edit with one defined undo boundary. Late results cannot replace newer state.
- Loading/importing restores declared versions, bindings and ownership. A missing
  recipe/version or deleted input is a repair gap, not a silently detached result.
- Closeout must exercise two saved notebooks, explicit live versus pinned imports,
  local overrides and a changed shared source. Respect source ownership across
  notebooks; do not bypass semantic namespace checks to make imports appear to work.

### Views and animation

- KaTeX owns symbolic typography; the existing 2D and 3D adapters own their paint.
  Domain values and semantic frames feed all views. One animation uses the existing
  clock/seek/reverse model. A new graph is not a new animation system.
- Every selectable feature maps back to a semantic object/member/relationship.
  DOM order, sampled vertex index and numerical coordinate equality are not identity.
- Viewport, camera, theme and sampling policy are view concerns. Sampling is an
  approximation of source mathematics with declared domain and accuracy.
- For 3D, retain the WebGL mesh owner and native label/overlay adapters. Theme roles
  and semantic correspondence provide consistency across media.
- Concept imports expand selected constructions, questions and explanation refs;
  retain recipe provenance. Live parameters still need emitted dependencies and
  evaluators after authoring expansion.

## 5. Proposed mathematical and visual coverage

These are programme outcome IDs, not existing runtime operation IDs. Each row
requires authoring discovery, linked representations, a meaningful manipulation,
save/reload, an inspectable relationship, a representative animation and pressure
cases. Promote only the support actually implemented and reviewed.

| ID | Author/learner question and major animation | Initial supported objects; mandatory contrasting case |
| --- | --- | --- |
| S01 | How does multiplication distribute over parts? Expand and collect linked contributions. | Real scalars and bounded polynomial products; positive, negative and zero factors |
| S02 | How is a polynomial a vector in a chosen basis? Reassemble terms from coordinates. | Univariate degree 0–4; ordered monomial basis, reordered basis, dimension above three requires an explicit view |
| S03 | What does a coefficient change do to the graph? Keep equation and curve linked. | Linear/quadratic real functions; degree reduction, flat/constant and sign reversal |
| S04 | Why do expanded, factored and vertex forms agree? Animate verified rewrites with graph agreement. | Supported quadratic rewrites; nonfactorable-over-reals and repeated-root cases |
| S05 | Where do roots go when the discriminant changes? Follow real and complex views. | Quadratics with real coefficients; two real, repeated, conjugate-complex roots; linear/constant degeneration |
| S06 | What does cancellation preserve, and what remains excluded? Preserve the hole. | Common-factor cancellation in supported factorizations; removable hole, pole and interval crossing; no arbitrary rational simplifier |
| C01 | How does a secant become a tangent? Link local slope and derivative. | Supported differentiable real expressions; zero slope, negative increment, singular/undefined requests |
| C02 | How does accumulation become an integral? Compare signed and geometric area. | Polynomial antiderivatives plus explicit bounded numerical mode where admitted; reversed bounds and sign changes |
| C03 | How do local changes compose? Connect the chain rule to finite changes. | Existing bounded change-propagation functions; stationary point and two reversals |
| V01 | How do vectors add and scale? Follow head-to-tail and coordinate contributions. | R2/R3 vectors; zero, negative scale, cancellation and dependent vectors |
| V02 | What do inner product, projection, angle and norm measure? | Euclidean R2/R3 with declared metric; orthogonal/antiparallel and zero-vector undefined cases |
| L01 | Why are matrix columns the images of basis vectors? Connect row sums, columns and transformed vectors. | Real 2x2 initially, then a rectangular caller; singular and signed inputs |
| L02 | Why is matrix multiplication composition? Compare ordered transformations. | Compatible real matrices; noncommuting pair and dimension mismatch |
| L03 | What changes under a change of basis? Keep the map fixed while coordinates change. | Invertible bases in R2, then R3; nonorthogonal and invalid/dependent basis |
| L04 | What do determinant, rank and inverse tell us geometrically? | Real 2x2 then selected 3x3; orientation reversal, singular collapse and near-singular numerical warning |
| L05 | How do row operations change a system without losing its solution set? | Existing exact row-operation owners; unique, redundant and inconsistent systems |
| L06 | When does an eigenbasis exist, and what does diagonalization explain? | Real 2x2; distinct eigenvalues, scalar identity, defective Jordan block and rotation with no real eigenvectors |
| T01 | How does the unit circle produce sine and cosine? | Real angle with Cartesian/polar and function views; quadrants, wrapping and zero |
| T02 | Why do angle-addition identities hold? Link rotation/composition to symbolic identity. | Sine/cosine addition; negative and special angles; identity requires symbolic authority, not sampled agreement |
| T03 | How do Cartesian, polar and parametric descriptions refer to one curve? | Circle, ellipse and bounded spiral/parametric examples; origin ambiguity, periodicity and zero speed |
| G01 | How do conics intersect, and where are their tangents? | Registered circle/ellipse/parabola/hyperbola families; line-conic and circle-circle intersections initially; tangent, absent, repeated and degenerate cases |
| G02 | How do parametric curves move through 3D? | Line, circle and helix families; parameter interval/orientation and stationary points |
| G03 | How do surfaces relate to slices, contours, tangent planes and normals? | Explicit plane/paraboloid/saddle plus bounded parametric sphere; seams, regularity and grazing slices |
| D01 | How do Jacobian, gradient, Hessian and Laplacian connect local algebra and geometry? | Supported smooth two-variable functions/maps; explicit bases/Euclidean metric, saddle, flat and degenerate cases |

Numerical support is an explicit contract, not merely a display format. The pilot
must declare coefficient magnitude/degree/domain limits before accepting inputs.
Use existing exact rational authorities for exact claims; floating-point results
carry approximation/tolerance metadata. Initial exact root support stops at degree
two. Higher-degree root isolation and general complex-function visualization are
later capabilities unless explicitly added after review.

Complex numbers are a new scalar-domain integration in the inspected authoring
path. A pair used as a complex number, a 2D vector and a rotation/scaling operator
has related but distinct contracts. A polynomial has no universal unlabelled cast
to one complex number. Coefficients, roots and evaluation are named constructions.

Finite sampling cannot prove all roots/intersections or identities. General
implicit equations, arbitrary discontinuous functions and arbitrary 3D intersections
remain outside this first programme. Conic and surface support above must use the
declared families and valid algorithms, returning gaps outside their limits.

Question-oriented concept imports, examples/counterexamples, linked reference
material and compare/contrast cards are retained design goals. Markov/PageRank,
general matrix decompositions, arbitrary eigenproblems, full CAS/theorem proving
and a broad curriculum remain follow-on scope, not hidden completion obligations.

## 6. Ordered work packages and dependencies

This table is a proposed dependency/order map, not live status. Each package ends
with working user-visible capability, its checks and a recoverable commit.

| Package | Outcome and scope | Depends on | Review/finish |
| --- | --- | --- | --- |
| V0: conventional editing core | Finite prose operator/count/text-object foundation; discoverable semantic commands coexist with native source editing | Approved Vim scope | Separate interaction exemplar; no exhaustive parity campaign |
| M0: complete quadratic loop | Saved source → applicable commands → equation/graph/derivative/tangent; S03/C01 first caller | Scope approval; existing commands suffice | G1: inspect changing c and moving the tangent point, then reload |
| M1: structurally different caller | V01/L01 through the same resource/discovery/persistence boundary; adopt accepted matrix-column semantics/presentation | G1 acceptance | G2: matrix changes affect only linked views; then promote demonstrated common adapters |
| M2: algebra and polynomial representations | S01/S02/S04/S06/C03; connect checked symbolic rewrites, coefficients and graphs | M1 contracts; existing domain authorities | Group algebra/collection review; domain restrictions remain visible |
| M3: linear-algebra relationships | V02/L02/L03/L04/L05; reuse dot projection, matrix and row-operation work | M1; typed space/basis support | Geometry/algebra agreement and distinct-caller review for new motifs |
| M4: complex, trig and eigen connections | S05/T01/T02/T03/L06; add complex domain before claiming complex roots/rotation | M2 and M3 relevant prerequisites | Review root topology, circle/rotation and eigen counterexamples |
| M5: areas and conic geometry | C02/G01; exact vs approximate accumulation, bounded conic relations | M2; graph/domain admission | Review signed area and tangent/intersection degeneracies |
| M6: 3D and local multivariable behavior | G02/G03/D01; shared symbolic truth with meshes, normals and local maps | M1 contracts, M3 basis/maps, M5 relevant geometry | One 3D exemplar first, then different surface/curve caller |
| M7: reusable programme closeout | All declared outcomes discoverable, saved/importable, measured and documented; author creates a new explanation without bespoke host code | All accepted required families | Exact release matrix, source-only transfer and consolidated review packet |

V0 is not a prerequisite for mathematical compilation or rendering. Its proposed
finite core is counts plus `d/c/y` with a bounded conventional motion/object set,
Visual operations, text registers/paste, undo, cancellation and repeat semantics
as explicitly admitted. Prose/native-source ownership and Unicode boundaries are
mandatory. The exact initial motion set and whether dot repeat joins that tranche
must be fixed in its reviewed contract. Full Ex, macros, customizable state hooks,
all profiles, surround and every semantic text object remain a separate backlog.
Semantic commands can initially use M-x without waiting for new key spellings.

M1 proves the R2 vector/matrix caller first. R3 extensions of V01/L03/L04 close
with M6's spatial adapters; a row is not complete because its first 2D instance
works. General conic-conic intersection is not implied by G01. Track these
dependencies explicitly in the eventual run contract.

### M0 detailed action sequence

1. Capture the existing fraction notebook and selected graph/symbolic baselines.
   Name the exact reference artifact, renderer and admitted mathematical family.
2. Define one persistent quadratic resource and typed derive/view requests using
   existing math/state ownership. Establish UUID/version/occurrence mapping and
   registered recipe restoration. No broad schema migration before a caller works.
3. Add a narrow notebook adapter and source fixture. Existing fraction drafts,
   chat histories, commands and accepted reading remain intact.
4. Project applicable operations into the existing row/command interface. Choose
   graph, derivative and tangent; prompt only for missing meaningful parameters.
5. Bind the existing symbolic/Graph2D paths through typed adapters. Route selected
   features to semantic references. Use one parameter source and existing clocks.
6. Exercise coefficient edits, tangent motion, invalid drafts, stale commands,
   independent view settings, save/reload, a second occurrence and cancellation.
7. Measure the complete editor/reader import and runtime cost. Prepare one working
   URL with before/after checkpoints and ask for G1 visual/interaction judgment.

Expected owners: `src/math/authoring/`, `src/semantic-state/`, `src/notebook/`,
`src/fraction-notebook/`, `src/editor-commands/`, and existing graph/native-KaTeX
adapter boundaries. Introduce only the adapters/metadata needed by this caller.
Source fixture location proposed: `content/notebooks/math-object-exemplar.json`;
its exact format must be owned by the adapter, not invented in this plan as proof.

Canonical candidate host is the existing notebook workspace at
`http://127.0.0.1:8000/experiments/fraction-notebook/`, with an explicitly selected
math fixture. The fixture selector and mathematical workflow do not exist yet;
do not present this URL as evidence that the proposed feature already works.
Reuse that host rather than cloning its editor into a second application.

For M1, the accepted numeric column-combination host is
`/experiments/matrix-column-combinations/`. For C03, inspect
`/experiments/change-propagation/`; its presentation remains unaccepted. Existing
dot projection and saddle assets use their registered Catalogue adapters. Resolve
and record their canonical routes before mounting; matching asset IDs alone do
not establish canonical behavior.

## 7. Verification and evidence requirements

### Mathematical and semantic gates

- Each operation has declared input/output contracts, preconditions, failure
  diagnostics and at least one independent oracle or exact identity check.
- Pressure properties include evaluation before/after equivalent rewrites;
  polynomial reconstruction from coefficients; basis round trips; matrix
  composition and shape; derivative agreement on supported analytic cases;
  signed-integral orientation; dot/projection identities; complex magnitude/angle
  laws; conic residuals; tangent orthogonality and surface-normal consistency.
- Numeric finite differences or sampled residuals are diagnostic evidence within
  stated tolerances, not proofs of arbitrary symbolic equivalence.
- Boundary cohorts include zero/constant/negative, degeneracy, singularity,
  repeated roots, coalescing/splitting features, field restrictions, invalid
  dimensions, absent bases, extreme admitted scales and unsupported input.
- IDs, member references, provenance and source versions survive round trips.
  Moves preserve identity; copies/derivations/occurrences follow their distinct
  contracts. Root ordering changes must not silently relabel annotations.

### Product and lifecycle gates

- A user can create/select the resource, discover the operation, supply inputs,
  inspect the relationship, edit, undo, save, reload and reuse it in another
  occurrence without repository edits for an ordinary supported variant.
- Test invalid/stale drafts, deletion, cyclic references, import boundaries,
  interrupted previews, newer edits overtaking older results, failed mounts,
  disposal, WebGL loss/release where relevant and closed command owners.
- Changing prose or a camera cannot recompute/reidentify unrelated mathematics.
  Editing one source invalidates exactly its declared affected computations.
- Direct seek, rewind, arbitrary jumps and interrupted parameter edits reach
  the same semantic endpoints. Renderer disposal releases owned resources.
- Transcript authority, composer focus/history and existing notebook drafts
  remain preserved. Mathematical operation execution never depends on DOM focus
  after a picker opens.

### Visual, accessibility and promotion gates

- During discovery, run semantic/lifecycle tests and one Chromium exemplar smoke;
  human review chooses choreography, emphasis, spacing and interaction.
- Before promotion, exercise a structurally different caller and the actual
  compositor mechanism. Inventory, successful KaTeX parsing or synthetic laws
  alone do not certify paint continuity or exclusive ownership.
- Then test the supported browser cohort, light/dark themes, desktop/narrow
  widths, keyboard interaction, reduced motion and accessible static truth.
- Browser checks live in committed scope-specific scripts/tests with stable npm
  commands. Add new commands only when their implementation exists; do not cite
  a proposed command as completed evidence.
- Each review packet gives exact source revision, working route, action/playhead,
  visible result to judge, automated facts and remaining subjective questions.

### Performance gates

Preserve current executable budgets. Establish a repeatable baseline in M0 before
expanding support: declared machine/browser, fixture sizes, cold vs warm state,
sample counts and full consumer closures. Report percentiles and allocation/cache
behavior rather than one favorable timing.

Proposed initial targets, to validate against that baseline: warm completion p95
under 50 ms over 5,000 metadata records, with at most five mounted result rows;
ordinary quadratic/tangent draft-to-visible p95 under 250 ms; parameter playback
p95 frame interval under 33 ms on the declared desktop fixture. These are proposal
targets, not measured promises. Define the narrow/mobile cohort before promotion.
Long computations must be cancellable and must not block editing.

Text-only consumers must not acquire a 3D renderer or the whole math catalogue.
Compare complete bundle/import/type-check cost before and after. Caches require
explicit owner lifetime and bounded retention under repeated edits. Offscreen
work and cross-notebook indexing require their own measured limits; do not claim
whole-book scalability from the small exemplar.

## 8. Review cadence, rollback and delivery limits

Before implementation, approve the finite portfolio and first package. Recommended
first run: M0 only, six-hour ceiling, final quarter reserved for checks, review
packet and backup. This is a ceiling, not an estimate or promise of completion.
Use its measured effort and M1's reuse cost to estimate the remaining programme;
do not extrapolate an honest whole-programme completion date from file counts.

After an exemplar is accepted, continue the rest of its approved package without
routine phase confirmations. Batch independent visual questions; retain required
prerequisite reviews. Expanding an admitted mathematical family or changing a
semantic convention requires a documented scope amendment, not a hidden fallback.

Rollback units are: each resource/command adapter with its fixture and tests;
each domain capability and its typed metadata; each new visual mechanism with
its exemplar and evidence. Preserve accepted predecessor assets/hosts until their
replacement is checked and accepted. Do not roll back mathematical contracts to
undo a visual treatment. Promote shared mechanisms only after two callers justify
them; remove superseded duplicate paths within the same controlled migration.

Commit coherent implementation/evidence slices and back up the current feature
branch under the standing policy. Parallel implementation is optional and requires
explicit worker ownership, separate worktrees and one shared-contract integrator;
this proposal does not request or launch agents.

Stop for the approved package finish, required visual judgment, user pause,
resource ceiling, or an unresolved authority/external blocker. Record partial work
truthfully. Repairable verification failures and engineering-budget repairs remain
work within the approved boundary; never waive checks or silently refresh ceilings.
No external publication, deployment, paid model calls or general shell/MCP
execution is included.

## 9. Risks and evidence needed to resolve them

| Risk | Early evidence and owning boundary | Required response |
| --- | --- | --- |
| A second mathematical model appears in the editor | Trace one parameter from saved resource through operation to both views | Repair the adapter; retain domain-owned truth |
| Examples work but ordinary variants need custom engineering | M1 reuse and an independently authored supported source through the same API | Bound and remove the demonstrated integration obstacle before family expansion |
| Numerical pictures imply stronger mathematical claims | Tangencies, poles, repeated roots and independent exact/residual checks | Admit only the verified algorithm/domain; expose approximation or a gap |
| A cached result or key command acts on the wrong revision | Interrupted preview, stale target and cross-notebook tests | Reject stale work at the owner boundary; retain the draft and last valid result |
| Root/member identity silently changes at degeneration | Coalescence/split/reorder fixtures with annotations | Use explicit correspondence/topology events; do not label by array position |
| 3D or discovery eagerly loads the whole catalogue | Complete cold/warm consumer measurements and module closure | Repair lazy ownership before promotion; keep existing budget gates |
| Infrastructure indefinitely delays visible mathematical work | G1's complete editable quadratic and explicit package ceiling | Close or report the bounded pilot; do not replace it with a framework campaign |
| Old run/promotion state is mistaken for new authorization | Exact contract and accepted scope links at run start | Record the chosen successor and preserved predecessor; never resume by inference |

## 10. Review decisions still needed

The Vim priority and distinct copy/derive/transclude semantics are accepted.
These mathematical defaults remain proposed except item 2:

1. Adopt the 24-outcome portfolio and its explicit supported-family limits, with
   M0/M1 proving clean composition before broader family implementation.
2. **Accepted:** keep ordinary copies independent; make derivation/transclusion explicit.
3. Separate exact mathematics, approximate computation and display sampling.
4. Retain current canonical media/owners and accept each new visual mechanism
   through one exemplar before family rollout.
5. Treat complex, 3D and multivariable support as named deliveries, rather than
   claiming they follow automatically from the initial polynomial.

The next review should confirm the coverage table, required exclusions and first
visual proof. Approval should name the selected first package/ceiling; it need not
approve every later implementation detail. The user can revise this scope without
losing the recorded Vim vision or the existing accepted animation foundations.
