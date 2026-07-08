# Compiled Dependency Manifest Design

## Summary

Kinetic Press authoring code should compile into more than page content. The
compiler should also emit a semantic dependency manifest that tells the runtime
what is needed to render a route, section, anchor, state reference, timeline
range, code query, figure, or exercise.

This lets a reader jump into the middle of a page without loading every object,
revision, timeline, renderer, analyzer, WebGL scene, authoring helper, and
domain library. It also keeps the browser bundle small by separating authoring
dependencies from runtime capabilities.

The compiler should act as a lesson dependency manager, not as a package
manager. NPM, Vite, and normal JavaScript tooling still handle package
resolution. KP compilation computes the semantic closure of each lesson
entrypoint and maps that closure to data chunks, capability chunks, assets, and
prefetch hints.

## Goals

- Support direct navigation to any route, section, heading anchor, lesson step,
  figure, object state, timeline point, timeline range, code range, or exercise.
- Load the minimum critical data and capabilities needed for the jumped-to
  state.
- Keep authoring libraries out of browser output when their only purpose was to
  construct KPIR.
- Allow domain object libraries to lazy-load render, execute, analyze, inspect,
  and edit capabilities separately.
- Avoid shipping heavy dependencies such as Tree-sitter, Three.js-backed graph
  rendering, execution engines, or inspectors unless the active view needs them.
- Make runtime loading deterministic for pinned references.
- Give the runtime enough prefetch information for smooth forward and backward
  reading.
- Preserve useful behavior when optional dependencies are missing or delayed.

## Non-Goals

- Replace package managers or bundlers.
- Solve arbitrary dynamic JavaScript dependency discovery.
- Require every possible lesson interaction to be known statically.
- Load every neighboring section before first paint.
- Store generated render artifacts as canonical semantic data.
- Guarantee that live user editing works without loading heavier editing or
  analysis capabilities.

## Compiled Artifacts

The compiler should emit three artifact families:

```text
1. KPIR data chunks
2. entrypoint dependency manifests
3. runtime library and capability manifest
```

KPIR data chunks contain serialized lesson data: blocks, objects, revisions,
timelines, correspondence maps, sidecar anchors, and compiled query results.

Entrypoint dependency manifests describe what a particular route, anchor,
state, or interaction needs.

The runtime library manifest maps semantic library and capability names to
loadable JavaScript, CSS, WASM, worker, and asset chunks.

## Entrypoints

An entrypoint is any address the runtime may need to load directly.

```ts
type CompiledEntrypointKind =
  | "route"
  | "section"
  | "heading-anchor"
  | "figure"
  | "lesson-step"
  | "object-state"
  | "timeline-point"
  | "timeline-range"
  | "revision-range"
  | "code-range"
  | "code-query"
  | "exercise"
  | "inspector";
```

Examples:

```text
/articles/linear-algebra
/articles/linear-algebra#row-reduction-step-4
/articles/rust-borrow#first-move-error
state:eq1@rev12
timeline:row-reduction-step-3[0.25,0.60]
code-query:main.rs/top-level-forms
```

The compiler should create entrypoints for explicit authoring IDs, routes,
public anchors, linked pinned states, linked ranges, exercises, and any state
that can be the target of navigation.

## Entrypoint Manifest

Each entrypoint receives a dependency manifest.

```ts
interface CompiledEntryManifest {
  id: EntryId;
  kind: CompiledEntrypointKind;
  address?: string;
  label?: string;
  critical: DependencySet;
  prefetch?: DependencySet;
  interactive?: DependencySet;
  optional?: DependencySet;
  authorOnly?: DependencySet;
  fallback?: EntryFallbackSpec;
}
```

The runtime loads `critical` before first meaningful render. It may load
`prefetch` after first render, `interactive` on hover or interaction intent, and
`optional` only when the user opens a tool that needs it.

`authorOnly` records dependencies used by the TypeScript authoring source but
not needed by browser output. It is useful for debugging and provenance, but it
must not cause browser loading.

Fallbacks are explicit so a dependency failure has a predictable presentation.

```ts
interface EntryFallbackSpec {
  strategy: "typed-error" | "static-snapshot" | "text-only" | "placeholder";
  preservesLayout: boolean;
  message?: string;
}
```

## Dependency Primitives

The manifest uses small dependency records that can be serialized directly.

```ts
interface LibraryDependency {
  id: LibraryId;
  versionRange?: string;
}

interface CapabilityDependency {
  library: LibraryId;
  capability: CapabilityId;
  objectType?: KpObjectTypeId;
  mode?: RenderMode;
}

interface AssetDependency {
  id: string;
  kind: "image" | "font" | "texture" | "data" | "audio" | "video";
  url?: string;
  integrity?: string;
  sizeBytes?: number;
}

interface StyleDependency {
  id: string;
  url?: string;
}

interface WorkerDependency {
  id: string;
  url?: string;
}

interface WasmDependency {
  id: string;
  url?: string;
  integrity?: string;
  sizeBytes?: number;
}
```

## Dependency Sets

A dependency set is semantic. It points to lesson facts, capability names, and
assets before it points to bundled files.

```ts
interface DependencySet {
  blocks?: readonly BlockId[];
  objects?: readonly ObjectId[];
  objectSelectors?: readonly ObjectSelector[];
  revisions?: readonly RevisionId[];
  revisionRanges?: readonly RevisionRangeDependency[];
  timelines?: readonly TimelineId[];
  timelineRanges?: readonly TimelineRangeDependency[];
  correspondenceMaps?: readonly CorrespondenceMapId[];
  codeFiles?: readonly CodeFileDependency[];
  codeQueries?: readonly CodeQueryDependency[];
  libraries?: readonly LibraryDependency[];
  capabilities?: readonly CapabilityDependency[];
  assets?: readonly AssetDependency[];
  styles?: readonly StyleDependency[];
  workers?: readonly WorkerDependency[];
  wasm?: readonly WasmDependency[];
}
```

This keeps dependency decisions at the KP layer. The runtime library manifest
then maps `linear-algebra/render` or `code/tree-sitter-query` to actual chunk
URLs.

## Dependency Classes

Dependencies should be classified by when they are needed.

```ts
type DependencyClass =
  | "critical"
  | "prefetch"
  | "interactive"
  | "optional"
  | "author-only";
```

Rules:

- `critical`: required to render the target state without broken placeholders.
- `prefetch`: likely next and previous reading material, adjacent steps, and
  nearby timeline samples.
- `interactive`: required only when the reader manipulates, edits, expands,
  queries, scrubs, or inspects.
- `optional`: debugging, authoring overlays, execution, diagnostics, expensive
  inspectors, and alternate render modes.
- `author-only`: TypeScript DSL, constructors, validators, and helper libraries
  used only during compilation.

## Example Manifest

Jumping into row-reduction step 4 might compile to:

```json
{
  "id": "row-reduction-step-4",
  "kind": "heading-anchor",
  "address": "#row-reduction-step-4",
  "critical": {
    "blocks": ["section-4", "figure-row-step"],
    "objects": ["matrixA", "rowOp3", "equation1"],
    "revisions": ["rev18"],
    "timelines": ["row-reduction-step-4"],
    "correspondenceMaps": ["corr-row-op3"],
    "capabilities": [
      { "library": "linear-algebra", "capability": "render" },
      { "library": "core-equation", "capability": "render" },
      { "library": "timeline", "capability": "playback" }
    ]
  },
  "prefetch": {
    "blocks": ["section-3", "section-5"],
    "revisions": ["rev17", "rev19"],
    "timelines": ["row-reduction-step-3", "row-reduction-step-5"]
  },
  "interactive": {
    "capabilities": [
      { "library": "linear-algebra", "capability": "inspect" }
    ]
  },
  "optional": {
    "capabilities": [
      { "library": "linear-algebra", "capability": "execute" },
      { "library": "authoring", "capability": "debug-overlays" }
    ]
  }
}
```

## Runtime Library Manifest

The runtime library manifest maps semantic capabilities to loadable files.

```ts
interface RuntimeLibraryManifest {
  libraries: readonly RuntimeLibrarySpec[];
}

interface RuntimeLibrarySpec {
  id: LibraryId;
  version: string;
  objectTypes?: readonly KpObjectTypeId[];
  capabilities: readonly RuntimeCapabilitySpec[];
}

interface RuntimeCapabilitySpec {
  capability: CapabilityId;
  imports?: readonly ChunkDependency[];
  styles?: readonly ChunkDependency[];
  wasm?: readonly ChunkDependency[];
  workers?: readonly ChunkDependency[];
  assets?: readonly AssetDependency[];
  provides?: readonly string[];
}

interface ChunkDependency {
  id: string;
  url: string;
  integrity?: string;
  sizeBytes?: number;
}
```

This lets object libraries register lightweight metadata first and load
implementation chunks only when a manifest asks for a capability.

```text
linear-algebra/metadata
linear-algebra/render
linear-algebra/execute
rust/render
rust/tree-sitter-query
graph/webgl-render
graph/webgl-inspect
```

## State Dependency Closure

A pinned state reference needs the object, its revision, and the capability used
to render the selected view.

```ts
interface StateDependency {
  revisionId: RevisionId;
  objectId: ObjectId;
  selector?: ObjectSelector;
  renderMode?: RenderMode;
}
```

The compiler computes:

```text
pinned state ref
  -> containing block or figure
  -> object record
  -> pinned revision or checkpoint closure
  -> selector resolution metadata
  -> correspondence maps needed by visible transitions
  -> render capability for requested mode
  -> assets, styles, WASM, and workers required by that capability
```

For live refs, the critical dependency is the current document snapshot plus the
capability needed to resolve the live selector. Live refs should be explicit in
KPIR because they have different loading and correctness properties from pinned
refs.

## Range Dependency Closure

Ranges have endpoints and often need correspondence between endpoints.

```ts
interface RevisionRangeDependency {
  fromRevisionId: RevisionId;
  toRevisionId: RevisionId;
  objectIds?: readonly ObjectId[];
  selectors?: readonly ObjectSelector[];
  includeCorrespondence: boolean;
}

interface TimelineRangeDependency {
  timelineId: TimelineId;
  start: NormalizedTime;
  end: NormalizedTime;
  affectedObjectIds?: readonly ObjectId[];
  samplerCapability?: CapabilityDependency;
}
```

Revision ranges should include:

- endpoint snapshots or checkpoint closures
- compact edit summaries between endpoints
- correspondence maps for selected objects
- diff or comparison render capability when the range is visible as a
  comparison

Timeline ranges should include:

- timeline spec
- affected object states
- correspondence maps for animated parts
- sampler capability, if runtime sampling is required
- compiled samples only when the range is static and cheap to precompute

The default should favor deterministic specs plus cached runtime sampling over
shipping all sampled frames.

## Revision Checkpoints

Directly loading `rev80` should not require replaying every edit from `rev0`
unless the edit chain is small.

The compiler should emit revision checkpoint metadata.

```ts
interface RevisionCheckpointManifest {
  checkpoints: readonly RevisionCheckpointSpec[];
}

interface RevisionCheckpointSpec {
  revisionId: RevisionId;
  chunkId: string;
  coversObjectIds?: readonly ObjectId[];
  estimatedSizeBytes?: number;
}
```

To load a target revision:

```text
1. choose the nearest suitable checkpoint
2. load its snapshot chunk
3. load compact edit records from checkpoint to target
4. reconstruct only objects required by the entrypoint closure
```

The compiler can choose checkpoints by document size, edit distance, public
anchors, timeline endpoints, and frequently linked revisions.

## Code Dependencies

Code objects need special handling because source text, syntax trees, sidecar
anchors, queries, and language services have different costs.

```ts
interface CodeFileDependency {
  fileObjectId: ObjectId;
  revisionId: RevisionId;
  needsSourceText: boolean;
  needsAnchors?: readonly AnchorId[];
  needsCompiledParse?: boolean;
}

interface CodeQueryDependency {
  fileObjectId: ObjectId;
  revisionId: RevisionId;
  queryId: string;
  mode: "compiled-result" | "runtime-query";
  language?: string;
}
```

Rules:

- Static folded views should use compiled query results when possible.
- Tree-sitter WASM should be interactive or optional unless runtime querying,
  editing, or user-driven exploration is needed for first render.
- Copyable code ranges require source text.
- Semantic code refs require sidecar anchors and repair metadata.
- Live code editing requires language-specific editing and parsing
  capabilities.

This lets a code lesson render a static historical file range without loading
the full parser, while still supporting heavier runtime queries when a view
needs them.

## Authoring Dependencies

In the JavaScript-first authoring model, imports can be compile-time only.

```ts
import { matrix, rowReduce } from "@kp/linear-algebra";
```

If that import only constructs KPIR, it should appear in `authorOnly`, not in
browser `critical`.

Browser output should instead contain semantic requirements:

```json
{
  "requiredLibraries": [
    {
      "id": "linear-algebra",
      "capabilities": ["render"]
    }
  ]
}
```

Custom author code that creates runtime behavior must declare that behavior
explicitly.

```ts
uses({
  capability: "graph/webgl-render",
  asset: "/textures/grid.png"
});
```

Hidden dynamic runtime dependencies should be treated as compile errors or
manifest warnings unless the author declares an escape hatch.

## Object Library Declarations

Domain libraries should declare their capability dependencies in metadata that
the compiler and runtime can inspect without eager loading implementation code.

```ts
interface ObjectLibraryManifest {
  id: LibraryId;
  version: string;
  objectTypes: readonly KpObjectTypeId[];
  capabilities: readonly {
    id: CapabilityId;
    appliesTo: readonly KpObjectTypeId[];
    runtime: RuntimeCapabilitySpec;
  }[];
}
```

Object-specific dependencies can be computed from object data.

```ts
interface DependencyCapability<TData> {
  dependencies(
    object: KpObject<TData>,
    context: DependencyContext
  ): DependencySet;
}
```

Examples:

- A graph with a texture declares that texture as an asset.
- A 3D graph declares `graph/webgl-render`.
- A matrix table declares `linear-algebra/render`.
- A Rust source file static view declares `rust/render`.
- A Rust runtime query declares `rust/tree-sitter-query`.

## Layout Dependencies

Layout nodes participate in dependency closure. A split with an equation next
to a graph needs both child closures and the layout capability.

```text
split(eqView, graphView)
  -> layout/split render
  -> equation render closure
  -> graph render closure
  -> link/highlight capability if cross-view linking is active
```

If the graph is below the fold or inside a closed tab, its render dependency can
move from `critical` to `prefetch` or `interactive`, as long as the first render
shows an honest placeholder with stable layout dimensions.

## Loading Algorithm

The page shell should load in this order:

```text
1. load route manifest index
2. resolve URL to entrypoint manifest
3. fetch critical KPIR chunks
4. load critical libraries, styles, WASM, and workers
5. render stable first view
6. schedule prefetch dependencies
7. load interactive dependencies on intent
8. load optional dependencies on explicit request
```

The shell should deduplicate dependency requests across visible embeds. It
should also coordinate WebGL renderers so loading many graph dependencies does
not create too many active contexts.

## Missing Or Delayed Dependencies

Missing critical dependencies should render a typed error placeholder with the
entrypoint ID, missing dependency ID, and affected object or block.

Delayed interactive dependencies should leave the static view intact and show
disabled controls until the capability loads.

Missing optional dependencies should not break reading. The UI can hide the
optional tool or show a localized unavailable message.

Capability errors should be semantic, not generic chunk failures.

```ts
type DependencyLoadError =
  | { kind: "missing-library"; library: LibraryId }
  | { kind: "missing-capability"; library: LibraryId; capability: CapabilityId }
  | { kind: "missing-data"; chunkId: string }
  | { kind: "missing-asset"; assetId: string }
  | { kind: "version-mismatch"; library: LibraryId; expected: string; actual: string };
```

## Testing

The dependency compiler should have tests for:

- entrypoint closure generation for sections, anchors, figures, states, and
  ranges
- author-only imports not appearing in browser-critical manifests
- capability splitting by render, execute, inspect, analyze, and edit
- pinned state refs loading exact historical revisions
- revision ranges selecting checkpoints and correspondence maps
- code query dependencies choosing compiled results versus runtime Tree-sitter
- layout dependency classification for visible, below-fold, tabbed, and
  interactive children
- missing library and missing capability fallback behavior
- manifest determinism across repeated builds

Browser tests should verify that direct navigation to a middle anchor renders
without first loading optional heavy capabilities.
