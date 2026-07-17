# Repo-local Scratch Tooling

Date: 2026-07-17  
Status: accepted  
Scope: KP development, debugging, validation, and autonomous loops

## Decision

Disposable scripts and generated investigation artifacts live under the
gitignored `tmp/codex/` directory in the repository workspace. They are removed
when the investigation or work slice ends.

A scratch script must be promoted into `scripts/` or `tests/` when it becomes
repeatable validation, is used by more than one slice, or captures behavior
worth preserving. Durable Theseus evidence cites the promoted command or test,
not an ephemeral scratch path.

Use an operating-system temporary directory only when a tool technically
requires it. Filesystem escalation must not be introduced merely to create,
run, or remove disposable tooling.

## Rationale

Repo-local scratch space stays inside the managed writable root, avoids
unnecessary approval prompts, and makes the boundary between disposable and
durable tooling explicit. Gitignore keeps investigation residue out of commits,
while the promotion rule prevents useful validation from remaining invisible
or irreproducible.

## Lifecycle

1. Create disposable work under `tmp/codex/`.
2. Delete it at the end of the investigation or slice.
3. If it proves reusable, move the behavior into a named script or test and
   record that durable command in Theseus.

