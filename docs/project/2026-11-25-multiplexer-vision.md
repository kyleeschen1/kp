# A persistent workspace for connected work

Status: recorded product direction; implementation is selected through bounded successors.
Source: the November 25 conversation, culminating in “record all of that so we
can implement the full vision.” The current approved implementation is the
[workspace presentation exemplar](reviews/2026-11-25-workspace-modeline.md).

## Purpose and provenance

The user proposed a tmux-inspired workspace with consistent Vim navigation,
commands, finders, buffers and a bottom modeline. It should hold Codex
conversations, common files, KP explanations, notes and useful bespoke tools.
The user's central problem is “hermeneutic loss”: after examining a part or
following a productive detour, recovering its relationship to the whole costs
attention. Agents finishing work should provide timely feedback and clear cues
for what needs inspection and where to resume.

Stable IDs, custom nested structures, metadata, localized changes and reusable
objects are explicit user requirements. The user also proposed MCP as a common
editing protocol, agent-cultivated todos, and generating/shipping new affordances.
The object boundaries, storage recommendation and staged proofs below synthesize
that discussion; their details remain reviewable, not demonstrated capabilities.
This horizon complements authoring and practice; it does not replace KP's
domain-specific semantic or rendering authority or authorize every future slice.

## Workspace and interaction

- A resource is durable content or a conversation. A buffer is a reading/editing
  interaction with it. A pane displays a buffer. A workspace records an arrangement
  and useful return context. Closing a pane need not close its resource or agent.
- Save useful combinations of conversations, common files and splits. Preserve
  drafts, selections, folding and reading positions independently of incoming output.
- Use a bottom modeline: the actual focused surface and its Vim mode at the left,
  useful window/workspace selection in the middle, local weekday/date/time at the
  right. Later, add agent completion and review counts backed by real state.
- Share command definitions between keyboard bindings, transients, help and fuzzy
  finding. A finder should expose human-readable names, object kinds and context;
  stable IDs support links without becoming the everyday UI.
- Keep the accepted simple split as the present exemplar: Codex left, KP right,
  equal outer widths, stationary global masthead, no moving/overlapping stack.
  The sliding overlay and recency stack were explicitly rejected.
- The joined chat has separate read-only transcript and editable composer states,
  speaker cues, code/tool folding, navigation, multiline drafts and independent
  scroll behavior. The composer remains visible. Native conversation state stays
  outside ProseMirror; editors render and edit their own appropriate surfaces.
- Common libraries may eventually supply windows, faces/themes, commands,
  pickers, transients, rows and editing. Extraction needs real consumers and must
  preserve the existing CLJS Spindle/workbench boundary rather than rebuilding it.

## Contextual return and identity

A meaningful return point includes the exact place, parent objective, why the
detour began, the question still open, relevant evidence, next action and view
state. Automatic navigation history and explicit commitments/decisions are
different records. Back/forward, return to parked work, and restore an entire
layout are different operations; following a link should not unexpectedly
rearrange the workspace.

Link tasks to passages, animation components, conversations, specific turns,
results and return points. Distinguish a link that follows the current object
from evidence pinned to a revision. Deletion, splitting and replacement require
explicit reference resolution; DOM positions and display order are not identity.
An agent's resumption packet should be a compact account with source links,
including unresolved questions and the surrounding plan, not a replacement for
the evidence or an ever-growing transcript dump.

## Conversations and coordinated agents

Keep native Codex concepts distinct from workspace organization:

- A thread is a durable conversation; turns are individual exchanges/runs.
- Topics organize discussion and do not themselves create isolated model context.
- Forking branches conversation history; delegation creates worker conversations.
- A native session-tree identifier, a thread ID and a saved workspace ID have
  distinct meanings. Resume by the actual native thread ID.
- Separate conversations do not automatically isolate filesystem work; concurrent
  implementation still needs explicit ownership and, where appropriate, worktrees.

Show the coordinator and its children, their assignments, current activity,
last meaningful update and inspectable transcripts. Opening a worker should not
interrupt it. Track execution separately from verified, reviewed or integrated
outcomes. Do not invent percent-complete estimates from token counts or elapsed
time. Agent completion should update an activity/review queue without stealing
focus or changing layouts. Link assignment → target revision → worker result →
coordinator review → the user's return point.

The current KP chat adapter owns one active thread and filters other thread IDs.
Multi-thread watching needs a background session owner independent of panes,
including reconnect, disposal and history reconciliation. It is future work.
Reference: https://learn.chatgpt.com/docs/app-server and
https://learn.chatgpt.com/docs/agent-configuration/subagents .

## Shared object and command boundary

Use a common envelope for stable identity, type/schema version, revision,
provenance and links. Each domain retains its own payload, rules and operations:
tasks, flashcards, KP animation assets, rich documents and transient definitions
do not become one universal semantic schema. Human interfaces and agent tools
reach the same validated mutation boundary. Scope edits to the intended region;
preserve unrelated content, persistent IDs and reusable references.

Reads and search should provide bounded summaries and references, then allow
precise retrieval. Writes should name their expected revision and operation
identity so stale edits and retried requests cannot silently overwrite or duplicate
work. Cross-object operations need consistent application and visible conflicts.
Keep source history and provenance sufficient for recovery and inspection.

A novel affordance can often be a saved query plus a presentation and registered
commands: a flashcard reviewer, task board, contextual review panel, transient,
or return trail over the same objects. A genuinely new behavior still requires
implementation and validation. Generated executable UI needs declared capabilities
and a bounded host; a JSON descriptor alone does not grant execution authority.

MCP exposes this application contract through resources, schema/exemplar
discovery, query and mutation tools, and supported change notifications. MCP Apps
can supply interactive interfaces in supporting hosts. The app still owns
persistence, search, revision semantics and execution. Its local UI need not route
every keystroke through MCP or a model. Host-specific UI support is negotiated;
useful text/structured results should remain available. Reference:
https://apps.extensions.modelcontextprotocol.io/api/documents/overview.html .

## Tasks and active cultivation

Each task is an identified object; lists are usually views over those objects.
Record its originating request, intended outcome, relevant object revisions,
dependencies, responsible worker, blocker, evidence and return context as needed.
Agents can capture discovered next actions, attach results, identify stale or
redundant items and maintain relationships within their authorized scope.
Distinguish a suggestion, an accepted commitment and a verified result without
requiring a confirmation dialog for every routine update.

Cultivation needs an agent runner triggered by meaningful events such as saved
work, completed runs or an explicit review. MCP notifications alone do not keep
an agent running. Preserve existing execution owners: Theseus remains authoritative
for KP implementation tasks. An adapter or query view must not create a competing
todo queue that claims different execution status.

## Composable Web Component presentations

During the presentation work the user proposed prerendered Web Components,
potentially using Lit, as a portable basis for composable UI. Record this as an
exploratory implementation option, not an approved framework migration. Custom
elements can provide a reusable browser-facing boundary while stable object and
command contracts remain independent of the component implementation.

Candidate components should expose intentional properties, events, slots and
theme variables. Keep persistence and agent/session ownership outside their DOM.
Prerendering supplies initial markup; interactive behavior still needs hydration
or client initialization. An editor wrapper must preserve its ProseMirror or
CodeMirror instance, selection, undo and focus when surrounding data changes.
Shadow-root styling and focus/event boundaries need deliberate adapters for the
common command registry, mode reporting, accessibility and inherited typography.
MCP Apps hosts still supply their own iframe/bridge boundary.

Lit currently documents its SSR tooling as experimental. A useful future proof
would mount one contextual return/task card in KP and a small independent HTML
host with the same data/command contract and theme tokens, before choosing broader
adoption. Sources checked November 25:
https://lit.dev/docs/ssr/overview/ and https://lit.dev/docs/ssr/client-usage/ .

## Storage and agent retrieval recommendation

For new live structured workspace state, start with SQLite: ordinary indexed
identity/type/revision fields, validated domain JSON, explicit relationships and
full-text projections. Dedicated domain tables can emerge where behavior requires
them. Keep JSON as the lossless interchange/export representation and Markdown
for prose whose plain-text authoring is useful, plus readable derived views.

An agent with only filesystem tools can search text files directly. With a CLI
or MCP adapter, it can query indexed content and retrieve concise excerpts, IDs,
revisions and relationships without reading the whole store or writing raw SQL.
Begin with full-text search and exact filters/relationships; semantic retrieval
can supplement them when it solves an observed problem.

Every object has one authoritative home. Preserve current canonical KP manuscripts,
Codex history and Theseus records under their owners. Exports carry IDs and basis
revisions; importing edited exports is explicit and validated. Provide inspectable,
lossless backups and recovery. A database is not automatically a sync system.
If external file editing and Git review become the dominant workflow, canonical
JSON/Markdown files with a rebuildable database index remain a viable alternative.
No storage migration is approved by this record.

## Finite candidate proofs and open choices

The initial cosmetic/modeline exemplar is approved separately. Later candidates,
selected explicitly rather than treated as an automatic implementation queue:

1. Restore one useful named workspace while preserving resource identity, drafts
   and the exact reading position; use the common command/finder surface.
2. Link one task, KP object, Codex conversation and contextual return point. Edit
   through both UI and agent and return after a detour understanding what changed,
   why it matters and where to continue. Preserve current owners through adapters.
3. Observe one coordinator and two workers, inspect a child, receive a completion
   cue and review its evidence without focus theft or false completion claims.
4. Ship a second affordance, such as a sourced flashcard review or transient, over
   the same proven object/command boundary before extracting shared libraries.

Open choices: exact workspace/tab semantics and bindings; cross-device sync and
conflict UX; which objects stay file-authoritative; task acceptance/review policy;
agent wake-up policy; MCP host capabilities; portable UI packaging; reference
resolution after structural edits; the first genuinely shared Spindle/KP library.
These questions should be resolved against concrete workflows, with new aesthetic
choices reviewed on one exemplar before promotion.
