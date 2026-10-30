# Capture

Last Updated: 2026-10-30

Use this file for raw future project thoughts that are not yet processed into
roadmap items, decisions, or Theseus nodes.

## 2026-10-30: Antifragility as a workbench design requirement

Capture ID: `capture.kp.antifragile-workbench-20261030`
Status: user-stated quality requirement; mechanisms proposed, implementation unselected
Source: user asks for the system to be "remarkably anti-fragile"
Context: [independent workbench](#2026-10-30-consider-an-independent-workbench)

Interpret the requirement as contained failure, recoverable work, and durable
learning from failure. These are design goals, not demonstrated properties of
the present workbench. Rapid UI iteration and parallel development must coexist
with preservation of user work, exact references and mathematical authority.

Proposed implications to assess in the first bounded delivery:

- Preserve comments, attempts, decisions and their source revisions independently
  of experimental UI code. Distinguish pending changes from acknowledged saves;
  provide a tested recovery/export route and explicit schema migrations.
- Keep a working interface available while candidate versions are previewed.
  Limit failure to the responsible panel, preview or adapter where practicable;
  do not equate a UI error boundary with process or resource isolation.
- Use isolated worktrees and test data for parallel changes. Detect stale writes
  against an expected revision. Retry mutations only with an idempotency or
  reconciliation contract; a timeout does not prove an operation failed.
- Preserve old references when targets change. Report missing, stale or ambiguous
  anchors instead of silently attaching commentary to a different object.
- Capture bounded reproduction evidence: source revision, selection, action,
  relevant state and failure. Separate observation from LLM diagnosis. Repair
  the responsible boundary and retain an appropriate regression test or typed
  constraint rather than accumulating caller-specific exceptions.
- Exercise a few meaningful disruptions: unavailable adapter, interrupted save,
  stale revision and failing preview. Confirm recovery and exact-context return.
- Keep experiments reversible and promote only demonstrated reusable mechanisms.
  Learning may justify retiring an implementation or declining a feature.

Measure recovery effort, reproducibility, repeated failure classes and the number
of unrelated components touched by changes. Do not promise automatic improvement,
universal recovery, or a self-modifying agent with unrestricted authority. Avoid
turning every visual experiment into a full certification campaign; protect hard
invariants early and expand checks when a treatment earns promotion.

## 2026-10-30: Consider an independent workbench

Capture ID: `capture.kp.independent-workbench-20261030`
Status: strategic exploration; scope and priority not yet selected
Source: project conversation, 2026-10-30

The user explicitly requests preserving the
[architecture recommendations](reviews/2026-10-30-next-step-review.md), then asks
to consider creating the workbench independently before proceeding. The reason
is the expected compounding value of improving the UI and the tools used to
create UI with LLMs. The workbench may be enabling infrastructure for the whole
effort rather than a dashboard that must wait for KP architecture repair.

Reconsider the earlier deferral explicitly; do not treat it as a permanent
rejection. Equally, this discussion has not selected an independent application,
a repository split, a new implementation run, or a replacement product priority.

Questions to retain:

- Is the workbench for KP authoring/practice or for projects and personal
  thinking more generally? This scope is still open.
- Can its UI, styles, development loop and data ownership evolve independently
  while KP remains an integrated capability with a clear boundary?
- Does a separate application in the existing repository provide enough
  independence, or is a separate repository justified by broader use?
- What is the first complete joint-attention loop: identify an exact object or
  passage, discuss it with an LLM, inspect a proposed change, compare the result,
  and retain the observation and decision?
- How can existing artifact identity, review, GTD and Theseus authorities be
  integrated without duplicating their records or building a universal ontology?
- What observed reduction in authoring, context recovery or review effort would
  justify continued investment in the workbench itself?

The recursive improvement benefit is a product hypothesis to test through actual
use. These questions preserve the possibility without turning the full October
28 workbench intake into immediate implementation scope.

## 2026-10-30: Fraction tutorial criticism and anchored commentary

Status: user-requested capture; no implementation or queue change
Source: project conversation, 2026-10-30

### Fraction tutorial: content and choreography are poorly connected

Capture ID: `capture.kp.fraction-tutorial-content-20261030`
Artifact: `animation.fractional-linear.solve-x-over-2`
Reader route: `/reader/solve-fractional-linear/`

The user's assessment is that the fraction-equation tutorial's content is
"really bad" and "not interesting," and that its comments do not take advantage
of the choreography. Preserve both criticisms: weak instructional content and
weak coordination between commentary and the mathematical motion.

Earlier acceptance of the reader's appearance or interaction does not establish
approval of this tutorial's content or pedagogical value. Keep this criticism
retrievable when selecting exemplars or revisiting the tutorial; this capture
does not itself request a rewrite or undo accepted reader behavior.

### Anchored text: a leading portfolio idea

Capture ID: `capture.kp.anchored-commentary-immanence-20261030`

The user describes "user anchored texts" as "one of the best ideas in the
portfolio," followed by "a commentary of immenace."

Working interpretation, based on the preceding discussion: text anchored to
the objects or relationships it explains, with geometric proximity connecting
the commentary to its referent. The message can change when the object returns
in a new explanatory context. This is a strongly valued design direction, not
yet demonstrated learning efficacy or a requirement that all prose be anchored.

Provisional wording: **a commentary of immanence** — commentary situated with
and arising from the objects, relationships, and transformations under attention.
"Immanence" is the assistant's interpretation of "immenace"; retain the original
wording until the user confirms or corrects it.

## 2026-10-28: Shared workbench, experimental judgment and personal practice

Capture ID: `capture.kp.co-creative-workbench-20261028`
Status: user-requested direction and intake; delivery sequence being assessed
Active context: [co-creative practice](threads/co-creative-practice.md)

Preserve the full breadth of the request without turning every idea into an
active task. The user agrees with measuring and accelerating authoring iteration
and wants the following connected capabilities:

- Quantitative and qualitative experiment metadata: where time went, repeated
  aesthetic/UI concerns and their distinctions, and the narrative/pedagogical
  techniques or assumptions behind a design.
- An exposition practice loop inspired by Benjamin Franklin: study Grant
  Sanderson and textbook authors, analyze their choices, make original
  explanations, compare and revise until judgment improves.
- A sufficient dashboard for tutorial shortcomings, recurring patterns and
  project evolution across several dimensions; repeated and periodic reviews.
- Formal blockers whose impact and resolution can be revisited as work proceeds.
- Frictionless idea capture and regular processing: GTD, including next actions,
  waiting-for and someday material, without making every thought a commitment.
- Search across affordances, motifs, capabilities, examples and project evidence.
- Assess generative promise: central representations and investments that could
  unlock other capabilities, with reasons and evidence.
- Rapid modification of the LLM interface, KP object ontology, authoring
  workbench, styling and task management, with separable engineering boundaries
  that enable parallel work.
- First-class references to every created object in conversations, including
  exact versions, parts and occurrences where needed.
- Highlight and respond to specific passages or wording in assistant responses.
- View and mark up the API-using source code together: explicit agent/human joint
  attention, linked to the corresponding rendered object.
- Fast workbench UI iteration; useful information-processing affordances may
  later become first-class KP capabilities rather than remaining internal tools.
- Visibility into the relationship between the ontology and pedagogical/design
  practices, including what is an object, a technique, a condition or evidence.
- Rapid development of personally useful spaced practice, with atomic questions
  that retain rich context, learner mistake metadata and partial understanding.
- Visibility into running work, engineering boundaries and bottlenecks.
- Co-develop mathematics and the systems it describes; track domain fluency and
  representational fluency as distinct questions.
- LLM assistance that maintains the north star and proposes local/global
  reprioritization at appropriate cadences.
- Allow parts and wholes to inform one another; the user invokes Indra's net
  and hermeneutic reciprocity as inspirations.
- A recurring LLM synthesis role that reads existing subsystem evidence and
  proposes cleaner, less conflated organization.

This is a direction/intake record, not evidence that these capabilities exist,
an automatic schedule, a set of diagnosed learner traits, or authority to spawn
background agents and silently reorganize the project's source of truth.

## 2026-09-02: First-Class Knowledge Objects, Procedures, And Formula Macros

Status: exploratory brainstorm; not accepted implementation scope

### First-Class Definitions And Principles

Treat a definition or commonly invoked principle as a first-class semantic
object rather than prose or catalogue metadata. A candidate definition record
would include:

- a primary author-facing label used to seed autocomplete;
- the core semantic objects to which the definition applies;
- representative examples;
- close counterexamples that clarify the boundary;
- explicit conditions or assumptions under which the statement is true;
- relationships to theorems, lemmas, and other definitions;
- mathematical or domain properties; and
- enough structured information for glossary entries to be queried or
  generated as a projection of the same object.

Definitions should support parameterized invocations. For example, the
triangle inequality could be instantiated over different metric, normed-space,
or geometric objects while every invocation retains identity and provenance
back to the shared principle and records the capability evidence that makes
that form valid.

This could let KP understand that differently worded or differently bound uses
are instances of the same definition, theorem, lemma, or property without
collapsing their local arguments, assumptions, or source occurrences.

### First-Class Procedures And Algorithms

Treat procedures or algorithms as semantic objects with typed inputs over the
underlying domain objects. A procedure may contain an ordered series of rules,
judgments, branches, and intermediate states. Initial examples include:

- Gaussian elimination;
- determinant computation; and
- other derivations whose next step depends on a rule or judgment rather than
  one closed-form rewrite.

Procedures should compose. Matrix multiplication, for example, can invoke dot
product procedures. The outer procedure should preserve the identity and
semantics of its inner procedures so KP may reuse their correctness evidence
and, where separately supported, their visual motifs.

The outer procedure should also be able to expose its inner work at an
appropriate level of granularity: collapsed to one semantic act, expanded into
subprocedures, or expanded into individual rules and judgments. Semantic
composition and presentation granularity should remain distinct so hiding
steps does not erase their identity, provenance, or recoverability.

### Semantic Macro And Formula Ideas

Macros should construct or transform typed semantic objects rather than
substitute strings. Candidate families include:

- indexed binders such as sigma and Pi, expanded from their index and bounds;
- a first-class series object with compressed, schematic, partially expanded,
  and exhaustive views;
- Taylor and Maclaurin series;
- domain formula templates such as kinetic energy and the work integral;
- derivative and integral formulas that derive a consistent differential such
  as `dx` from the bound variable when unambiguous;
- multivariable constructs including gradients, multiple integrals, and
  Lagrangians;
- trigonometric identities; and
- prominent parameterized formula families such as conic sections, with
  semantically labelled parameters that can drive a graph dynamically.

Formula templates should retain their assumptions, units, binders, parameter
roles, compact and expanded forms, and provenance to the common formula. A
default such as a derived differential should remain overrideable and should
produce a typed ambiguity gap when the binding cannot be determined safely.

### Questions To Resolve During Brainstorming

- Is a definition one declaration object, or a declaration plus separately
  identified claims, properties, examples, and counterexamples?
- Are examples and close counterexamples always curated, or can registered
  generators propose candidates that must still be verified?
- How should conditions become typed predicates or proof obligations without
  turning KP into a theorem prover?
- How are aliases, domain terminology, and relabellings attached without
  weakening the stable identity used by autocomplete and glossary queries?
- What identity and lineage laws apply to nested procedure calls and their
  intermediate states?
- Does disclosure granularity belong entirely to presentation planning, or do
  authors sometimes need to declare pedagogically atomic subprocedures?
- When may a composed procedure reuse an inner procedure's motif, and when is
  semantic reuse valid but visual reuse inappropriate?
- What are the exact meanings of compressed, schematic, partially expanded,
  and exhaustive views for finite, symbolic, and infinite series?
- How do parameter changes preserve object identity while invalidating derived
  values, selected views, procedure traces, and graph projections?
- Which formula families are definitions, which are theorems, which are
  procedures, and which are merely notation or presentation templates?

### Scope Guard

This capture extends the accepted typed semantic authoring direction but does
not yet authorize a universal ontology, automatic theorem discovery, general
CAS, broad formula catalogue, generated curriculum, or global motif inference.
It does not change the current test-ledger/helper proposal or the existing
Theseus queue while brainstorming continues.
