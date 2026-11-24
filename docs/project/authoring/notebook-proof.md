# Structured notebook proof

Status: implemented local exemplar, awaiting human interaction review. This is
the bounded [approved composition proof](../reviews/2026-11-24-next-step-review.md),
not a general notebook platform or migration of existing lessons.

Open the [editor](http://127.0.0.1:8000/experiments/notebook/) or the separate
[reader](http://127.0.0.1:8000/experiments/notebook/reader.html).
Use `npm run dev:service:start` in `.worktrees/kp-product` if the persistent shared
server needs starting. `dev:service:status` reports its launchd processes; leave
them running until shutdown is requested.

## What to try

1. In **Compare two inputs**, scrub the two animations to different moments.
2. Edit **First input**, replace its matrix with `[[3,0],[1,1]]`, then **Save block**.
   Only the first scene changes its mathematical input. Both keep their positions.
3. Open **Shared matrix workshop** in a second tab. Edit **Shared transformation A**
   to `[[2,2],[3,4]]`. Both live imports in the first tab update, retaining their
   different local input matrices. Return either matrix to its original values
   through the same editing controls when desired.
4. Collapse and expand **Compare the two explanations**. Playback pauses while
   folded; unfolding preserves the held position. Move or unnest a section, then
   reload: the document structure, UUIDs and saved positions survive.
5. Edit an imported occurrence to select a different matrix resource for either
   declared component input. **Use source default** removes that local binding.
   **Open shared source** changes editing context explicitly.
6. Download notebook JSON. Import accepts a new notebook UUID and retains its
   resource IDs and revision. It refuses to overwrite an existing notebook.
   Export each required notebook to transport a cross-notebook composition.

The review question is whether this makes local work and shared consequences
understandable. The visible nesting is deliberately explicit; judge whether the
outline, fold controls and source/occurrence distinction help or feel cumbersome.
These interactions are not yet accepted as a shared authoring design.

## Storage and authority

The checked-in seeds are `content/notebooks/shared-matrix.json` and
`content/notebooks/compare-inputs.json`. The first open initializes a browser-local
IndexedDB workspace (`kp-notebook-proof-v1`). Later opens retain saved documents;
they do not overwrite them with seeds. Editor and reader on the same origin share
that store. The application does not write lesson files or synchronize browsers,
devices, hostnames, or ports. Downloaded JSON is the portable backup.

Each save is a read/write IndexedDB transaction comparing the notebook's expected
revision, then replacing its validated JSON atomically. A stale save preserves
both the stored content and the editable draft. BroadcastChannel notifications
cause other views to reread committed state. They are not a second data authority.
Closing and reopening a connection preserves resource identity.

Fold/playhead state is separate localStorage data, scoped to notebook and occurrence.
Unsaved inspector drafts use per-tab sessionStorage; reopen the block after a
reload to recover them. A recovered draft against an older revision is held for
manual reconciliation. Structural controls require saving the current draft first.
Undo restores the previous saved document as a new revision and rejects intervening
saves. It is one-level, session-local undo, not a durable revision history.

## Document contract

Version 1 stores notebook UUID, monotonic local revision, title and recursive
children. Supported blocks are `section`, plain-text `prose`, numerical 2x2
`matrix`, `component`, `scene` and live `import`. Every addressable block and
component input has a persistent UUID. Namespaced JSON metadata is retained.
Unknown schemas/types are rejected without overwriting their original input;
extension rendering and rich-text schemas are not implemented.

Sections organize content. Components establish explicit lexical boundaries with
UUID-addressed inputs and matrix-resource defaults. A scene binds an operand to
either a resource reference or one of its component inputs. Imports resolve in
the source's scope; destination names cannot be accidentally captured. The initial
input type is a matrix resource, not arbitrary JavaScript computation.

Resources use `{ notebookId, nodeId }` references. Imports have their own UUID and
local bindings; resolved occurrence keys include the import path. Ordinary section
moves do not change occurrence keys. Duplicate operations assign fresh UUIDs and
remap references inside the duplicated subtree while retaining external references.
Canonical node, occurrence, semantic object, local revision and runtime instance
are distinct identities.

`src/notebook/validation.ts` validates I/O; `transactions.ts` provides pure
revision-based rename, prose/matrix/metadata edit, binding, insert, move, delete
and duplicate operations. GUI controls use this same boundary. `resolve.ts`
resolves scopes, imports and dependencies, reporting missing resources, binding
errors, cycles and bounded-expansion limits explicitly. There is no LLM client.

## Animation boundary

The canonical reference is the existing matrix column-combination player:
`/experiments/matrix-column-combinations/?input=dependent-columns`.
Mathematical objects and products remain owned by `src/math/authoring/matrices.ts`
and `matrix-product.ts`. The notebook reuses `columnExampleFromProduct`,
`columnCardHtml` and `mountColumnPlayer`, including native KaTeX presentation and
the existing reader clock. No new mathematical operation or choreography was added.

The shared numeric-presentation guard checks factors, intermediate products and
sums. Scientific notation remains unsupported by the animation; static matrix
objects render exponent notation as multiplication by a power of ten. An invalid
scene edit retains the saved valid source and its draft. Recomputed dependency
signatures replace affected players only. Unrelated prose edits do not remount
scenes. Changed inputs preserve the held fraction of this fixed seven-stop story.

## Limits and verification

Live local imports are implemented. Pinned publication, forks with provenance,
structural override rebasing, semantic clips, arbitrary execution, a plugin SDK,
multi-user synchronization and cross-block rich-text editing are deferred.
The reader requires JavaScript and local browser storage; it is not static public
publication. Narrow screens retain the existing horizontally scrollable matrix
stage. Production font/CSS assets are bundled; authoring code is excluded from the
independent reader build.

Stable checks:

- `npm run test:notebook`
- `npm run typecheck:notebook`
- `npm run visual:notebook` (Chromium discovery, including actual production assets)
- `npm run build:notebook`
- `npm run test:matrix-source` (shared guard's existing consumers)

The approved first human checkpoint precedes a broad browser/aesthetic matrix or
generalization to other scene families.
