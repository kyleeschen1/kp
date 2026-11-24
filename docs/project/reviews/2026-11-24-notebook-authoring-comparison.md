# Notebook authoring: compare authority on one real lesson

Status: design assessment requested by the user; implementation and source-model
migration are proposed, not approved. No active product commitment changes.

## Recommendation

First test a bounded notebook-style authoring surface over the existing
fractional lesson source. Keep one Markdown authority, its checked save and
immutable reading history, and its current mathematical renderer. The experiment
should expose prose/annotation editing and whole-section movement without asking
the author to manipulate the story JSON directly. Judge authoring usefulness
before building the full notebook editor in the imported handoff.

Recursive JSON is a credible successor when persistent section identity and
cross-document structural reuse become required authoring operations. It is not
necessary merely to put an outline or block controls around this lesson. A
source-preserving pilot will not establish the complete notebook architecture.

This comparison uses the imported `kp-notebook-architecture-handoff.md`, dated
2026-11-24, in the parent checkout's `docs/project/inbox/`. Its exact SHA-256 is
`f90a5e3eb870cb7d6435f18a0a20f3d5bed61f6052a169da7fcd5e6c6c95e084`.
The imported file remains unmodified and uncommitted there; its embedded
implementation instructions confer no execution authority.

## Reference and actual current owners

Open [the unchanged fractional reading](http://127.0.0.1:8000/reader/solve-fractional-linear/?reading=reasoning).
Inspect the opening, the equation theater, the alternative legal route, and the
changed-case question. The design question is whether an author can rearrange
and revise this material while understanding what will remain the same.
Its explanatory quality is still awaiting editorial review.

- Working manuscript: [fractional-linear-reasoning.article.md](../../../content/authoring/algebra/fractional-linear-reasoning.article.md).
- Selected reading and exact archives: [reading registry](../../../content/authoring/algebra/fractional-linear-readings.json)
  and [fractional reading owner](../../../scripts/fractional-reading-page.ts).
- Canonical host: `/reader/solve-fractional-linear/?reading=reasoning`, compiled
  by [the fractional lesson compiler](../../../src/reader/compiler/fractional-linear-equation-lesson.ts)
  through [the existing equation page](../../../src/reader/compiler/equation-exemplar-page.ts).
  It uses the document theater and `/src/reader/app/exemplar-entry.ts`; the
  native KaTeX equation path owns presentation.
- Semantic truth: the existing fractional equation asset/model and its six
  checked operations. [Passage bindings](../../../src/reader/compiler/fractional-passage-operations.ts)
  constrain operation order; prose position does not authorize a different solve.
- Local revision: [checked save](../../../scripts/what-counts-revision.ts)
  validates through the actual reader, archives exact source, checks a basis,
  and atomically replaces the registry pointer. Selection is not publication.

An important qualification to the initial import assessment: this actual
manuscript is Markdown with a `kp-animation-story` fence, not a
`kp.article.v1` directive document. Its
[parser](../../../src/reader/compiler/lesson-markdown-parser.ts) supports
headings, paragraphs, and that story block; inline prose is plain text or semantic
focus links. Ordinary code blocks, lists, rich text, and arbitrary external
links are not accepted by this parser. The broader
[Article v1 contract](../principles/kp-article-v1.md) and
[language service](../../../src/article/kp-article-language-service.ts) are
another real path, not an interchangeable parser for this exemplar.

The product package already declares CodeMirror and Svelte 5. It does not
declare ProseMirror. A generic rich-text editor cannot be dropped into this
lesson without deciding which authored constructs the compiler can preserve.
Likewise, a shared asset ID does not prove that an arbitrary scene block mounts
the canonical presentation or supports a second independent occurrence.

## The same author workflow under both designs

Use this one lesson for the comparison. Proposed section labels below are
design examples; the saved lesson has not been changed.

| Author action | A: preserve the existing source | B: recursive JSON becomes authoritative |
| --- | --- | --- |
| Revise the opening explanation or an annotation | The UI edits the corresponding source range/checked story field in one Markdown draft. Compile that draft through the existing lesson owner. | Edit a prose or scene-note node through a validated transaction. A new domain adapter must lower the supported content into the existing lesson/compiler boundary. |
| Group the final material into “Compare two legal routes” and “Try it yourself,” then move a section | Derive a section from a heading and its following source range, ending at the next heading of equal or shallower depth. Move exact text as one transaction; keep the story fence atomic. | Move the section node and its descendants, preserving their node IDs. Relative heading depth is derived from occurrence placement. Reject containment cycles and invalid destinations. |
| Reuse this animation in another explanation | Reference the same registered semantic asset through an approved lesson binding. The existing original/reasoning readings already demonstrate two prose readings of it. A new reading still requires registration; arbitrary insertion is not an existing picker capability. | Add a scene-reference node with its own occurrence identity. The domain adapter still has to select the canonical host, validate inputs and isolate playback. JSON alone does not supply these capabilities. |
| Save, reopen, and return to an older review location | Reuse checked save, selected snapshots, and version-qualified URLs. The existing CLI already performs this transaction; a GUI binding is additional work. | Store the canonical JSON revision atomically, retain earlier revisions and explicit mappings from migrated addresses. Markdown becomes an export or import boundary, not a second independently editable authority. |
| Reuse a paragraph/section live in two notebooks | Not supplied by the current lesson format. Article v1's future prose-inclusion direction is explicitly pinned, so live reuse needs a new accepted contract. | A natural use of explicit node and occurrence IDs, but resolver policy, cycles, invalidation, conflicts and revision pinning still require implementation. |

In either design, moving “Try it yourself” earlier changes the authored argument
and deserves editorial judgment. It must not silently reorder subtraction and
multiplication or alter the equation's semantic transition sequence.

## Findings that change the decision

The existing prose parser generates paragraph IDs from their order and heading
IDs from their titles. These are useful within a pinned revision but are not
persistent node identities across arbitrary edits. An editor must not present
`paragraph.4` or a heading slug as a durable identity when moving or renaming it.

Exploratory, in-memory compilation accepted a prose revision, added headings,
and a swap of the two final prose sections, retaining all six operation
bindings and the exact original story fence. Moving those sections changed the
generated IDs of five unchanged paragraphs (`paragraph.4`–`paragraph.8`).
This is a direct consequence of `parseParagraph` in the linked parser, not a
claim that the existing UI supports section transactions.

Duplicating the story fence verbatim was rejected for duplicate identity.
The compiler also builds one equation-page template and binds the first
hydration block's operations. A proper multiple-occurrence design must inspect
and extend that ownership boundary; merely changing copied IDs is not proof of
independent, correct playback. Neither alternative gets generic transclusion
by wrapping existing markup in a new object.

Current immutable source versions preserve old addresses. They do not promise
that an address migrates to its intended paragraph in a newer version. That
distinction lets a small pilot be useful without pretending it has solved
live section identity, comment rebasing, or cross-version transclusion.

## What each alternative costs and earns

**A earns faster evidence about authoring.** It reuses a functioning equation
reader, source compiler, semantic checks, revision transaction, and exact
historical return. It still needs a lesson-specific editor adapter: the existing
Article v1 CodeMirror language service is not wired to this story syntax.
Section controls need source-range validation against the current draft
revision, a single undo owner, and stale-edit rejection. Derived ranges are
temporary edit coordinates, not resource identities.

Its limit is substantive: arbitrary rich-text blocks, persistent nested nodes,
stable cross-document paragraph references, live transclusion and independent
scene occurrences remain unsolved. Bolting those on through more positional
sidecars would eventually undermine the simplicity argument. If those are
required immediately, choose the stronger model rather than claiming A covers it.

**B earns explicit structural ownership.** Stable nodes, subtree operations,
identity-based patches and occurrence-aware reuse fit naturally in a recursive
document. It also provides an obvious place for section titles that are
independent of rendered heading depth. JSON remains a representation: typed
domain owners still establish mathematical truth and supported animation inputs.

Its cost is a new authoring authority plus import/migration, validation,
serialization, domain lowering, persistent revision storage, address
compatibility and editor coordination. The current save transaction accepts
Markdown and a bounded algebra owner; it is not a general JSON notebook store.
Its invariants can inform that store, but widening it is separate engineering.
Keeping an independently editable Markdown copy would create two authorities;
an export must be one-way or an explicit, validated import transaction.

The handoff's ProseMirror payload would additionally make its schema part of
persistence. That may be worthwhile, but needs an explicit supported-content
and unknown-extension policy. No library evaluation, dependency addition or
JSON prototype was performed for this assessment.

| Criterion | A: source-preserving pilot | B: canonical JSON notebook |
| --- | --- | --- |
| Existing authoring/revision path | Reuses it, with a missing UI adapter | Replaces persistence and adds lowering |
| Stale-system reduction | Does not unify existing source grammars | Can consolidate later, but initially adds a migration boundary |
| Reliable first demonstration | Smaller change around a checked reader | More new failure boundaries before first use |
| Structural reuse | Deliberately limited | Better fit once live nodes/occurrences are required |
| Slice size and speculative risk | Lower for this one lesson | Higher for the proposed first phase |
| Continuity | Existing pinned return; no cross-revision node promise | Potential stable-node continuity; migration must establish it |

These are source-based qualitative judgments, not measured implementation-time
or usability estimates.

## Proposed smallest experiment and decision gate

One KP-local authoring view for this registered lesson, connected to its existing
reader. Reuse installed editor primitives and the accepted host conventions;
do not create a new application framework or require Spindle. The independent
workbench may later host this capability as a client. Its recorded
native-conversation integration is not assumed to provide notebook editing.

The experiment's finish line is one complete author cycle:

1. Open this reading; edit one explanation or note through a constrained control.
2. Group/move the final prose sections as exact source transactions. Treat the
   animation block as one unit; preserve its semantic and beat IDs.
3. Check and save through the existing owner. Invalid or stale edits preserve
   the selected valid reading and retain the draft for correction.
4. Reopen the result and an earlier version-qualified link. Show that each has
   its own wording and that the six mathematical operations are unchanged.
5. Judge whether the controls made a substantive revision easier, and identify
   the first desired operation the retained source cannot responsibly express.

Required safeguards: no unrelated source rewriting; no fabricated persistent
paragraph identity; no arbitrary module/export execution; one draft/undo owner;
clear selection invalidation after a conflicting external edit; existing static
and semantic truth retained. Scene/playhead continuity during preview is an
acceptance question to test, not an established benefit of either data format.

The independently reversible unit is the new authoring view and its bounded
source-edit/save adapter. Preserve the selected manuscripts, existing reading
registry/history, equation model, reader host and compositor. Stop at one human
authoring checkpoint before adding broad block types, drag/drop, another editor,
or generic renderer APIs. Check the reader import closure at that boundary;
current architecture tests do not certify a hypothetical future client.

**Choose B next when the actual authoring task requires a section to be a
persistent reusable resource across notebooks or revisions.** Before expanding,
prove one existing lesson import, one section move/rename with identity retained,
one repeated scene through the canonical runtime, and old-link compatibility.
Decide live draft references versus pinned published references explicitly.
Do not implement an entire rich-text notebook to discover whether these are
the operations the author needs.

A notebook envelope that only links whole existing Articles could organize
resources cheaply. It is a distinct, weaker option: it would not supply the
section-level editing and reuse that motivate this handoff.

## Evidence and limits

Inspected product checkout: `feature/20261031-annotation-reader`, baseline
`b10192a5e7d55e3ec88c23c57ff34090aa7a9af0`. Source inspection covered the
manuscript, parser, document model, reader compiler, annotation/operation
bindings, registered reading transaction, Article v1 contract/editor, package
dependencies, and the editor workbench's existing ownership record.

Executed:

```sh
node --disable-warning=ExperimentalWarning --test tests/fractional-reading.test.ts tests/what-counts-revision.test.ts tests/semantic-reader-lesson-markdown-parser.test.ts tests/semantic-reader-architecture.test.ts
```

All 26 existing tests passed. They pressure exact prior readings, invalid and
stale drafts, snapshot collisions, failed writes, semantic targets, parser
limits and dependency direction. The local canonical reading returned HTTP 200;
launchd reported both services running. The in-memory comparison changed no
manuscript, snapshot or registry selection. Its throwaway probe was removed.
No new visual implementation, browser review, timing benchmark, production
bundle certification or learning-efficacy result is claimed.

## Place in the wider conversation

This is a temporary architecture exploration within the existing authoring-first
direction, not a replacement of the programme or acceptance of the notebook
handoff. No older plan is marked stale by this assessment. The imported plan
remains a proposal; the proposed pilot is not an implementation run.

Return afterward to the ecosystem-orientation grill. Accepted discussion points:
a separate stable systems map with product purposes attached; TUI return cues;
pointing at map elements to establish conversational context; continuous agent
maintenance with interpretations visibly provisional; and departures retaining
their prior path as the default return. The open question is one primary human
focus with surrounding active/parked/review tracks versus several equally
prominent active threads. This record preserves the conversation, not authority
to build that dashboard or to merge its model with the notebook model.
