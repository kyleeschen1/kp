# KP Asset Calculus Composition Laws

Date: 2026-07-11
Status: active doctrine

## Purpose

These laws define what KP means by predictable composition. They are not a
claim that KP will prove all pedagogy or rendering behavior formally. They are
the contracts that keep semantic objects, transformations, timelines,
interpreters, ports, exports, and flashcards aligned as assets get larger.

Each law must be enforced at the strongest practical level:

- TypeScript shape and branded ids for local structural compatibility;
- runtime validation for cross references, selectors, provenance, and package
  closure;
- sampled law tests for time-varying behaviors;
- browser or pixel tests for renderer equivalence that cannot be seen in pure
  frame data;
- human review for pedagogy, salience, and lossy mappings.

## Law Levels

### Strict

A strict law must pass exactly for the relevant representation.

Example: composing two transformations with matching source and target ids must
produce a diagram whose first source and final target are known and valid.

### Sampled

A sampled law must pass over a deterministic set of canonical times, selectors,
and examples.

Example: sampling a behavior at `t=0.25` twice must produce equivalent frame
data, even if DOM nodes are recreated by the renderer.

### Lax

A lax law may preserve structure up to an explicit adapter, normalization, or
diagnostic.

Example: a CAS port may produce a mathematically valid rewrite whose selector
names do not match KP's authored selectors. The port can still be accepted if
it emits a correspondence map and diagnostics explaining the rename.

### Qualitative

A qualitative law requires human or reviewer judgment.

Example: a cancellation animation can be structurally correct but still fail if
the visual emphasis teaches the wrong idea.

## Object Laws

### Stable Identity

A semantic object id names an immutable structural value. A new structural
value needs a new object id.

Checks:

- TypeScript object records are immutable by convention and readonly shape.
- Runtime validators reject duplicate ids inside an asset bundle.
- Project examples do not mutate structural fields to represent visual state.

### Selector Closure

Every selector referenced by a transformation, timeline, flashcard, port, or
interpreter must resolve against the object version it claims to reference.

Checks:

- Runtime validators check selector existence and object id compatibility.
- Tests include negative fixtures for missing selectors.

### Provenance

Every non-initial object in an asset bundle should identify the transformation,
port, or construction that produced it.

Checks:

- Runtime validators warn or fail when a derived object has no provenance.
- External ports must mark generated, opaque, approximate, or lossy provenance.

## Transformation Laws

### Source And Target Compatibility

A transformation may only compose after another transformation when the first
target is compatible with the second source.

Checks:

- TypeScript composition helpers reject statically incompatible shapes where
  known.
- Runtime validators reject unresolved or mismatched source/target ids.

### Identity

For any object `A`, composing with `id(A)` preserves the object and selector
meaning.

```text
id(A) ; f == f
f ; id(B) == f
```

Checks:

- Law tests compare composed diagram summaries and sampled behavior frames.
- Interpreters may normalize away identity steps, but must preserve inspection
  metadata or report that identity steps are hidden.

### Associativity

Sequential composition groups should not change semantic meaning.

```text
(f ; g) ; h == f ; (g ; h)
```

Checks:

- Diagram normalization tests compare source, target, step order, provenance,
  and selector correspondence.
- Sampled behavior tests compare canonical times after duration normalization.

### Correspondence Preservation

Persistent structure must keep a stable selector correspondence across a
transformation.

Example: in `x + 3 = 7 -> x = 4`, the `x` selector persists even though its
rendered position changes.

Checks:

- Runtime validators require correspondence entries for selectors marked
  persistent.
- Browser tests only check visual continuity after semantic correspondence is
  explicit.

### Cancellation And Simplification

Cancellation and simplification are semantic transformations, not just visual
vanishing.

Checks:

- Cancellation names the objects or selectors being eliminated and the rule
  that justifies the elimination.
- Visual motifs such as vanish, dissolve, collapse, or morph are interpretations
  of that semantic transformation.

## Diagram Laws

### Sequence Composition

Sequential diagrams preserve the ordered transformation chain, intermediate
objects, and provenance.

Checks:

- Runtime validators check every adjacent source/target boundary.
- Inspection APIs can report the active transformation at a sampled time.

### Parallel Composition

Parallel diagrams may share a clock and layout while preserving separate
semantic identities.

Checks:

- Runtime validators reject selector id collisions unless scoped by object id.
- Sampled frame tests verify both branches can be inspected independently.

### Tree Substitution

A composite transformation can expand into a child diagram without changing the
parent source and target.

Example: matrix multiplication can expand into dot products.

Checks:

- Runtime validators check child diagram boundary equals parent transform
  boundary, or record an explicit lax adapter.
- Inspection can move from parent phase to child phase.

### Focus Preservation

Focus changes salience, not structure.

Checks:

- Focus produces a view or frame state, not a new semantic object.
- Rewinding focus restores visual state without changing provenance.

### Representation Shift

Changing representation should commute with semantic transformations when the
representation preserves the needed structure.

```text
interpret(A --f--> B) ~= interpret(A) --interpret(f)--> interpret(B)
```

Examples:

- equation to graph;
- matrix to linear map;
- expression to derivative plot;
- source file to execution trace panel.

Checks:

- Interpreters state whether they are strict, sampled, lax, or qualitative for
  a given transformation.
- Lax representation shifts emit diagnostics and preserve source refs.

## Behavior Laws

### Determinism

Sampling the same behavior with the same prepared inputs and time returns
equivalent frame data.

Checks:

- Unit tests sample canonical times repeatedly.
- Behavior frame data excludes live DOM nodes, WebGL handles, random seeds, and
  wall-clock values.

### Seek Equivalence

Jumping directly to time `t` equals playing to time `t` for semantic frame
data.

Checks:

- Tests compare direct samples with stepped samples.
- Renderer caches may differ, but sampled frame identity must match.

### Rewind Equivalence

Rewind is decreasing time over the same behavior. It must not run a separate
hand-authored reverse animation.

Checks:

- Tests sample mirrored forward and backward times.
- Entry and exit ordering must reverse naturally from the same beat structure.

### Duration Reparameterization

Changing duration or using scroll/media clocks should not change semantic
ordering.

Checks:

- Timeline tests compare normalized progress samples.
- Beat labels remain stable across duration changes.

## Interpreter Laws

### Composition Preservation

An interpreter should preserve diagram composition where practical.

```text
I(f ; g) == I(f) ; I(g)
I(f parallel g) == I(f) parallel I(g)
```

Checks:

- Pure frame interpreters use law tests.
- DOM/WebGL interpreters use sampled/browser checks for representative assets.
- Any known mismatch is reported as a diagnostic, not hidden.

### Backend Non-Ownership

Renderers do not own semantic identity.

Checks:

- Render nodes reference object ids and selectors.
- Losing or recreating a render node does not destroy the semantic object.

## Port Laws

### Import Determinism

The same external deterministic input and port version produces equivalent KP
asset bundles.

Checks:

- Fixture tests import the same trace twice.
- Port output includes source metadata and version.

### Loss Reporting

Ports must report partial, lossy, approximate, opaque, or unsupported mappings.

Checks:

- Runtime validators require diagnostics when assumptions, correspondence, or
  provenance is incomplete.

### External Composition

When an external system supplies composed steps, the port should preserve the
composition tree where possible.

Checks:

- CAS/proof fixtures preserve rewrite order and assumptions.
- Program-trace fixtures preserve callstack and dataflow ordering.

## Flashcard Laws

### Question References Resolve

Every cloze, prompt, hidden selector, answer, and explanation target must
resolve against the referenced asset or sampled time.

Checks:

- Runtime validators check selectors, object ids, and timeline times.

### No Duplicate Semantic Copies

Flashcards reference assets and diagrams. They do not fork semantic content
unless the card intentionally creates a new object.

Checks:

- Flashcard specs store refs and prompts, not copy-pasted equations or traces
  that can drift from the source asset.

## Canonical Law Fixture

The first canonical fixture is the linear solve asset:

```text
x + 3 = 7
subtract 3 from both sides
x + 3 - 3 = 7 - 3
cancel additive inverses
x = 4
```

It should eventually cover:

- object identity and selector closure;
- transformation source/target compatibility;
- cancellation semantics;
- correspondence preservation for persistent tokens;
- deterministic behavior sampling;
- rewind equivalence;
- flashcard selector resolution;
- algebra-trace port determinism.

## Failure Policy

A law failure should produce one of four outcomes:

1. fix the asset, transformation, behavior, interpreter, or port;
2. mark the mapping lax with an explicit adapter and diagnostic;
3. mark the feature unsupported for that asset type;
4. escalate to human review when the issue is pedagogical or visual.

Silent degradation is not acceptable for semantic composition.
