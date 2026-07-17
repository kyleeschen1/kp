# Repository Agent Instructions

## Repo-local scratch tooling

- Put throwaway scripts, screenshots, reports, and other investigation artifacts under `tmp/codex/` instead of an OS-level temporary directory.
- Keep `tmp/codex/` gitignored, and delete scratch artifacts when the investigation or work slice ends.
- Promote a scratch script into `scripts/` or `tests/` when it becomes repeatable validation, is used by more than one slice, or documents behavior worth preserving.
- Use an OS-level temporary directory only when a tool technically requires it; filesystem escalation must not be introduced merely to store disposable tooling.
- Durable Theseus evidence should cite committed commands or tests, not ephemeral scratch paths.

## Exemplar-first collaboration

Apply this protocol to subjective visual, motion, interaction, and LLM-generated-output work. Do not add its review ceremony to objective maintenance or exact bug fixes with deterministic acceptance tests.

- Respect the requested mode boundary. A request to diagnose, compare, explain, or plan does not authorize implementation.
- Before broad implementation, name the canonical reference, observable acceptance criteria, preservation boundary, and smallest independently reversible rollback unit.
- Perfect one representative exemplar and stop for visual review before generalizing across families, unless the user explicitly approves the generalization in advance or waives the checkpoint.
- Compare the current behavior, canonical behavior, and proposed behavior phase by phase when diagnosing a visual regression.
- Preserve semantic models and authoring contracts when the defect is limited to presentation; do not broaden a visual rollback into an architectural rollback without evidence.
- Treat “formalize this” and “enforce this globally” as separate decisions. Record a principle without making it universal unless global enforcement is explicitly approved.
- In grill-me sessions, batch low-impact decisions behind recommended defaults and interrupt only for choices that materially affect architecture, product behavior, or aesthetics.
- Visual run contracts must identify their exemplar checkpoint, promotion criteria, preservation boundary, rollback unit, and post-approval generalization slices.
