# Capture

Last Updated: 2026-09-02

Use this file for raw future project thoughts that are not yet processed into
roadmap items, decisions, or Theseus nodes.

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

Definitions should support parameterized invocations. For example, one common
principle provisionally called the "triangle property" could be instantiated
with different referenced objects while every invocation retains identity and
provenance back to the shared principle. The exact intended principle remains
to be clarified; do not silently equate this phrase with the triangle
inequality.

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
