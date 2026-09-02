# Semantic Programming-Language Theater Design

Date: 2026-07-21  
Status: exploratory design; implementation not yet authorized

## Summary

KP should explain programming languages by revealing the semantic machine each
language teaches a programmer to think with. The target is not a generic code
animation renderer. It is a family of language-native semantic theaters built
on one renderer-neutral program, revision, execution, projection, and narrative
runtime.

The shared substrate preserves identity, correspondence, provenance, exact
seek and rewind, accessible static fallbacks, and synchronized views. A
language semantics pack supplies native entities, operations, relations,
analysis or execution providers, explanatory motifs, laws, caveats, and
canonical exemplars.

The initial atlas should reveal four contrasting computational worldviews:

```text
Lisp     code and data share recursive structure
Haskell  constraints determine valid composition and demand controls work
Forth    stack effects and dictionary growth construct the language
C        typed operations project toward target-specific machine state
```

## Design Thesis

Each language has a surface that initially appears magical. A strong KP
explanation should preserve that moment, open the machinery that makes it
possible, and then return to the surface with a changed understanding.

```text
encounter the magic
-> freeze the surprising moment
-> open the hidden machinery
-> trace the language's native semantics
-> close the machinery again
-> vary one condition and predict the result
```

The same sequence realizes KP's broader interpretive cycle: establish a whole,
isolate a part, relate it across evidence views, and reintegrate the whole.

## Ergonomic Authoring Contract

Semantic units should be compiled infrastructure, not authoring paperwork.
Authors state meaning and pedagogical intent. KP derives ordinary identity,
correspondence, frame, and motion details. Renderers own measurement and visual
binding only.

| Layer | Human authors | KP derives | Renderer owns |
| --- | --- | --- | --- |
| Artifact | Source, snippets, revision inputs | Program snapshots, parsing, source occurrences | Syntax layout |
| Meaning | Stable aliases, operation, invariant | Correspondence candidates, identity closure, diagnostics | Nothing |
| Teaching | Beat order, learner goal, disclosure intent | Focus defaults and phase envelope | Attention styling |
| Aesthetics | Style pack and rare motif override | Motion plan from semantic operation | Paths, measurements, glyph effects |

A normal beat should state only:

1. what concept changes;
2. what persists;
3. what the learner should notice.

```text
beat "inline-normalizer" {
  change: wrap(normalizer-call, with: number-call)
  remove: cleaned-binding
  preserve: normalized-value
  notice: "The intermediate name disappears; the data flow does not."
}
```

KP resolves occurrences, proposes correspondence, infers background
continuity, selects a governed motif, and reports ambiguity. Authors should not
need generated AST paths or per-token tracks for ordinary beats.

### Progressive authoring levels

1. **Projection-only:** parse one artifact and use focus, fold, blank, trace,
   label, and representation queries.
2. **Aliased:** name only the entities that matter pedagogically.
3. **Operation-authored:** declare a semantic operation such as wrap, extract,
   substitute, evaluate, recur, unify, or load.
4. **Correspondence-authored:** override identity only where provider evidence
   is ambiguous or the lesson asserts a conceptual relation.
5. **Fully explicit:** retain a verbose escape hatch for generated fixtures,
   research prototypes, and unusual transformations.

If an ordinary beat requires many aliases, several primary operations, or
manual continuity for most tokens, the beat is overloaded or the selector and
provider system is insufficient.

## Program Semantic Substrate

`ProgramSnapshot` should be the durable programming object above individual
source files.

```text
ProgramSnapshot
|- SourceFileRevision[]
|- CodeEntity graph
|- analysis sidecars
|  |- types and symbols
|  |- diagnostics
|  |- call and data-flow graphs
|  `- tests and build results
`- provenance

ProgramChange
|- source snapshot
|- target snapshot
|- semantic operations
|- entity correspondence
`- claimed invariants and behavior changes

ExecutionRun
|- program snapshot ref
|- input and environment
|- ordered events
|- stack and value state
`- output and diagnostics

ProgramProjection
`- query over a snapshot, change, or execution run

CodeAnimationAsset
`- narrative timeline sampling those objects into neutral frames
```

Four axes must remain distinct:

| Axis | What changes |
| --- | --- |
| Revision | Source files, symbols, tests, and program structure |
| Execution | Stack, values, heap, control flow, and output |
| Projection | Which representation or subset is visible |
| Narrative time | Focus, staging, interpolation, and explanation |

Advancing an execution trace is not a source transformation. Folding a
function is not a revision. Moving a glyph is not semantic identity.

### Identity and resolution

Separate a semantic code entity from its occurrences:

- `CodeEntity`: function, binding, expression, statement, type, or module;
- `CodeOccurrence`: one syntactic or textual occurrence in one snapshot;
- `SourceAnchor`: revision-specific evidence that resolves an occurrence;
- `EntityCorrespondence`: an explicit identity or derivation claim across
  revisions.

Resolve identity through progressively weaker evidence:

1. authored semantic alias;
2. compiler or language-server symbol identity;
3. structural fingerprint plus semantic parent;
4. AST path;
5. source range plus text hash;
6. unresolved, with a preservation diagnostic.

Tree-sitter is an anchoring provider, not the owner of semantic identity. A
binding is not identical to its identifier tokens, and one binding can have
many occurrences across files.

### Metadata and values

Program metadata should be a typed, revision-bound relation graph rather than
a large bag on `SourceFile`.

```text
symbol --declared-at--> occurrence
symbol --referenced-at--> occurrence
function --calls--> function
binding --flows-to--> expression
test --covers--> behavior
diagnostic --targets--> occurrence
type --constrains--> expression
module --imports--> module
```

Each derived claim names its provider, provider version, source revision, and
preservation level. Syntax analysis, compiler types, runtime traces, and model
inference do not have equal epistemic status.

Runtime data structures should use a small `ValueGraph` core with scalar,
record, sequence, map, set, object, closure, and opaque nodes; field, index,
key/value, reference, ownership, and parent/child edges; stable runtime ids
where available; explicit aliasing and cycles; snapshot or delta events; and
provenance for truncation or unavailable values. The same value graph can
project into locals, stack/heap, arrays, trees, tables, diagrams, or WebGL.

## Language Semantics Packs

A language semantics pack supplies native meaning without creating another
animation runtime.

```ts
interface LanguageSemanticsPack {
  readonly id: string;
  readonly version: string;
  readonly entityKinds: readonly string[];
  readonly relations: readonly string[];
  readonly operations: readonly string[];
  readonly projections: readonly string[];
  readonly analysisProviders: readonly ProviderRef[];
  readonly executionProviders: readonly ProviderRef[];
  readonly motifs: readonly MotifDefinition[];
  readonly laws: readonly SemanticLaw[];
  readonly canonicalExemplars: readonly ExemplarRef[];
  readonly caveats: readonly SemanticCaveat[];
}
```

Packs compile native operations into KP semantic transformations, shared clocks,
renderer-neutral frames, and diagnostics. They do not own DOM, WebGL resources,
or imperative playback.

## Lisp: Recursive Semantic Theater

Lisp is the first proposed proof because source, data, recursive structure,
interpreter input, and runtime values can share one structural lineage.

The small semantic base is:

```text
SExpression
|- Atom
|- Pair or List
|- Hole
`- Quote boundary
```

Layer on form occurrences, runtime values, environments, closures,
continuations, and evaluation states. Keep object-language, meta-language, and
runtime identities namespaced even when every layer is Scheme.

### First-class holes

A hole is not painted whitespace. It records expected role, scope,
constraints, current occupant, provenance, and display policy. An expression
flowing into a hole preserves its identity. The hole either exits or becomes a
boundary around the inserted expression.

### Botanical recursive style

The exploratory `kp.botanical-recursive` style treats atoms as leaves, lists as
branches, parentheses as flexible enclosures, and recursive return as material
gathering back toward a parent.

```text
recognize whole
-> open enclosing form
-> disclose children
-> dispatch one child
-> recursively transform it
-> gather child results
-> retract into the parent
-> settle as the changed whole
```

Candidate motifs include `open-form`, `close-form`, `retract-to-parent`,
`sprout-hole`, `plug-hole`, `peel-car`, `reveal-cdr`, `recursive-return`,
`reconstruct-list`, `quote-boundary`, `closure-gather`, and
`dispatch-through-clause`.

The material-conservation law is:

> Every visible semantic fragment persists, gathers into an ancestor, emerges
> from an ancestor, or enters or exits for an explicit semantic reason.

Folding gathers descendant material into a lineage-bearing summary. Reopening
reverses the same lineage. Native selectable text remains authoritative at
rest; DOM text, SVG overlays, and optional WebGL atmosphere may cooperate
during motion without taking ownership of identity.

### Meta-circular evaluation

An object-language form can classify by its outer structure, flow into the
matching evaluator clause, bind its components into semantic holes, send
subexpressions recursively through the evaluator, gather returned values, and
emerge as a result.

Relations include `classifies-as`, `dispatches-to`, `binds-pattern`,
`evaluates-to`, `quotes-as-data`, `captures-environment`, `looks-up`, `applies`,
`returns-to`, and `reconstructs-from`.

The first visual checkpoint should remain smaller than a full evaluator: one
recursive substitution through a nested S-expression, followed by human
review. A meta-evaluator dispatch is the next experiment only after recursive
opening, gathering, reconstruction, and rewind are accepted.

## Haskell: Constraint Closure And Demand

Haskell should have a crystalline, precise visual grammar rather than reuse
Lisp's botanical material.

The first exemplar infers the type of:

```haskell
\f xs -> map f xs
```

Unknowns generate constraints. Shared variables acquire common identity.
Successful unification closes compatible boundaries without gaps, and
generalization settles the inferred polymorphic type around the expression.
Constructor mismatch remains visibly unclosed and produces an exact provider
diagnostic.

Separate later exemplars should reveal lazy demand, currying, algebraic data
types, pattern coverage, type classes, and effect boundaries. Laziness should
show demand traveling backward from a consumer and opening only the necessary
thunk and list spine. The visual contract must not imply that static typing
guarantees totality, termination, performance, or freedom from runtime failure.

## Forth: Stack And Dictionary

Forth should feel compact, mechanical, and typographic. Its native objects are
the data stack, return stack, input token stream, dictionary, current word,
interpret or compile state, and threaded execution sequence.

The first exemplar executes:

```forth
3 4 + 2 *
```

Each word consumes and produces stack values through an explicit stack effect.
The second reviewed operation defines a word:

```forth
: DOUBLE 2 * ;
```

Compile state collects tokens into a dictionary entry; the definition folds
into the word `DOUBLE`; later execution can leave it closed or open its threaded
implementation. Defining words and `CREATE ... DOES>` are later metaprogramming
exemplars, not part of the initial stack checkpoint.

## C: Typed Operations And Machine Projection

C should use an X-ray visual grammar. Its explanatory views can synchronize C
source, typed objects and expressions, target-specific layout, compiler IR,
assembly, registers, and bytes while avoiding a false one-to-one mapping.

Every artifact pins compiler and version, optimization level, target, ABI,
integer-width assumptions, endianness when relevant, and source revision.

The first exemplar traverses an integer array with a pointer. Pointer advance,
typed address arithmetic, memory load, accumulator update, and corresponding
target instructions remain linked. Later exemplars cover struct padding,
array decay, calling conventions, allocation and aliasing, strings, linking,
optimization, and undefined behavior.

Undefined behavior should appear as loss of a semantic guarantee followed by
multiple compiler-permitted outcomes, not as a single theatrical crash.

## Broader Atlas Candidates

| Language | Central revelation |
| --- | --- |
| Smalltalk | Messages act inside a live image |
| Prolog | Relations execute through search and substitution |
| APL or J | Shape and rank replace scalar iteration |
| Erlang | Processes, mailboxes, links, and supervision make failure architectural |
| Rust | Ownership and borrowing constrain aliasing across control flow |
| SQL | Declarative relations become optimizer-chosen plans |
| Self | Delegation replaces class-centered object construction |
| PostScript | Graphics and stack computation share one language |
| CUDA | One operation expands across execution and memory hierarchies |

These are future subjects, not an implementation queue.

## Exemplar Protocol

Each new language begins with one reviewed semantic operation or tightly bound
cycle. Before implementation, record:

- the canonical source and provider configuration;
- the surprising phenomenon to reveal;
- observable learner-facing acceptance criteria;
- the semantic and architecture preservation boundary;
- the smallest independently reversible fixture, adapter, and renderer unit;
- caveats that prevent a visual metaphor from claiming more than the language
  semantics support.

Do not generalize a language pack, style, or motif family before the first
exemplar receives visual and semantic review.

## Initial Candidate Sequence

The exploratory sequence is:

1. Lisp recursive substitution through a nested S-expression;
2. one Lisp evaluator dispatch after botanical recursion is accepted;
3. Haskell constraint generation, unification, and generalization;
4. Forth stack execution followed by one word definition;
5. C pointer traversal synchronized with memory and target instructions.

This sequence is design provenance, not authorization to displace the active
symbolic exemplar roadmap.

