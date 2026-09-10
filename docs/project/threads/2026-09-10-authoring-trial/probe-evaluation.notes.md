# Deliberate coefficient-evaluation rejection and repair

First tool/start clock: `2026-09-10T19:11:03Z`.
Source/check/report end: `2026-09-10T19:11:39Z`, before this note.
Measured interval: 36 seconds; pre-tool reasoning time, active human time and
token cost unknown. This rejection is deliberate probe behavior, not an
accidental author failure or part of the five-case first-pass measure.

Initial chain: `3(x+2)+4(x+2)` → `(3+4)(x+2)` → `8(x+2)`.
Factorization preserves the original counts and compound group. Only the final
coefficient is intentionally wrong: eight instead of the exact sum seven.

Attempt 1 created with `apply_patch` by `2026-09-10T19:11:18Z`.
Command from `/Users/kyleeschen/Code/kp`:

```sh
npm run --silent author:check -- --task equation.composed-algebra --request docs/project/threads/2026-09-10-authoring-trial/probe-evaluation.attempt-1.json
```

Checker interval: `2026-09-10T19:11:18Z`–`2026-09-10T19:11:19Z`;
reported command wall time 1.253067417 seconds. Exit 2, report/result
`repair-gap`. Actual diagnostic:

```json
{
  "code": "invalid-evaluation",
  "path": "$.states[2].latex",
  "expected": "The result must equal the exact sum of the two coefficient integers."
}
```

Using the diagnostic, attempt 2 changes only the final LaTeX from `8(x+2)`
to `7(x+2)`. All source IDs, preceding expressions and prose remain unchanged.
Attempt 1 full stdout saved and attempt 2 created with `apply_patch` between
`2026-09-10T19:11:19Z` and `2026-09-10T19:11:30Z`.

```sh
npm run --silent author:check -- --task equation.composed-algebra --request docs/project/threads/2026-09-10-authoring-trial/probe-evaluation.attempt-2.json
```

Repair checker interval: `2026-09-10T19:11:30Z`–`2026-09-10T19:11:32Z`;
reported command wall time 1.289060625 seconds. Exit 0, `checked` / `compiled`,
orientation `right`, three checkpoints and two transitions. Revision:
`sha256:176624423777168a62333e785f3d5f76cd0063c075f1679581fa8e665ba97365`.
Full second report retained via captured-output `apply_patch` by
`2026-09-10T19:11:39Z`. Both source/report pairs preserved without overwrites.

Outcome: expected deliberate rejection, then one successful source-only repair
from the actual diagnostic. No fallback observed in reports; no preview
execution or engine intervention. Canonical boundary remains in
`author-context.md`.

Extra reads/searches: none; public checker requests used only assigned sources.
Assistance: parent assignment and prior instrumentation instructions; no source
hints. No implementation inspection, earlier-case changes, production edits,
external services, subagents, Git or Theseus writes. Unsupported probe not started.
