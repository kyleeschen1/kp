# Lesson Card Editor Next-Step Review

Date: 2026-08-06
Status: recommended; not yet an executable run contract

## Recommendation

Build one bounded internal lesson-card authoring proof before expanding the
editor surface. The proof should edit the active card in place with one
CodeMirror instance, autocomplete semantic object IDs from the selected
animation inventory, and expose typed add, delete, and reorder commands.

Store cards as structured, versioned records rather than arbitrary Svelte
source. Keep the prose body Markdown-like, but represent animation references
and custom components as explicit typed nodes or directives. A Svelte host may
render the editor and may wrap a card for preview composition; Svelte source is
not the persisted truth and cannot become the animation or semantic runtime.

## First Exemplar Acceptance

- One active card is editable without mounting an editor for every inactive
  card.
- Autocomplete discovers valid semantic object IDs and rejects stale or
  foreign IDs.
- Add, delete, and reorder are reversible typed commands with stable card IDs.
- The saved record reconstructs the same order, prose, references, and selected
  animation without evaluating arbitrary code.
- Preview and publication consume the same structured record.
- Existing lesson playback, direct links, review capture, static publication,
  and framework-neutral animation assets remain unchanged.

## Preservation Boundary

Do not implement lifecycle metadata, arbitrary Svelte evaluation, collaborative
editing, a public editor, accounts, database synchronization, or a broad
Internal Studio redesign in the first proof. Do not mount dozens of CodeMirror
instances merely because a lesson contains dozens of cards; inactive cards
should remain cheap document views.

## Required Decision Before Execution

Turn this review into a small approved loop with one named lesson exemplar and
an explicit persistence target. The recommended default is a repository-local
versioned lesson document with an in-memory authoring session and an explicit
save boundary; server/database persistence can follow after the command and
schema contracts are proven.
