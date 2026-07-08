# Branchable Object History Design

## Summary

Kinetic Press needs object data that can be addressed across two independent
dimensions:

- multiplicity: one semantic object can have many simultaneous screen
  representations
- time: a user, animation, comment, render node, or lesson step may refer to an
  object at a specific historical revision and animation time

The durable model should use a branchable revision graph, immutable document
snapshots with structural sharing, explicit pinned references, and transient
edit sessions for granular UI changes. Renderers consume snapshots or derived
view models; they do not own canonical object data.

## Goals

- Preserve historical object states after later edits.
- Support branchable history internally from the start.
- Use pinned historical references by default.
- Keep live references explicit and opt-in.
- Allow very granular transient edits without creating a committed revision for
  every pointer movement or input event.
- Support many render nodes for one semantic object.
- Avoid storing every animation frame as canonical object data.
- Keep generated render artifacts out of semantic snapshots.

## Non-Goals

- Expose a full branch-management UI in the first implementation.
- Build collaborative editing or merge conflict resolution in this design.
- Replace all existing renderers in the first implementation.
- Store sampled animation frames as durable semantic objects.
- Implement a full persistent hash-array mapped trie before it is needed.

## Revision Graph

History is a branchable directed acyclic graph. A revision is an immutable
committed state created at a meaningful edit boundary.

```ts
interface RevisionRecord {
  id: RevisionId;
  parentIds: readonly RevisionId[];
  snapshot: KpDocumentSnapshot;
  edit: EditRecord;
  createdAt: number;
}
```

Conceptually, revision nodes carry child pointers. Physically, child pointers
live in a graph index so historical revision records remain immutable.

```ts
interface RevisionGraphIndex {
  childrenByRevisionId: ReadonlyMap<RevisionId, readonly RevisionId[]>;
}
```

If the user edits from an older revision, the old future is preserved and a new
child branch is created:

```text
rev10 -> rev11
rev10 -> rev12
```

The initial UI can still present simple undo and redo. Internally, redo follows
the preferred child for the current revision.

```ts
interface HistoryCursor {
  currentRevisionId: RevisionId;
  preferredChildByRevisionId: ReadonlyMap<RevisionId, RevisionId>;
}
```

## Snapshots And Object Store

The current `KpDocument.objects` array should migrate toward a normalized
snapshot shape.

```ts
interface KpDocumentSnapshot {
  id: string;
  title: string;
  version: 2;
  rootObjectIds: readonly ObjectId[];
  objectsById: ObjectStore;
}
```

The serialized form remains JSON-friendly.

```ts
interface SerializedKpDocumentSnapshot {
  id: string;
  title: string;
  version: 2;
  rootObjectIds: readonly ObjectId[];
  objects: readonly KpSemanticObject[];
}
```

Object lookup is direct:

```ts
findObject(snapshot, objectId);
```

Ordered rendering can still be supported by projecting `rootObjectIds` back to
an object list:

```ts
snapshotObjects(snapshot);
```

## Structural Sharing

The storage contract is persistent, even if the first implementation uses
disciplined copy-on-write.

```ts
interface ObjectStore {
  get(id: ObjectId): KpSemanticObject | undefined;
  set(id: ObjectId, object: KpSemanticObject): ObjectStore;
  delete(id: ObjectId): ObjectStore;
  entries(): Iterable<readonly [ObjectId, KpSemanticObject]>;
}
```

Updating one object creates a new snapshot, a new store wrapper, and a new object
record only for the changed object. Unchanged objects keep their references.
Nested records should also preserve references where possible.

For example, changing `graph.camera.azimuthDegrees` creates a new graph object
and a new `camera`, but reuses unchanged nested records such as `debug`,
`shadow`, `light`, domains, and labels.

Generated data is not stored in snapshots:

- sampled surface meshes
- projected SVG paths
- WebGL buffers
- KaTeX measured rects
- texture atlases

Those artifacts belong in derived caches keyed by revision, timeline, object,
and render options.

## Pinned And Live References

Pinned refs are the default for historical correctness.

```ts
interface PinnedObjectRef {
  kind: "pinned";
  revisionId: RevisionId;
  objectId: ObjectId;
}

interface PinnedObjectTimeRef extends PinnedObjectRef {
  timelineId: TimelineId;
  time: NormalizedTime;
}
```

Live refs are explicit and resolve against the active editor snapshot.

```ts
interface LiveObjectRef {
  kind: "live";
  objectId: ObjectId;
}
```

Pinned refs are stable after later edits. Live refs are convenient for active UI
bindings but may resolve differently as the document changes.

## Timelines And Reconstruction

A timeline stores deterministic animation intent and endpoints. It does not
store every sampled frame.

```ts
interface TimelineSpec {
  id: TimelineId;
  kind: "surface-morph" | "equation-motion" | "camera-move";
  sourceRevisionId: RevisionId;
  targetRevisionId?: RevisionId;
  affectedObjectIds: readonly ObjectId[];
  durationMs?: number;
  tracks: readonly TimelineTrackSpec[];
}
```

Resolving a pinned object-time ref means:

1. Load the pinned revision snapshot.
2. Load the timeline spec valid for that revision.
3. Build or retrieve a cached sampler.
4. Sample the object or view model at the requested time.

The sampled result may be a render/view model rather than a canonical
`KpSemanticObject`. A surface morph may resolve to a sampled mesh model. An
equation motion may resolve to token poses. Canonical snapshots remain semantic
and immutable.

## Edit Sessions

Interactive edits use transient sessions. A session can update as often as the
UI needs, but it commits one revision at a meaningful boundary.

```ts
interface EditSession {
  id: EditSessionId;
  baseRevisionId: RevisionId;
  workingSnapshot: KpDocumentSnapshot;
  draftOps: readonly ObjectPatch[];
  status: "active" | "committed" | "cancelled";
}
```

During a slider drag, renderers read from the working snapshot. On pointer up,
the editor commits one revision.

```text
rev10 committed
  draft denominator 4.1
  draft denominator 4.2
  draft denominator 8.0
rev11 committed: denominator 4 -> 8
```

Commit policy:

- Pointer drag: commit on pointer up.
- Text input: commit on blur, Enter, or a deliberate debounce boundary.
- Animation authoring: commit on explicit keyframe or step creation.
- Programmatic batch edit: one transaction creates one revision.
- Cancelled gesture: discard the edit session and create no revision.

## Render Multiplicity

One semantic object can have many render nodes at once:

```text
saddle-surface
  -> SVG fallback quads
  -> WebGL mesh
  -> debug shadow overlay
  -> object inspector row
  -> timeline thumbnail
```

Render nodes register references back to semantic objects. They do not own
semantic truth.

```ts
interface RenderNodeRecord {
  id: RenderNodeId;
  objectRef: PinnedObjectRef | PinnedObjectTimeRef | LiveObjectRef;
  role: RenderRole;
  backend: "svg" | "webgl" | "html" | "katex";
}

interface RenderIndex {
  nodeById: ReadonlyMap<RenderNodeId, RenderNodeRecord>;
  nodeIdsByObjectId: ReadonlyMap<ObjectId, readonly RenderNodeId[]>;
  nodeIdsByRevisionId: ReadonlyMap<RevisionId, readonly RenderNodeId[]>;
  nodeIdsByTimelineId: ReadonlyMap<TimelineId, readonly RenderNodeId[]>;
}
```

This lets selection, highlighting, stale-node detection, timeline thumbnails,
and debug overlays all use the same reference model. DOM `data-kp-*` attributes
remain useful for debugging and tests, but hot paths should use the render
index.

## Module Boundaries

The history system should stay separate from rendering.

```text
src/semantic/document.ts        object types and serialization
src/semantic/snapshot.ts        snapshots and object-store helpers
src/history/revision-graph.ts   revision DAG, child index, cursors
src/history/edit-session.ts     transient working snapshots and commit policy
src/history/refs.ts             pinned and live refs
src/rendering/render-index.ts   render node registration and lookup
```

Renderers receive snapshots or sampled view models. Renderers do not mutate
history. The editor UI owns edit sessions and commits.

## Error Handling

Reference resolution should return typed errors, not ambiguous `undefined`
values in public APIs.

```ts
type RefResolutionError =
  | { kind: "missing-revision"; revisionId: RevisionId }
  | { kind: "missing-object"; revisionId: RevisionId; objectId: ObjectId }
  | { kind: "missing-timeline"; revisionId: RevisionId; timelineId: TimelineId }
  | { kind: "missing-active-snapshot"; objectId: ObjectId };
```

Stale render nodes are not fatal. They can be marked stale or unregistered.

## Migration Path

The first implementation can be incremental:

1. Add snapshot helpers that wrap the current `objects` array behavior.
2. Add `RevisionRecord`, `RevisionGraphIndex`, and `HistoryCursor`.
3. Convert editor state from a raw `KpDocument` to a current revision cursor.
4. Add edit sessions for one high-frequency control, such as the saddle
   denominator slider.
5. Add pinned and live refs.
6. Introduce render index registration for graph/WebGL nodes.
7. Migrate renderers from ordered arrays to snapshot helpers gradually.

## Testing

Focused tests should cover:

- unchanged object references are preserved across snapshot updates
- changed objects get new identities
- parent and child indexes update when a revision is committed
- branching from an old revision preserves both branches
- pinned refs resolve to old data after later edits
- live refs resolve to current data
- edit sessions produce many working states but one committed revision
- cancelled edit sessions create no revision
- render index maps one object to multiple render nodes
- stale render nodes can be detected by revision mismatch

