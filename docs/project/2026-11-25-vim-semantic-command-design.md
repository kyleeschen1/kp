# Vim, semantic commands, rows and customization

Date: 2026-11-25
Status: priority and copy semantics reviewed; remaining recommendations await review; no new binding implementation approved
Source: the user's November 25 workspace/Vim discussion and direct source inspection
Implementation baseline: `8143b42594108ce0d1dde672480d1c47f4549558`

## Purpose and reading order

Preserve the complete design discussed before the mathematical-object programme.
The aim is a discoverable, composable editing environment across prose, source,
chat, notes, pickers and semantic objects. Consistent commands should survive
changes of editor or domain without erasing the differences between those domains.

Read the current-support section first, then the proposed command model and review
choices. This is design memory, not a second implementation queue. Theseus owns
execution; the [roadmap](roadmap.md) owns the current commitment. The later
[mathematical programme](2026-11-25-mathematical-authoring-programme.md) depends on
discoverable typed commands, not completion of every Vim feature here.

## 1. What exists, and what does not

The reference contains 1,358 forms from the pinned Vim 9.2.0000 index and 11 KP
extensions. It does not enumerate every count, plugin or Vimscript function.
Its support metadata is surface-specific: `[x]` implemented, `[ ]` missing,
`[~]` partial, `[↪]` overridden, `[?]` unverified, `[—]` not applicable.
Support is separate from temporary availability: Undo can be implemented even
when the undo history is empty.

The live inventory is available through M-x → **Vim binding coverage**. Maintain
that inventory rather than copying 1,369 forms into this document. Sources:
[reference parser](../../src/editor-commands/vim-reference.ts),
[support audit](../../src/editor-commands/vim-coverage.ts),
[row classification](../../src/editor-commands/vim-rows.ts).

| Surface | Owner and current behavior | Important limit |
| --- | --- | --- |
| Notebook prose | ProseMirror with bounded `proseVim`; starts Normal | No general operator-pending engine |
| Chat composer | Independent editable ProseMirror; same basic modal layer | Transcript streaming must not disturb draft/history |
| Notes | Separate rich editor and saved note identity | Same bounded prose behavior |
| Animation JSON | CodeMirror with `@replit/codemirror-vim` | Library presence is not verified parity; host captures Ex |
| Chat/note Markdown | CodeMirror Vim over the source buffer | Host submission, Ex and transient bindings take precedence |
| Transcript | Read-only ProseMirror, navigation and code/tool folding | Editing cannot mutate Codex conversation authority |
| Picker query | Single-line ProseMirror with independent history | Opens ready to type; Escape dismisses, Ctrl-[ enters Normal |
| Ordinary fields | Browser inputs for some prompts and inline sources | No general Vim implementation |

### Current keys worth knowing

| Context | Keys | Actual meaning |
| --- | --- | --- |
| Prose | `i`, `a`, `I`, `A`, Escape | Insert/append; `I`/`A` use text-block boundaries |
| Prose | `h j k l`, `w b`, `0 $`, `gg G` | Basic navigation; geometry/whitespace/block rules are partial Vim semantics |
| Prose | `v`, Visual `d`/`x`, Normal `x` | Characterwise selection/deletion; no Vim register filled |
| Prose | `u`, Ctrl-r | Native prose undo/redo |
| Prose | `o` | Insert a schema-appropriate block/item; not a plain-text newline |
| Notebook | Tab/Shift-Tab, Alt-Up/Down | Nest/outdent and move blocks |
| Rich text | Mod-b, Mod-i, Mod-z, Mod-Shift-z | Formatting and native undo/redo; Mod is platform-dependent |
| JSON | Shift-Enter, Mod-Enter | Run source; close source while retaining draft |
| Inline link/math source | Enter, Tab, Escape | Finish source editing; ordinary input keys apply |
| Workspace | Alt-x, Ctrl-x Ctrl-x | Same command picker, retaining the initiating target |
| Workspace | Ctrl-backtick | Switch the fixed KP/chat panes |
| Chat transcript | `i`/`a`/`I`/`A` | Focus the persistent composer in Insert mode |
| Chat transcript | `[m`/`]m`, `{`/`}` | Message/paragraph navigation |
| Chat transcript | Ctrl-u/Ctrl-d, `/`, `n`/`N` | Half-page navigation and search in loaded output; not a global session index |
| Chat transcript | `za`, `zo`, `zc` | Code/tool block folding; no full Vim fold model |
| Chat | Ctrl-c | Command transient; context-dependent actions include notes, tags, topics, branches, return points and help |
| Composer/note | Mod-Enter | Send composer or save note, subject to owner validation |
| Picker | arrows, Ctrl-p/Ctrl-n, Normal `k`/`j` | Navigate candidates |
| Picker | Enter, Escape, Ctrl-[, `i` | Accept/inspect, dismiss, enter Normal, resume query insertion |
| Command/Vim picker | PageUp/Down; Normal Ctrl-u/Ctrl-d | Five-result paging; fruit picker does not have all these behaviors |
| Vim finder | Ctrl-h or F2 | Open tag transient; this is not yet universal across pickers |
| Vim tag transient | tag key, Shift+tag key, `r`, `q`/Escape | Toggle, isolate, reset, return with the query intact |

Current notebook Ex: `:h`/`:help`, `:w`/`:write`, `:q`/`:quit`, `:wq`,
`:run`, `:set number`, `:set nonumber`, `:set relativenumber`. Line numbers are
off by default. These are workspace commands, not a Vim filesystem/Ex engine.
Chat rich editors offer help, save and `:source`; the transcript additionally
has its own notes/topics/orientation aliases. Do not infer filename arguments,
bang forms, arbitrary abbreviations, ranges, shell commands or substitution.

Not implemented in rich prose: general `d`/`c`/`y` plus motion, counts and count
composition, normal paste/register semantics, `iw`/`aw` and other composable text
objects, dot repeat, macros, full search, full surround, custom keymap profiles,
state-hook customization, and an extensible Ex parser. `O` and `gi` are proposed,
not implemented prose transitions. CodeMirror support is a separate audit.

The current cursor uses theme roles and modal shapes, and active-line cues/modeline
help identify focus. Those visual cues do not constitute a modal command engine.
Source boundaries: [prose Vim](../../src/fraction-notebook/vim.ts),
[Ex/help](../../src/fraction-notebook/commands.ts),
[chat commands](../../src/editor-chat/chat-commands.ts),
[command registry](../../src/editor-commands/registry.ts).

## 2. The proposed entity model

Use stable, named entities for commands, operators, motions, text objects,
states, maps, variables, hooks and templates. A binding refers to a command;
a row displays it; neither the key spelling nor the displayed row owns behavior.
Describe input/output types, valid domains and states, missing requirements,
repeat behavior, history owner, documentation, implementation reference and tests.

JSON can describe these entities, their relationships and configuration. A
versioned code capability implements a transformation or predicate. A code snippet
may be inspectable/editable source, but arbitrary JSON text is not implicitly
executed. Source changes need the owner's validation and registration lifecycle.
Preserve existing command ownership instead of building an unrelated dispatcher.

Proposed identifiers such as `motion.word.forward`, `operation.yank`,
`text-object.matrix.column` and `variable.picker.max-visible-rows` are illustrative,
not registered APIs. Human names lead: **Word forward**, **Word backward**, **Yank**,
**Matrix column**. Keys and implementation symbols remain searchable aliases.

### Orthogonal categories

| Facet | Values/examples |
| --- | --- |
| Role | Operation, composable operator, motion, text/semantic object, modifier, transition, variable, hook, map, template |
| Topic | Editing, search, repeat, macros, registers, buffers, windows, bookmarks, links, surround, structural editing, inspection, derivation |
| Direction | Forward, backward, inward, outward, first, last |
| State | Normal, Insert, Visual variants, Operator-pending, Replace, Motion/read-only, Emacs-style; terminal only for an actual terminal adapter |
| Invocation | Key sequence, Ex alias, M-x command, transient action, API |
| Domain | Prose, source/code, Lisp, chat, files/directories, picker/transient, KP/math/animation |
| Support | Implemented, missing, partial, overridden, unverified, not applicable, with surface and evidence |

The current finder has role/invocation/domain/support facets. It does not yet
implement all proposed categories. Treat search forward/backward, registers,
buffers/windows, repetition and macros as discoverable topics, not miscellaneous
unclassified bindings. An Ex alias is an invocation form, not a different
mathematical operation.

## 3. Verbs composed with motions and objects

A future command parser resolves state + keymap + count/register/prefix + verb +
operand. Motion/object providers produce typed selections. Operators act only on
selection types they support; owners validate and commit the resulting change.

Examples to preserve: `dw`, `diw`, `daw`, `ciw`, `yiw`, `2d3w`, and custom motions
that work with several verbs. Do not implement each combination as another special
case. Counts, inclusive/exclusive endpoints, character/line/block ranges, Visual
selection, cancellation and dot-repeat semantics need explicit contracts.

The verb catalogue includes delete, change, yank/copy, paste, comment/uncomment,
exchange, select, fold/unfold, inspect, derive, annotate/tag, insert child at
beginning/end, and move/reorder/drag. Some are direct commands; some can be
operators. An operation's applicability must be declared rather than assumed.

Text objects include words, sentences, paragraphs, quotes and delimiters; source
constructs and Lisp forms; blocks, titles, links and math; matrices, rows, columns,
entries, functions and animation beats. Files, directories, project directories,
dates and times may supply typed selections or insertion values. Reading a path
does not grant filesystem mutation; materializing a date must record its chosen
clock/timezone semantics when reproducibility matters.

Rich/custom blocks need an explicit answer to three questions: can ordinary text
inside be edited; can the block be selected as one semantic unit; does a focused
source buffer own deeper edits? Enter/exit boundaries must preserve selection and
native history. Never flatten a matrix or object into text merely to satisfy a
generic operator. Disjoint semantic selections, such as a diagonal, require typed
selection support rather than pretending they are one contiguous text range.

Surround and structural editing should delegate to language/domain adapters.
Deleting a delimiter in Lisp, wrapping prose in a link, and changing a mathematical
operator have different validity rules. Moving a child preserves identity;
copying a subtree allocates new identities and remaps its internal references.

## 4. States, maps, transitions and hooks

Keep modal state separate from the buffer's domain/major mode and optional feature
modes. A Dired-like directory view or transient is a domain/interaction context;
it need not become a new global Vim state. A true terminal adapter would need an
explicit choice between application keys and terminal input.

Users want to inspect/edit the effective map, derive their own profile, use leader
and local-leader sequences, and possibly choose an Emacs-style profile. Local modes
must be able to override bindings for the current state. This is proposed.

Recommended resolver design: explicit temporary prompt ownership, then documented
local/domain/state/profile precedence with deterministic tie-breaking. Preserve
protected host actions only where the host actually owns the context. Provide a
**why this key?** inspector showing the winning binding, shadowed alternatives,
scope, state, requirements and source. Do not silently copy every Evil precedence
rule into a browser environment.

State transitions deserve named actions: entering insertion here/after, opening a
block above/below (`O`/`o`), returning to last insertion (`gi`), entering Visual,
returning to Normal, and entering/exiting Operator-pending. Define preconditions,
selection effects, pending-prefix cancellation and history effects.

Enter/leave hooks should be registered, ordered capabilities with declared effects,
bounded execution and teardown. A failed transition must not strand half-applied
mode state. Do not run every hook on an incidental render or focus notification.
Composition/IME, focus loss, repeated keys, stale owners and disposal must cancel
pending sequences predictably.

Browser conflicts stay visible: Alt-x can be intercepted; Ctrl-x is currently a
workspace prefix; Ctrl-c is the chat transient; Ctrl-h is reserved by the Vim
finder; Ctrl-i can conflict with Tab/platform formatting. Keep fallback launchers
and scope-specific overrides documented rather than claiming universal parity.

## 5. Registers, history, buffers and windows

Registers should be typed payloads: text, structured subtree, semantic reference,
macro/action sequence, or a supported domain value. Clipboard interoperability
needs a text fallback without discarding the richer internal payload. Declare
whether an operator reads/writes a register and which payloads paste can accept.

Ordinary yank/paste retains familiar independent-copy semantics by default
(user-accepted direction). **Derive** creates a new identity plus an explicit
dependency recipe; **transclude** creates another occurrence of a shared source;
**move** preserves the identity. They must not be ambiguous aliases for copying.
Linked results need an update policy, source versions, overrides and a clear way
to inspect or detach the relationship.

Dot repeat should replay the validated operation intent with its documented operand
policy. Macros need ordered actions, target resolution, count semantics, failure
handling and explicit treatment of nondeterministic/external effects. Do not replay
DOM clicks or silently reuse a stale target. Keep text-editor undo native; a
cross-object edit requires an owner-defined atomic transaction and undo boundary.

A buffer owns content, draft/selection/history and resource identity; a window is
a view of a buffer. The current fixed panes are not a full Vim buffer/window tree.
Persistent workspace layouts, saved sessions, shared pickers, faces and the tmux-like
modeline belong to the [multiplexer vision](2026-11-25-multiplexer-vision.md).
This capture does not reopen rejected moving stacks or sliding overlays.

## 6. Rows, pickers and transients

The existing `Row<T>` already separates stable identity/resource, display fields,
matching fields, facets and action IDs. Matching can be fuzzy, literal or disabled
per field. The row remains a projection, never a replacement database record.

Preserve the floating finder, small independent query editor, up to five visible
suggestions, shrinking results and access to all matches. Ctrl-h should eventually
open a universal filter/action transient; `q` returns to the exact query, selection,
scroll and undo history. F2 remains an alternative. Current delivery proves this
only for Vim coverage. Filter OR within one facet and AND across facets is already
implemented; an explicit empty facet means no matches.

Requested customization includes visible fields/annotations, match fields and
strategy, sort/grouping, tags and presets, row density/height, result limit,
preview placement, keymap/profile, remembered queries and selection, and available
actions. Multi-select/batch actions and asynchronous providers need cancellation,
stable identity and stale-result guards before adoption. Preview must have explicit
cost and effect ownership; filtering must not execute represented commands.

Use these rows for commands, variables, maps, registers, buffers, files, questions,
mathematical capabilities, animations and exemplars. Entity-specific details remain
with their owner. Inspecting a reference binding is not executing that binding.

## 7. Typed variables inspired by defcustom

Separate four things: reusable value types, variable definitions, scoped value
assignments, and executable operations/setters. A definition needs a stable ID,
friendly name, documentation, type, default, allowed scopes, owner, validation,
setter/effect capability, presets and relevant commands/entities.

Useful types include booleans, finite choices, bounded numbers, strings, tuples,
records, lists, tagged unions, semantic references and registered-command references.
An open collection with suggestions differs from a closed enumeration. Composition
must validate the complete value and dependencies, not merely each UI field.

Recommended scopes are defaults → user profile → project → buffer/domain → explicit
local override, with unsupported scopes rejected by the variable owner. Provide
**inherit**, **reset**, current effective value, provenance and shadowed values.
Do not use null interchangeably for inheritance, deletion and a meaningful null.
Derived/read-only values should be visibly different from configurable variables.

One variable picker should search by both owning object and property type. This
connects to the earlier style request: compare all font weights, or all heading
properties; expose named palette roles and swatches; retain theme inheritance.
Variable assignment goes through the owner so validation, change notification,
persistence and undo remain coherent. Invalid assignments should be rejected.

## 8. Inspection, linking and guided construction

The proposed **inspect** verb, illustratively leader-i, captures the object at
point and exposes properties, children, parents, source, dependencies, references,
representations, operations, keymaps and variables. The leader itself remains an
unselected binding. Preserve the captured target when a picker steals focus.

Bookmarks need explicit semantics: text position with recovery anchors; exact
object/version; live object; fixed member set; dynamic query such as a matrix
diagonal; animation checkpoint; conversation passage and return point. Show stale
or deleted targets rather than silently redirecting them. A lesson-occurrence
annotation differs from an annotation on the shared concept itself.

Guided typing should support domain-aware snippets, nested tab stops, linked
placeholders and semantic completion. The discussed aliases `/l`, `/x`, `/X` mean
link, inline LaTeX and display LaTeX as a proposal; they are not implemented global
bindings. Automatic math rendering on leaving delimiters and inline source reveal
must respect the current editor's existing object lifecycle.

A Jacobian template can request a vector-valued function and ordered domain/codomain
bases, then expose entries, columns, rows and notation lenses. Renaming displayed
`x` to `f` differs from substituting a mathematical object or changing basis.
Jacobians contain first partial derivatives; Hessians contain second partials.
Concept packages can provide definitions, properties, questions, examples,
counterexamples, constructions and animation recipes. Their selected authoring
expansion populates concrete KP objects/relations; a permanent all-purpose concept
runtime is unnecessary. Recipe/version provenance survives compilation.

## 9. What the external references contribute

- [Evil extension model](https://evil.readthedocs.io/en/latest/extension.html):
  reusable definitions for motions, operators, text objects and states; explicit
  range and repeat properties. This informs composition rather than a JSON port.
- [Evil keymaps](https://evil.readthedocs.io/en/latest/keymaps.html): state maps,
  buffer-local overrides and domain-specific bindings inform scoped resolution.
- [Emacs defcustom](https://www.gnu.org/software/emacs/manual/html_node/elisp/Variable-Definitions.html):
  typed customization declarations, defaults, setters and suggested options inform
  the variable model. Our proposed validation boundary is a separate design choice.
- [Helm sources](https://github.com/emacs-helm/helm/blob/master/helm-source.el):
  distinguish candidates, actions and persistent previews.
- [Vertico](https://github.com/minad/vertico/blob/main/README.org): keep completion
  presentation small and allow category/command-specific configurations.
- [fzf](https://github.com/junegunn/fzf): adopt compact narrowing, configurable
  matching and action/preview ergonomics. Browser commands do not inherit shell
  execution semantics.
- [Gilles Castel's LaTeX workflow](https://castel.dev/post/lecture-notes-1/): the
  earlier discussion identified context-sensitive snippets and linked placeholders
  as useful inspiration for guided semantic construction.

## 10. Review choices and recommended defaults

Choices 1 and 2 were accepted by the user on November 25 in response to the review
questions: **Conventional core + semantic commands; keep other Vim gaps visible**
and **Keep Copy, Derive, and Transclude distinct**. The other defaults remain
recommendations. This accepts sequencing and copy semantics, not an implementation
run or every detail in this document. See the [decision record](decisions/2026-11-25-vim-core-and-semantic-commands.md).

1. **Accepted priority:** prioritize a reliable conventional editing core plus semantic commands; keep
   exhaustive Vim parity as a separately visible backlog. Mathematical authoring
   should not wait for a complete editor reimplementation.
2. **Accepted semantics:** keep ordinary copy/paste independent. Offer derive and transclude explicitly,
   with clear lineage/update semantics and typed registers.
3. Make maps, bindings, variable declarations and templates inspectable data;
   keep executable behavior in registered, versioned domain capabilities.
4. Reuse the row and command owners across surfaces; retain native ProseMirror and
   CodeMirror histories and domain-specific text/object adapters.
5. Promote universal Ctrl-h/filter behavior only after the current Vim exemplar
   is reviewed; do not count its current metadata as new Vim execution support.

For any later Vim implementation tranche, require tests for composed commands,
counts, cancellation, Unicode/graphemes, structural boundaries, stale references,
register payloads, undo/repeat, keymap precedence, source/prose focus return, IME
and readonly transcript preservation. Test the implemented scope, not invented
parity with every upstream command. Browser/OS shortcut behavior requires its own
evidence.

Review now: open the notebook, launch Ctrl-x Ctrl-x → Vim binding coverage,
compare `d`, `diw`, `u`, `:s`, `za` across prose/source/transcript, and use Ctrl-h
then `q`. Judge whether the recorded current behavior matches experience. The
main priority choice is now settled: conventional core and semantic commands,
without waiting for broad classic Vim parity, and copy/derive/transclude remain
distinct. Review the proposed configuration and selection semantics next. The
mathematical plan can use the current command entry points without depending on
the unresolved full modal engine.

Capture verification: `npm run test:vim-coverage` passed all ten reference/row
checks on November 25. This validates the existing inventory and classifications;
it does not implement or certify the proposed bindings. The local notebook URL
returned HTTP 200. No new browser interaction certification was run for this
documentation round.
