# Next step: prove a compositional notebook on two documents

Date: 2026-11-24
Status: user approved sustained implementation of this bounded proof on November
24 ("go for as long as possible"). Execution is tracked by
`run-contract.kp.notebook-proof-20261124.v1`, with four outcome packages, a six-hour
ceiling and forty-five-minute verification reserve. Commit recoverable packages,
back up at least hourly, and stop at the human exemplar checkpoint before rollout.
The broader authoring-to-practice programme is retained as the return path.
The ecosystem dashboard grill remains parked with its return point preserved.
Subsequent implementation and checks: [exemplar review packet](2026-11-24-notebook-proof.md).
The design assessment below is preserved as the scope source; the review packet
records what is now implemented and what still needs human judgment.

## Why the recommendation changed

The user's clarified requirements are a structured computational document:
custom blocks and metadata; nested components and animations; variable scope;
persistent UUIDs across notebooks and sessions; localized edits; object and
animation reuse; cross-notebook imports; and foldable animations. Jupyter and
Observable are user-selected precedents.

These requirements supersede the recommendation in the
[earlier comparison](2026-11-24-notebook-authoring-comparison.md) to prioritize a
Markdown-backed editor. Its source inspection and existing-test evidence remain
valid. Markdown may be imported, exported, or used inside prose blocks, but should
not own the new notebook's outer structure.

The imported handoff remains unmodified in the parent checkout's
`docs/project/inbox/kp-notebook-architecture-handoff.md`; SHA-256
`f90a5e3eb870cb7d6435f18a0a20f3d5bed61f6052a169da7fcd5e6c6c95e084`.
Its architecture is a proposal; embedded execution instructions are not authority.
No wholesale lesson migration or dependency adoption is implied.

## Recommendation

Design a short document contract, then implement one reversible, independently
reviewable proof with two notebooks and an existing KP animation. Bring scoped
reuse forward from the handoff's second phase; delay broad editor polish. The
first proof must exercise the reasons for structured JSON, not merely render a
flat list of cells saved in a new file format.

| Candidate | Authoring fit | Stale-system reduction | Reliability/demo value | Reuse and continuity | Scope/risk | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| Markdown-backed editing pilot | Misses the clarified structural requirements | Small change but leaves the missing model | Lower integration risk | No persistent cross-revision node identity | Small, but tests the wrong premise | Superseded |
| Full notebook editor before reuse | Broad controls sooner | Adds a new authority before proving integration | Can look complete while ownership is unresolved | Reuse and scoped updates deferred | Large speculative surface | Defer |
| Two-notebook composition proof | Tests the actual requirements with minimal controls | New authority only for the exemplar; no claimed consolidation yet | Exposes runtime, persistence and import boundaries early | Directly tests identity, scope and independent occurrences | Bounded but substantive integration | Recommend |

These are qualitative source-based judgments, not delivery estimates.

## Contract to settle before implementation

Keep canonical containment, rendered occurrences, lexical scope and dependencies
distinct. A section is an organizational container; it does not automatically
create a new lexical scope. Explicit components declare inputs and exported
resources. Imported definitions resolve their own dependencies and accept
explicit bindings, rather than capturing names from their destination.

Persist UUIDs for addressable notebooks, nodes and reusable definitions, with
separate occurrence identities. Revision identity and runtime-instance identity
remain distinct. Moves/renames preserve node UUIDs; duplication assigns fresh
UUIDs and remaps internal references. Session identity must not become a resource
address. Use readable names for authors and UUID-backed references for storage.

Use typed, validated node transactions with a revision precondition. GUI and
future LLM clients must use the same mutation boundary. Reject containment cycles,
unsupported bindings and dangling references explicitly. Separate namespaced
extension metadata from required typed behavior.

Define local versus shared edits visibly: edit this occurrence's bindings, edit
the canonical source, or fork. A local change can update its declared dependents;
it must not reset unrelated editors, scenes or playheads. Dependency recomputation
and narrative playback are distinct operations.

For the first example, recommend explicit live imports with revision provenance
in local authoring. Test updates to open and reopened consumers. Keep publication
out of scope; do not promise pinned imports without immutable JSON revision
storage. Folding is presentation/session state by default, separate from authored
content. Preserve the semantic moment across fold/unfold; define pause/resume and
resource disposal explicitly before choosing a rendering implementation.

## One observable proof

Notebook A owns a reusable component containing an existing KP animation and a
supported semantic object/input. Notebook B imports it twice inside a foldable,
nested section, with two explicit bindings and independent occurrence state.
The proof must reuse an object by reference/binding, not merely copy scene markup.

Walk through these actions:

1. Edit prose and metadata, nest/move/rename the section, save and reopen it.
   UUIDs and references survive. Unrelated source regions remain semantically
   unchanged; inspect the transaction/diff.
2. Scrub the two animation occurrences to different moments. Edit one occurrence's
   supported input. Its dependent content updates while the other occurrence and
   unrelated scenes retain their state.
3. Edit the canonical component in A. Both live imports observe the change while
   retaining their local bindings, or report a precise incompatible-binding gap.
   Reopening B resolves the current source rather than a stale copied payload.
4. Fold/unfold and reorder the containing section without losing identity or the
   saved semantic moment. Missing/deleted sources and reference cycles produce
   bounded diagnostics instead of crashes or silent substitutions.
5. Open the same JSON notebook through a reader entry without loading authoring
   editors or the external workbench. Preserve existing reader URLs separately.

This is a proposed acceptance walk-through, not an implemented capability.

## Existing runtime integration is the first technical uncertainty

Implementation selection: use the existing numerical 2x2 matrix column-combination
player instead of extending the fixed fractional equation. Canonical reference:
`/experiments/matrix-column-combinations/?input=dependent-columns`. Semantic owners
are `src/math/authoring/matrices.ts` and `matrix-product.ts`; the existing
`columnExampleFromProduct`, `columnCardHtml` and `mountColumnPlayer` own the checked
projection, native KaTeX card and playback lifecycle. New notebook host:
`/experiments/notebook/`; canonical sources are `content/notebooks/shared-matrix.json`
and `compare-inputs.json`. No new choreography or mathematical operation is needed.
The notebook proof uses existing generic milestone cues so input edits do not
retain prose claiming a particular numeric answer.

Use the current fractional reader as a preservation reference:
[canonical reading](http://127.0.0.1:8000/reader/solve-fractional-linear/?reading=reasoning).
Its source is `content/authoring/algebra/fractional-linear-reasoning.article.md`;
the fractional lesson compiler hosts the document theater/native KaTeX path;
its existing equation asset and checked operation bindings own semantic truth.

Do not assume it is already a parameterized notebook component. The current
lesson-model factory takes no mathematical inputs, and the page compiler uses
the first hydration block for its equation presentation. Before implementing the
proof, inspect the existing scene capabilities and select a supported reusable
object/input and independently mountable scene. Record the exact asset, host,
renderer and semantic owner. If the fractional scene is chosen, a bounded adapter
must prove those missing capabilities; changing a title does not prove scope.
If another existing scene offers them, state the exemplar change explicitly.

Keep the specialized runtime and validity checks. Do not introduce a general
JavaScript execution engine merely to propagate document transactions. Observable
Runtime adoption requires a concrete computation requirement and a bounded
comparison; dependency notifications alone do not establish that need.

The first UI needs insertion/selection, basic prose and supported input controls,
move/nest, fold, save and preview. Use installed framework/editor conventions.
Decide rich-text persistence before adopting an editor schema. Defer arbitrary
code execution, full cross-block editing, drag/drop polish, override rebasing,
semantic clips, flashcards and a general extension ecosystem.

## Review and rollback boundary

Finish one exemplar and stop for human authoring/interaction review before
generalizing. Early checks should cover durable identity, transaction atomicity,
save/reopen, bindings and affected dependencies, independent lifecycle cleanup,
and reader dependency separation. Do not build a broad visual matrix before the
interaction is judged useful.

The rollback unit is the notebook feature entry, its two JSON artifacts and the
bounded document/runtime adapter. Existing manuscripts, registry history, public
reader paths and semantic animation models remain intact. No project-wide source
migration is part of this proof.

## Precedents and limits of this review

- [Jupyter format](https://github.com/jupyter/nbformat/blob/main/docs/format_description.rst):
  JSON cells, metadata and output presentation state. Its flat list and
  notebook-local ID uniqueness do not establish recursive cross-notebook ownership.
- [Classic Observable imports](https://observablehq.github.io/documentation/notebooks/imports):
  named-cell reuse, dependencies, input substitution and version locking. This is
  precedent, not a claim that its current product format is our proposed JSON tree.
- [Classic Observable evaluation](https://observablehq.github.io/documentation/cells/observable-javascript):
  dependency-driven updates and invalidation cleanup. These motivate explicit
  dependencies and lifecycle ownership, not automatic animation restart.

At the original design assessment, reviewed roadmap, strategy, active thread,
handoff and existing fractional compiler. That assessment claimed no code changes,
new usability result or new test run. The previous
comparison records 26 existing passing tests. `theseus work resume`, including a
retry with `--limit 1`, failed its output budget (1718 tokens versus 1200); live
execution status was not refreshed and no run state was changed. This design
assessment does not require resuming or repairing an execution contract.

## Return path

The notebook serves the approved authoring-first product purpose: compose and
revise explanations with reusable semantic material. It is an approved bounded
detour, not a replacement for the authoring-to-practice programme.
After reviewing the bounded proof, return to the parked orientation/dashboard grill:
one primary human focus versus several equally prominent active threads.
