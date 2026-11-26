# Conventional Vim core alongside semantic commands

Date: 2026-11-25
Status: accepted priority and copy semantics; implementation scope remains proposed

The user requested documentation and review of the complete Vim discussion before
a rigorous mathematical-authoring and animation plan. Asked whether broad Vim
parity should precede that work, the user selected:

> Conventional core + semantic commands; keep other Vim gaps visible (Recommended)

The subsequent copy/reuse review selected:

> Keep Copy, Derive, and Transclude distinct (Recommended)

Ordinary yank/paste creates an independent copy. Derive creates a new object with
an explicit dependency; transclude creates another occurrence of a shared source.
These operations must be distinguishable in discovery, history and persistence.

Build a reliable conventional editing core alongside domain-aware commands.
Do not make exhaustive Vim parity a prerequisite for the mathematical workbench.
Preserve the per-surface coverage inventory and its distinction between partial,
overridden, unverified and implemented behavior.

The [design capture](../2026-11-25-vim-semantic-command-design.md) preserves states,
maps, hooks, typed variables, registers, rows, inspection, derivation, structural
editing and guided construction. Those details are recommendations unless already
implemented or separately accepted; this choice does not approve every binding.

The [mathematical programme](../2026-11-25-mathematical-authoring-programme.md)
remains a proposal. The row-picker commitment and its review stay intact; the
earlier animation-promotion ordering is not silently replaced. No implementation
run, generalization, publication, external execution or model spending is approved
by these design decisions.
