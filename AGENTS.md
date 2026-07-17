# Repository Agent Instructions

## Repo-local scratch tooling

- Put throwaway scripts, screenshots, reports, and other investigation artifacts under `tmp/codex/` instead of an OS-level temporary directory.
- Keep `tmp/codex/` gitignored, and delete scratch artifacts when the investigation or work slice ends.
- Promote a scratch script into `scripts/` or `tests/` when it becomes repeatable validation, is used by more than one slice, or documents behavior worth preserving.
- Use an OS-level temporary directory only when a tool technically requires it; filesystem escalation must not be introduced merely to store disposable tooling.
- Durable Theseus evidence should cite committed commands or tests, not ephemeral scratch paths.

