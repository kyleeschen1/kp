# Deliberate factorization rejection and repair

First tool/start clock: `2026-09-10T19:09:11Z`.
Source/check/report end: `2026-09-10T19:09:46Z`, before this note.
Measured interval: 35 seconds; pre-tool reasoning, active human time and token
cost unknown. This is an intentional rejection probe, not an accidental author
failure or part of the five-case first-pass validity numerator.

Initial chain: `2(x+4)+3(x+4)` → `(2+4)(x+4)` → `6(x+4)`.
Deliberately changed the second original coefficient from 3 to 4 in the
collected expression. The final expression correctly evaluates that wrong
middle expression, isolating the incorrect factorization.

Attempt 1 created with `apply_patch` by `2026-09-10T19:09:26Z`.
Command from `/Users/kyleeschen/Code/kp`:

```sh
npm run --silent author:check -- --task equation.composed-algebra --request docs/project/threads/2026-09-10-authoring-trial/probe-factorization.attempt-1.json
```

Checker interval: `2026-09-10T19:09:26Z`–`2026-09-10T19:09:28Z`;
reported command wall time 1.119171625 seconds. Exit 2, report/result
`repair-gap`. Actual returned diagnostic:

```json
{
  "code": "invalid-factorization",
  "path": "$.states[1].latex",
  "expected": "roles.distributed-addends[1]: Every distributed addend must preserve its corresponding source addend subtree."
}
```

The diagnostic identified the second addend's failure to preserve its source.
Repair restored the middle expression to `(2+3)(x+4)` and updated the final
coefficient to 5, preserving the original source, shared group, IDs and prose.
Attempt 1 report saved from captured stdout, then attempt 2 created with
`apply_patch`, between `2026-09-10T19:09:28Z` and `2026-09-10T19:09:40Z`.

```sh
npm run --silent author:check -- --task equation.composed-algebra --request docs/project/threads/2026-09-10-authoring-trial/probe-factorization.attempt-2.json
```

Repair checker interval: `2026-09-10T19:09:40Z`–`2026-09-10T19:09:41Z`;
reported command wall time 1.149648125 seconds. Exit 0, `checked` / `compiled`,
orientation `right`, three checkpoints and two transitions. Revision:
`sha256:b2920b4bfb533e272e96d4addc928833255d971e38670bb0d0d8841226602b2f`.
Attempt 2 report retained via captured-output `apply_patch` by
`2026-09-10T19:09:46Z`. Both complete source/report pairs are preserved.

Outcome: expected deliberate rejection followed by one successful source-only
repair using the actual diagnostic. No silent fallback observed in these
reports; preview execution was not performed. No engine intervention.

Extra reads/searches: none; only public checker requests on the probe files.
Assistance: parent probe assignment and earlier instrumentation instructions;
no source hints. Canonical boundary remains in `author-context.md`. No prior
case changes, renderer/compiler implementation reads, production edits,
external services, subagents, Git or Theseus writes. Evaluation probe not started.
