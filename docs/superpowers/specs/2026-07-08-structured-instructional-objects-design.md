# Structured Instructional Objects Design

## Summary

Kinetic Press should treat structured mathematical objects as one domain inside
a broader protocol-based instructional object system. Math, code, diagrams,
tables, simulations, proofs, student answers, diagnostics, and transformations
all need the same core affordances:

- stable identity across time and renderings
- structured internal parts
- semantic selectors
- optional rendering, execution, transformation, comparison, diagnosis, and
  linking capabilities
- correspondence across changes
- compatibility with branchable history and pinned references

The core should define object records, registries, capabilities, selectors,
references, schemas, validity annotations, and transformation contracts. Domain
libraries register object definitions and behavior explicitly.

## Goals

- Support a large built-in library of structured instructional objects.
- Let imported libraries register additional object types and capabilities.
- Keep documents as pure serialized data.
- Keep behavior in registered object definitions, not in document snapshots.
- Preserve object and sub-object identity across transformations.
- Support executable objects without assuming every object is executable.
- Represent invalid, partial, unresolved, or intentionally wrong objects.
- Support math and non-math domains, especially code instruction.
- Allow gradual migration from the current closed `KpSemanticObject` union.

## Non-Goals

- Build a package manager or remote plugin system in the first pass.
- Execute untrusted user code directly in the core runtime.
- Replace every existing semantic object and renderer in one migration.
- Require every object type to support every capability.
- Make KP a full computer algebra system, theorem prover, or programming
  language runtime.

## Core Object Record

Documents store objects as pure data records.

```ts
interface KpObjectRecord {
  id: ObjectId;
  type: KpObjectTypeId;
  label?: string;
  data: JsonValue;
  validity?: ValidityAnnotation;
  metadata?: ObjectMetadata;
}
```

The `type` is namespaced so libraries can coexist.

```text
core/equation
core/function
linear-algebra/matrix
linear-algebra/row-operation
calculus/vector-field
probability/distribution
code/source-file
code/refactor
rust/function
```

Documents do not store executable behavior. They store facts. Loaded libraries
supply behavior through the object registry.

## Registry

Object behavior is registered explicitly.

```ts
interface KpObjectRegistry {
  register<TData>(definition: KpObjectDefinition<TData>): void;
  get(type: KpObjectTypeId): KpObjectDefinition<unknown> | undefined;
}

interface KpObjectDefinition<TData> {
  type: KpObjectTypeId;
  title: string;
  schema: ObjectSchema<TData>;
  capabilities: KpObjectCapabilities<TData>;
  migrations?: readonly ObjectMigration[];
}
```

Libraries register definitions through explicit functions.

```ts
const registry = createKpObjectRegistry();

registerCoreObjects(registry);
registerLinearAlgebraObjects(registry);
registerCalculusObjects(registry);
registerCodeObjects(registry);
registerRustObjects(registry);
```

Registration should not happen by hidden global side effect. Explicit
registration keeps tests, reproducibility, and document loading predictable.

## Capabilities

Capabilities are optional and composable.

```ts
interface KpObjectCapabilities<TData> {
  render?: RenderCapability<TData>;
  select?: SelectCapability<TData>;
  execute?: ExecuteCapability<TData>;
  transform?: TransformCapability<TData>;
  compare?: CompareCapability<TData>;
  diagnose?: DiagnoseCapability<TData>;
  link?: LinkCapability<TData>;
}
```

Examples:

```text
matrix:
  render, select, execute, transform, compare, diagnose, link

malformed-code:
  render, select, diagnose, link

theorem-statement:
  render, select, link

refactor:
  render, execute, transform, compare, diagnose
```

The core asks an object definition what it can do. It does not assume all
instructional objects are math expressions, executable functions, or renderable
LaTeX.

## Domain Libraries

Core KP stays small. Domain libraries provide object definitions.

```text
src/objects/...                core object system
src/domains/math/...           general math objects
src/domains/linear-algebra/... linear algebra objects
src/domains/calculus/...       calculus objects
src/domains/code/...           language-neutral code objects
src/domains/rust/...           Rust-specific objects
```

A linear algebra library might register:

```text
linear-algebra/matrix
linear-algebra/vector
linear-algebra/linear-map
linear-algebra/basis
linear-algebra/row-operation
linear-algebra/eigenspace
linear-algebra/linear-system
```

A code library might register:

```text
code/source-file
code/function
code/test-case
code/execution-trace
code/refactor
code/diagnostic
```

Documents may declare the libraries they need.

```ts
interface KpDocumentManifest {
  requiredLibraries: readonly {
    id: string;
    versionRange: string;
  }[];
}
```

If a definition is missing, KP can still load the raw object record. Rendering,
execution, transformation, and diagnostics for that object return missing
capability errors until the library is registered.

## Browser Loading And Minimal JavaScript

The registry design should minimize browser JavaScript by keeping the core small
and loading domain behavior only when needed.

The browser should not import every domain library by default. Core KP should
ship only:

```text
object record types
registry shell
reference and selector helpers
minimal schema metadata
render/runtime dispatch
missing-capability fallbacks
```

Domain libraries should be lazy-loaded based on the document and active view.

```ts
await loadObjectLibrary("linear-algebra");
await loadObjectLibrary("rust");
```

The runtime can load:

- only libraries used by objects in the current document
- only capabilities needed by the current view
- heavier capabilities only on interaction

Object libraries should be splittable by capability.

```text
linear-algebra/metadata     schemas, labels, capability manifest
linear-algebra/render       LaTeX and table render plans
linear-algebra/execute      numeric algorithms
rust/metadata               schemas, labels, capability manifest
rust/render                 syntax-highlighted code render plans
rust/analyze                parser, linter, or typecheck bridge
rust/execute                external or sandboxed execution bridge
```

The registry can accept lightweight manifests before loading implementation
chunks.

```ts
registry.registerLibraryManifest({
  id: "linear-algebra",
  objectTypes: ["linear-algebra/matrix", "linear-algebra/row-operation"],
  loadCapability: async (type, capability) => importCapability(type, capability)
});
```

Opening a lesson with matrices should not automatically load every matrix
algorithm, graph renderer, code analyzer, and animation system. The object
system must therefore support lazy capability resolution, not only eager
definition registration.

## Identity And Selectors

Each object has stable identity through `objectId`. Structured objects also
need stable identities for internal parts: matrix entries, rows, equation
sides, terms, factors, code functions, variables, blocks, diagnostic spans,
graph axes, and transformation inputs.

Internal parts are addressed through selectors rather than by making every part
a top-level object.

```ts
interface ObjectSelector {
  objectId: ObjectId;
  path: readonly SelectorSegment[];
}

type SelectorSegment =
  | { kind: "field"; name: string }
  | { kind: "index"; value: number }
  | { kind: "role"; name: string }
  | { kind: "semantic"; id: string };
```

Examples:

```ts
// Matrix A, row 2, column 1.
{
  objectId: "A",
  path: [
    { kind: "role", name: "entry" },
    { kind: "index", value: 2 },
    { kind: "index", value: 1 }
  ]
}

// Equation eq1, semantic term x on the left side.
{
  objectId: "eq1",
  path: [
    { kind: "role", name: "left" },
    { kind: "semantic", id: "term.x" }
  ]
}
```

The object definition owns selector resolution.

```ts
interface SelectCapability<TData> {
  list(object: KpObject<TData>): readonly SelectorSpec[];
  resolve(
    object: KpObject<TData>,
    selector: ObjectSelector
  ): SelectionResult;
}
```

Selectors are semantic, not DOM-dependent. Renderers consume selector identity;
they do not define it.

## References

Selectors integrate with branchable history and pinned refs.

```ts
interface PinnedObjectRef {
  kind: "pinned";
  revisionId: RevisionId;
  objectId: ObjectId;
}

interface PinnedSelectionRef extends PinnedObjectRef {
  selector: ObjectSelector;
}

interface LiveObjectRef {
  kind: "live";
  objectId: ObjectId;
}
```

Pinned refs are stable after later edits. Live refs resolve against the active
editor snapshot and are explicitly opt-in.

## Schemas And Validity

Schema validity and semantic validity are different.

Schema validation answers whether KP can read the object's data shape.

```text
Does this matrix have rows?
Are rows arrays?
Does this source-file object have source text?
Does this equation object have left and right fields?
```

Semantic validity answers whether the represented idea is correct, complete,
executable, or intentional.

```text
Is this matrix invertible?
Is this equation step correct?
Does this code compile?
Is this proof step justified?
Is this student answer intentionally wrong?
```

Validity is an annotation.

```ts
type ValidityStatus =
  | "valid"
  | "invalid"
  | "unknown"
  | "intentionally-invalid"
  | "partial"
  | "unresolved";

interface ValidityAnnotation {
  status: ValidityStatus;
  diagnostics?: readonly Diagnostic[];
}
```

Rules:

- Schema-invalid data cannot instantiate as that type; it loads as an unknown or
  error object.
- Schema-valid but semantically invalid data is representable, renderable, and
  diagnosable.
- Intentionally invalid objects are first-class instructional material.
- Execution capabilities decide whether invalid or partial objects can execute
  in a limited diagnostic mode.

## Rendering

Objects expose render capabilities that produce render plans. Objects do not own
DOM, SVG, WebGL, or KaTeX lifecycle.

```ts
interface RenderCapability<TData> {
  supportedModes(
    object: KpObject<TData>,
    context: RenderContext
  ): readonly RenderModeSpec[];
  render(
    object: KpObject<TData>,
    mode: RenderMode,
    context: RenderContext
  ): RenderPlan;
}
```

Render modes are normalized enough for the editor but flexible enough for
domains.

```text
latex
katex
svg
webgl
table
code
ast
timeline
comparison
diagnostic-card
inspector
```

A render plan carries object and selector references.

```ts
interface RenderPlanNode {
  id: RenderNodeId;
  objectRef: ObjectRef;
  selector?: ObjectSelector;
  role: RenderRole;
  backend: RenderBackend;
  children?: readonly RenderPlanNode[];
}
```

The flow is:

```text
object data + capability -> render plan -> renderer -> screen nodes
```

The renderer registers concrete screen nodes in the render index.

## Execution

Execution is a capability, not a property of all objects.

```ts
interface ExecuteCapability<TData> {
  supportedRequests(object: KpObject<TData>): readonly ExecutionRequestSpec[];
  execute(
    object: KpObject<TData>,
    request: ExecutionRequest,
    context: ExecutionContext
  ): ExecutionResult;
}
```

Execution requests are explicit.

```ts
{ kind: "evaluate", inputs: { x: 2 } }
{ kind: "sample-grid", inputs: { xDomain: [-3, 3], yDomain: [-3, 3] } }
{ kind: "apply-transform", inputs: { targetObjectId: "A" } }
{ kind: "solve", inputs: { variable: "x" } }
{ kind: "run-tests", inputs: { testObjectId: "test-1" } }
```

Results are structured.

```ts
type ExecutionResult =
  | { kind: "number"; value: number }
  | { kind: "object"; object: KpObjectRecord }
  | { kind: "object-list"; objects: readonly KpObjectRecord[] }
  | { kind: "table"; columns: readonly string[]; rows: readonly JsonValue[][] }
  | { kind: "diagnostic"; diagnostic: Diagnostic }
  | { kind: "error"; error: ExecutionError };
```

Execution runs against explicit context.

```ts
interface ExecutionContext {
  snapshot: KpDocumentSnapshot;
  registry: KpObjectRegistry;
  scope?: Readonly<Record<string, JsonValue>>;
}
```

Execution should be deterministic for pinned refs. Randomness must be seeded and
the seed must be stored in the object data or execution request.

## Execution Trust

First version assumption: registered libraries are trusted application code, not
untrusted user scripts.

Execution requests should still describe trust requirements.

```ts
interface ExecutionRequestSpec {
  kind: string;
  requiredTrust: "pure" | "sandboxed" | "external";
  deterministic: boolean;
}
```

Examples:

```text
matrix.det        pure, deterministic
equation.solve    pure, deterministic
rust.typecheck    sandboxed or external, deterministic-ish
js.run-tests      sandboxed, may need file/env inputs
simulation.sample pure if seeded
```

The registry can expose capability metadata without running code. UI can show
that an object is executable and whether execution requires sandboxed or
external trust.

## Transformations

Transformations are structured instructional objects. They describe semantic
changes from source objects to target objects.

```ts
interface TransformationData {
  operation: OperationSpec;
  sourceRefs: readonly ObjectRef[];
  targetRefs?: readonly ObjectRef[];
  correspondence?: readonly CorrespondenceSpec[];
  validity?: ValidityAnnotation;
  explanation?: string;
}
```

Math examples:

```text
subtractBothSides(3)
rowReplace(R2, R2 - 3R1)
differentiateBothSides(x)
completeSquare()
```

Code examples:

```text
renameVariable(oldName, newName)
extractFunction(selection)
inlineTemporary(variable)
fixTypeError(diagnostic)
addTestCase(behavior)
```

A transformation can be executable, renderable, comparable, diagnosable, and
linkable like any other object.

## Correspondence

Correspondence maps source selectors to target selectors with semantic
relations.

```ts
interface CorrespondenceSpec {
  source: ObjectSelector;
  target: ObjectSelector;
  relation:
    | "same"
    | "derived-from"
    | "introduced"
    | "removed"
    | "renamed"
    | "reordered"
    | "wrapped"
    | "unwrapped"
    | "cancelled-by"
    | "simplified-to"
    | "fixes"
    | "causes";
}
```

Correspondence powers:

- animation tracks
- before/after highlighting
- semantic diffs
- explanation cards
- step-by-step playback
- misconception diagnosis
- comments attached to stable subparts

The durable path is:

```text
source objects + transformation object
  -> executable transformation
  -> target objects
  -> correspondence map
  -> render/timeline plan
```

Animation is a presentation of a semantic transformation, not the source of
truth.

## Module Boundaries

Recommended module layout:

```text
src/objects/record.ts          KpObjectRecord, refs, selectors
src/objects/registry.ts        registration and lookup
src/objects/capabilities.ts    render/select/execute/transform/etc.
src/objects/schema.ts          schema validation helpers
src/objects/validity.ts        validity annotations and diagnostics
src/objects/transform.ts       transformation/correspondence contracts

src/domains/math/...           core math object libraries
src/domains/linear-algebra/...
src/domains/code/...
```

The object system should integrate with the branchable history model by storing
`KpObjectRecord` values inside snapshots. Renderers use render plans and the
render index. History and rendering remain separate.

## Migration Path

The first implementation can be incremental:

1. Keep the current `KpSemanticObject` union working.
2. Add `KpObjectRecord` and registry beside it.
3. Add lightweight library manifests and lazy capability loaders.
4. Wrap existing `matrix`, `graph`, `surface`, and equation objects as
   registered built-ins.
5. Add selectors for matrix entries/rows and equation parts first.
6. Add render capabilities that delegate to current renderers.
7. Add execution capability for current numeric expressions and matrix
   operations.
8. Move transformation objects into the registry model.
9. Add a code-domain proof of concept, such as `code/source-file` with render
   and selector capabilities.
10. Later, replace the closed union with registered object definitions as the
   primary path.

## Testing

Focused tests should cover:

- registering a library makes its object types available
- registering a manifest exposes object types without loading all capabilities
- resolving a lazy capability imports only the requested implementation chunk
- missing definitions still allow raw object data to load
- schema validation rejects malformed shape but preserves unknown/error records
- semantic invalidity is representable and diagnosable
- object selectors resolve stable internal parts
- render plans carry object and selector refs
- execution requests are explicit and deterministic where declared
- trust requirements are exposed before execution
- transformations produce target objects plus correspondence
- code-domain objects can register without math-specific assumptions
- legacy `KpSemanticObject` renderers still work during migration
