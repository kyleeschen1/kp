# Assessment: LaTeX to reusable mathematical explanations

Date: 2026-09-07
Status: PROPOSED implementation direction; accepted user goal is recorded separately
Inspected baseline: `3d25d4f3e`, clean working tree before these documentation edits

Subsequent instruction: [recommendations recorded; existing loop resumed](../decisions/2026-09-07-math-recommendations-and-loop-resumption.md).
The [reconciled horizon](2026-09-07-reconciled-authoring-loop-horizon.md) now owns
successor ordering. This assessment retains capability evidence and mathematical
scope, not an executable contract. Its paused-baseline descriptions are
historical; G3 is accepted and the existing loop is complete.

This is an independent source-and-test assessment, not a Theseus-generated
report card. It supplements the [composable explanation review](2026-09-07-composable-explanation-medium-next-step-review.md)
and the [accepted scope clarification](../decisions/2026-09-07-lower-undergraduate-math-authoring-horizon.md).
It is not another implementation contract or manually maintained slice queue.

## Executive assessment

- The vision is technically credible. Existing semantic identity, operation
  governance, deterministic playback, native rendering, and projection seams
  are useful foundations, not a disposable prototype.
- Ordered LaTeX authoring and constrained LLM operation selection already have
  implementations and passing tests. Building another compiler would repeat
  work; connecting and extending these paths is the next useful challenge.
- Coverage is narrow and uneven. A rendered formula, typed semantic object,
  verified operation, approved motion exemplar, and dependable authoring
  workflow are different accomplishments.
- The largest product gap is a low-friction round trip that preserves both the
  local mathematical reason and the larger purpose when an explanation is
  edited, expanded, extracted into a card, or published.
- Keep tax integration and Bayes as the accepted sequence, while making broad
  mathematical families an explicit continuing programme. Do not postpone all
  authoring utility until an entire undergraduate curriculum is supported.

## 1. What exists, and what that evidence actually means

| Category | Grade | Confidence | Evidence | Main risk | Next action |
|---|---|---|---|---|---|
| Bounded authoring architecture | B+ | High | Existing source binding, operation declarations, compiler recovery, deterministic sequence sampling | Several strong seams do not yet establish one easy product workflow | Exercise an end-to-end author task through existing owners |
| LaTeX/LLM sequence authoring | B- | High within tested scope | Request validation, constrained planner, governed source binding, exact checkpoint tests | Compiler acceptance is mistaken for arbitrary mathematical verification or native visual certification | Connect source edits, repairs, and one canonical Focus Card |
| Lower-undergraduate mathematical breadth | D | Medium | Calculus-oriented inventory and explicitly narrow case ledgers; no complete requested-curriculum denominator | Exemplar availability is mistaken for general family support | Define representative tasks and explicit supported subcases |
| Reusable explanatory projections | C | Medium | Four flashcard kinds, runtime-frame references, causal compression, bounded explanation/folding examples | Extraction loses prerequisites; temporal compression is mistaken for semantic summarization | Prove context-preserving extraction and return to the parent argument |
| Readiness reporting and diagnostics | C+ | High for inspected mismatch | Typed repair tests pass, but generated coverage misses real series/fraction authoring paths | Both undercounting implemented work and overstating broad-family maturity | Join executed evidence to exact existing capability requirements |

Grades describe readiness against this user's authoring goal, not unrelated
security, editor parity, or every repository subsystem. The breadth grade does
not mean that the existing exemplars are poor or that the project thesis failed.

### Existing sequence and LLM machinery

`src/authoring/compile-equation-transform-series.ts` validates ordered states,
normalizes endpoints, resolves adjacency intentions, validates governed
authoring, and compiles a deterministic runtime. Failed candidates retain the
previous valid candidate. `equation-series-runtime.ts` supplies ordered
checkpoints and history-independent forward, rewind, and seek sampling.

`compile-natural-language-equation-series.ts` already joins the planner to
deterministic source binding and compilation. The planner port exposes
registered operation IDs and bounded roles; it rejects invented authority and
presentation fields. Governed families require their source evidence outside
the model. This is real orchestration, not merely a future interface sketch.

However, the interfaces expect structured states/adjacencies and, for governed
families, supplied semantic sources. Their existence is not evidence that an
arbitrary pasted proof can be interpreted, justified, taught, and published.
Source search found callers in authoring/corpus/CLI code, not direct calls from
the editor or reader. That is integration evidence, not proof that no indirect
surface exists. The runtime inspected here produces plans and frames, not a
browser certification of every plan's native compositor path.

The typed LaTeX elaborator also has real scalar/vector/matrix foundations.
Its executed test elaborates a two-variable vector function and derives its
Jacobian. That is useful multivariable/linear-algebra groundwork, not evidence
of a general animated multivariable calculus course. Its declared symbols,
shape checks, and typed unsupported results should be preserved.

### Motif and mathematical-family coverage

The generated inventory currently reports 38 cross-domain entries: 11 Direct,
4 Registered, 8 Exemplar, and 15 Missing. Its 29 equation entries report
9 Direct, 3 Registered, 3 Exemplar, and 14 Missing. These numbers describe an
existing calculus-oriented capability taxonomy, not the user's whole horizon
and not a percentage of curriculum completion.

Named Direct entries include distribution, additive cancellation, function
wrapping, balanced operations, logarithmic/exponential transformations, roots,
and finite sum/product expansion. Each label must be read with its actual
case scope and evidence. Seven older Direct families have legacy case-coverage
exemptions; Direct does not establish every shape or mathematical subcase.

The differentiation case ledger makes the distinction concrete: `x^3 -> 3x^2`
has the verified exemplar; `x^5 -> 5x^4` is semantic-only; symbolic exponents,
negative powers, compound bases, and chain-rule cases have explicit gaps in
that ledger. The integration ledger similarly preserves one power-rule
exemplar while logarithmic, general-power, definite, substitution, accumulation,
and FTC cases remain gaps. Those are bounded visual-family ledgers, not a
claim that no other symbolic differentiation capability exists anywhere.

Missing-support diagnostics must not be presented as invalid mathematics.
For example, an unsupported `integral y^2 dx` input can be mathematically valid;
KP must distinguish its own scope limitation from a wrong derivation.

### Important reporting defect

The inventory still marks Ordered transform series and all four of its
requirements Missing, although the compiler, normalizer, runtime, and corpus
exist. Fraction-equivalence authoring likewise has a tested governed path while
its broad capability entry remains Missing.

The freshness check passes: the generated file matches its current generator.
This is therefore an evidence-wiring/scope mismatch, not simply an old file.
The compiler-evidence kind union and predicate inspected do not include
`series-runtime`; the coverage projection joins only declared exact evidence.
The complete series capability must not be blindly relabelled Direct, because
some planned obligations may still lack evidence. Reconcile each requirement,
preserve remaining gaps, and attach executable evidence at the right scope.

### Flashcards and compression are not greenfield work

`src/semantic/asset-flashcard.ts` defines cloze, explain-transform,
focus-relationship, and predict-next cards. `src/animation/flashcard-projection.ts`
binds these to semantic references and sampled runtime frames. Tests cover
references, masks, answers, and renderer data. The missing work is not a generic
flashcard schema: it is deriving a pedagogically useful card from an authored
argument, preserving necessary context and its link back to that argument.

`compressed-causal-chain.ts` retains ordered operations with minimum visible
durations. This is useful temporal compression, not a general ability to choose
which reasons an expert can omit or to preserve an argument's meaning when
extracting a standalone unit. The existing explanation spine and foldable
distribution templates are bounded starting points, not a universal grammar.

## 2. The product to build

The author should begin with familiar material: LaTeX states, prose, a target
reader, and the conceptual point. KP and the LLM collaborate on interpretation
and teaching choices; authors should not write token selectors, animation
coordinates, ownership transfers, or timing tracks for ordinary supported work.

The proposed workflow is:

```text
LaTeX chain + intended lesson + relevant context
  -> proposed steps, assumptions, justifications, and semantic correspondences
  -> domain checks and explicit repairs / unsupported results
  -> reviewed teaching beats using governed visual mechanisms
  -> canonical Focus Card + detailed reading + extracted retrieval cards
```

These are responsibilities to connect through current boundaries, not approval
for a new universal IR or six replacement subsystems. Human-readable source
must remain editable; generated material must retain source/revision links.
Compilation and semantic authoring remain on the authoring/build side of the
existing delivery boundary; do not import that machinery into ordinary reader
payloads to make the workflow look unified. Preserve current fixed budgets.

### LaTeX is the entry language, not the whole semantic contract

Adjacent displayed states do not uniquely determine the intended operation.
One printed line can hide several reasoning steps; several lines can express
one teachable idea. Propose intermediate states as reviewable source edits,
then validate them. Do not silently fabricate a route between endpoints.

Relations also matter: equality, implication, equivalence of solution sets,
approximation, definition, conditioning, and limiting statements are not the
same thing. Track only the distinctions needed by the current family, using
domain-owned operations and explicit contracts, rather than designing a
universal proof language before the second caller exists.

For example, `(x^2 - 1)/(x - 1) = x + 1` needs `x != 1`. Cancelling ink must
not erase that domain restriction. Matrix factor order, bound-variable scope,
nonzero conditioning probabilities, and approximation error introduce other
family-specific obligations. Infer safe context where possible, show it
concisely, and ask only when an ambiguity changes meaning or the lesson.

This is not a limitation unique to KP: SymPy's official documentation explains
both [LaTeX ambiguity](https://docs.sympy.org/latest/modules/parsing.html) and
[assumption-dependent simplification](https://docs.sympy.org/latest/guides/assumptions.html).
A future CAS adapter may supply scoped checks, but adopting one does not solve
pedagogical intent, correspondence, or visual continuity. Numeric spot checks
can find counterexamples; they do not prove a general identity.

Distinguish domain-verified results under stated conditions from author-reviewed
assertions and unresolved obligations. An LLM-provided badge or a well-shaped
record is never itself mathematical evidence. Unverified prose may remain
ordinary identified draft content; it must not silently become a verified
operation or a fabricated fallback animation.

## 3. Build a vocabulary of mechanisms and rules, not one effect per formula

Keep three questions separate:

1. Mathematical operation: what changed, and under what conditions is it valid?
2. Teaching intention: why should this reader attend to this change now?
3. Visual mechanism: how do existing renderers show identity and change?

The following are planning clusters, not newly approved runtime types:

| Reusable mechanism cluster | Candidate uses | Boundary that must remain explicit |
|---|---|---|
| Preserve and transport a coherent object | Moving a factor, substitution of a compound expression, fraction chunks | Semantic entity/group identity and native paint ownership |
| Split or distribute | Algebraic distribution; terms introduced by a product rule | Different mathematical laws cannot be inferred from similar motion |
| Collect or factor | Like terms, common factors, collecting probability contributions | Which constituents justify the new grouping |
| Evaluate or eliminate | Arithmetic, identities, cancellation, bound evaluation | Evaluation versus rewriting; domain restrictions remain visible |
| Bind, instantiate, rewrite, reduce | Derivative/integral rules, indexed expressions | Variable scope, matching, capture avoidance, and assumptions |
| Balance or transform a relation | Solving equations or inequalities | Nonzero divisors, sign changes, extraneous solutions |
| Reorder or refactor a representation | Probability-tree flip, reindexing, matrix views | Preserved joint events; noncommutativity; no implied causal reversal |
| Accumulate, refine, approximate | Integrals, limits, Taylor expansions, sampling | Finite motion is not proof of convergence or an exact infinite process |

This approach can amortize renderer work, but it does not make every law one
existing animation. A new ownership topology, scope interaction, or domain
object may require a genuinely new mechanism. Probability conditioning and
matrix multiplication should not be forced through scalar rearrangement.

For each promoted family, retain a bounded support statement, semantic rule and
preconditions, correspondence contracts, executable canonical mechanism,
authoring recipe, negative cases, and reviewed teaching examples. Extend the
existing registries and maturity dimensions; do not add a competing registry.

Use the established cadence: durable truth and cheap smoke checks first; one
canonical Focus Card and human review for new visual language; one structurally
different caller; then mechanism-specific regressions and the broader browser
matrix at promotion. Already-certified mechanisms reuse evidence when their
coverage signatures match. Do not pay a new per-glyph certification tax.

## 4. Preserve local reasons and the whole argument

Good mathematical animation must expose three levels:

- Correspondence: where did this object go?
- Justification: why is this step valid?
- Strategy: why is this the useful next step toward the goal?

The current infrastructure is strongest on correspondence. Named operations
and semantic sources provide part of justification. The authoring experience
must make justification and strategy much easier to express and revisit.

An explanatory unit should carry the context needed to understand its boundary
claim: inputs, assumptions, conclusion, semantic references, supporting reasons,
and its place in the larger explanation. This is a proposed composition
boundary to prove with an exemplar, not a demand that every sentence become a
formal proposition or a new schema be imposed globally.

Flashcards should be selected by learning purpose, not by cutting an animation
at timestamps. A cancellation example could yield a next-step prediction, a
"why is this allowed?" card, and a domain-restriction counterexample. Necessary
assumptions must travel with the extracted prompt even when the answer is hidden.
Reusing a unit must not silently import incompatible assumptions or variables.

The user's gestalt/hermeneutic reading goal means navigating between a compact
view of the argument and its local reasons, then returning without losing the
larger goal or position. A short summary is insufficient if it changes the
claim; faster playback is insufficient if it still demands every local detail.
Compact and expanded views should preserve boundary claims and referents while
allowing genuinely different amounts of explanation.

Use one revisioned semantic source with several projections, not copied card
content. Shared Focus Card form remains centralized; static outputs acquire
updates through rebuilding. Source changes should identify affected references,
prompt answers, and authored prose for revalidation. Existing fact bindings
must not be marketed as automatic verification of arbitrary narration.

## 5. Proposed ordering

Scores are directional, 1 low to 5 high; Risk is cost/uncertainty, not benefit.

| Candidate | Authoring | Reliability | Reuse | Risk | Recommendation |
|---|---:|---:|---:|---:|---|
| Reconcile existing evidence and measure one authoring task | 5 | 5 | 4 | 1 | First bounded preparation after the existing checkpoint |
| Supported LaTeX chain to Focus Card, reason, and two projections | 5 | 4 | 5 | 3 | Next product proof; connect existing machinery |
| Bayes tree with shared equation/diagram meaning | 5 | 4 | 5 | 3 | Preserve accepted first-new-flagship choice |
| Expand high-reuse mathematical operation families | 4 | 4 | 5 | 3 | Continuing programme, task- and prerequisite-driven |
| Build every course motif before product integration | 2 | 2 | 3 | 5 | Reject this sequencing |
| Universal proof/CAS layer or renderer rewrite now | 2 | 2 | 2 | 5 | Defer; use scoped authorities and current owners |

### Immediate: finish the commitment, then establish a real denominator

The paused G3/code-card task still comes first when the user resumes. Do not
use this strategy document to accept it or restart execution.

For successor planning, reconcile evidence for already implemented paths and
choose a small set of real LaTeX authoring tasks. Start with approximately 24
representative chains spanning the requested domains, then refine the set after
measuring it. This proposed number is a scoping aid, not a certification matrix
or a representative statistical sample. Include supported positives, malformed
inputs, ambiguous steps, unmet assumptions, and unsupported-but-valid requests.

Track notation, semantics, rule authority, executable motion, family promotion,
governed generation, and authoring/publication integration separately. Existing
maturity dimensions cover much of this already. The corpus should reveal where
the pipeline breaks without demanding new visual implementations for every row.

### Next tranche: one useful end-to-end authoring task

Reuse the tax workflow and a short chain of already-supported equation
operations. Prove an author can edit source, understand a repair, preserve the
last valid preview, inspect a reason, and publish the same revision as a
canonical Focus Card, a compact reading, and at least two differently purposed
retrieval prompts. Keep focus on product integration, not a new editor platform.

The existing tax host is
`/experiments/kinetic-figure/supply-tax/`; its canonical artifact, exact authored
source, domain renderers, and clock owners remain authoritative. Before any
future visible change, name the exact artifact and source pins from the
existing checkpoint, observable acceptance, preserved behavior, and reversible
rollback unit. This assessment makes no visible change.

Do not insert an unrelated new flagship ahead of Bayes. This small supported
chain is an integration fixture within the tax-first workflow. Bayes then
pressures the same approach with the accepted tree construction/collapse/flip
pedagogy: alternative factorizations preserve joint-event identity; conditioning
changes the reference population, not historical causal direction. Develop
probability truth in its domain boundary, not a generic equation token model.

### Subsequent releases: expand by prerequisites and leverage

The clusters below specify scope, not a promise that whole courses ship in a
strict waterfall. Pull a bounded downstream caller forward when it usefully
pressures an existing mechanism, including the existing code/Graph2D/Graph3D
callers. Keep one approved execution queue and preserve family visual gates.

1. Algebra/precalculus substrate: coherent substitution, collection/factoring,
   fractions, exponents/logs, equation relations, inequalities, branches and
   restrictions, finite binders, and multiline continuity. These recur across
   every later cluster.
2. Trigonometry and core single-variable calculus: identities tied to their
   meaning, chain/product/quotient differentiation, definite/indefinite
   integration, substitution, accumulation and FTC. Distinguish procedure from
   geometric intuition and connect their semantic objects explicitly.
3. Calculus BC extensions: integration by parts and partial fractions,
   sequences/series, Taylor approximation and error, parametric/polar reasoning,
   and bounded differential-equation methods. Convergence and approximation
   require obligations beyond matching endpoint expressions.
4. Linear algebra: dimensioned products, row operations and equation systems,
   inverses, basis changes, projections, rank/null spaces, eigen reasoning.
   Reuse existing typed matrices and geometry; preserve operand order and shape.
5. Multivariable calculus: partials and gradients, Jacobian chain rule, local
   linearization, multiple integrals and changes of variables, vector fields,
   directional/line/surface reasoning. The existing Jacobian proof is a starting
   point, not a reason to skip new semantic or geometric cases.
6. Probability/statistics beyond the early Bayes flagship: joint/marginal/
   conditional probability, independence, counting, expectation and variance,
   transformations/standardization, sampling distributions and inference.
   Keep data, model assumptions, conditional statements, and inferential
   conclusions distinct; not everything is an algebraic equivalence.

For every family, choose a useful explanation plus a structurally different
caller, not dozens of spellings of one formula. Defer advanced theorem proving,
arbitrary special functions, and exhaustive textbook coverage until demanded.

## 6. How far away, and how to tell if we are advancing

A narrow version is an integration project on existing machinery. A dependable
standard-math authoring product is still a substantial development programme.
Uniform coverage across all the requested subjects is not the next long loop.

Provisional planning bands, assuming sustained engineering with AI assistance
and available human visual review: weeks for a narrow supported authoring pilot;
months for a dependable high-reuse core; multiple quarters for broad coverage
at consistent pedagogical and visual quality. These are low-confidence effort
bands, not measured forecasts or deadlines. Re-estimate after the first task
corpus and first integrated authoring round trip; staffing, requested polish,
and the frequency of genuinely new mechanisms materially change the result.

Do not report a completion percentage without a defined task denominator.
The missing work is a mixture of integration, new domain cases, new visual
mechanisms, and authoring design, not an unknown scientific impossibility.

Useful progress measures:

- From fresh source to first valid preview: elapsed author effort, manual
  annotations, implementation files touched, and repair turns.
- On held-out variants: correct operation selection, detected ambiguity,
  preserved assumptions, first-pass/one-repair yield, and zero silent fallback.
- For extraction: correct answers, necessary context retained, shared source
  revision, and return from the card/reason to the parent argument.
- For reuse: marginal renderer-specific work for the next structurally distinct
  caller, with performance and current type/payload budgets unchanged.
- For learning: can a reader predict, justify, and transfer the reasoning to a
  new example, both with and after removing the animation? A small observed
  study can guide design; a smooth animation alone is not evidence of learning.

The recommended immediate successor deliverable is therefore not another
isolated beautiful animation. It is a reproducible authoring task that uses
existing beautiful animation, exposes reasons, survives an edit, and produces
meaningfully different views of the same mathematical explanation.

## 7. Executed evidence and limitations

Fresh checks on the inspected baseline:

```sh
npm run check:animation-transformation-coverage
node --disable-warning=ExperimentalWarning --test tests/equation-series-runtime.test.ts tests/compile-natural-language-equation-series.test.ts tests/equation-series-fraction-equivalence-authoring.test.ts tests/equation-transform-series-corpus.test.ts tests/equation-series-natural-language-planner-port.test.ts tests/typed-latex-elaborator.test.ts tests/kp-animation-flashcard-projection.test.ts tests/kp-asset-flashcard.test.ts tests/compressed-causal-chain.test.ts
```

Results: coverage artifact current; **53 tests passed, zero failed**. These are
deterministic unit/integration checks, not fresh live-model reliability,
browser/compositor certification, accessibility review, or a learning study.
No full release suite, build, or browser matrix was rerun for this assessment.

Additional inspected sources include the operation-declaration and governed-
source registries, typed LaTeX elaborator, differentiation/integration case
ledgers, symbolic maturity/case-coverage files, coverage evidence collector,
generation entrypoint, roadmap, active thread, and accepted direction records.

The independent-review skill kept grades tied to inspected source and checks;
project memory separated the user's accepted goal from proposed implementation;
salience guidance kept mathematical truth, teaching intention, and renderer
treatment separate and preserved exemplar-first promotion. No runtime code,
rendering policy, Theseus execution state, or checkpoint approval changed.
