# Mathematically valid unsupported deduction probe

First tool/start clock: `2026-09-10T19:13:01Z`.
Source/check/report end: `2026-09-10T19:13:26Z`, before this note.
Measured interval: 25 seconds; pre-tool reasoning time, active human time and
token cost unknown. This deliberate boundary probe is not an accidental
author failure or one of the five supported cases.

Chosen chain: `(-1)(x+2)+3(x+2)` → `(-1+3)(x+2)` → `2(x+2)`.
It uses the complete `kp.composed-algebra-source.v1` field structure, while its
negative coefficient is outside the packet's documented nonnegative range.

Independent mathematical justification: for every real x, put g = x+2.
Distributivity gives (-1)g + 3g = ((-1)+3)g = 2g. Equivalently, expanding the
first expression yields -x-2+3x+6 = 2x+4, the same as 2(x+2).
No division or nonzero assumption is needed; x=-2 is allowed. This reasoning
establishes the ordinary algebraic identity, not compiler or animation support.

Attempt 1 created with `apply_patch` by `2026-09-10T19:13:17Z`.
Command from `/Users/kyleeschen/Code/kp`:

```sh
npm run --silent author:check -- --task equation.composed-algebra --request docs/project/threads/2026-09-10-authoring-trial/probe-unsupported.attempt-1.json
```

Checker interval: `2026-09-10T19:13:17Z`–`2026-09-10T19:13:19Z`;
reported command wall time 1.750118291 seconds. Exit 2, report/result
`repair-gap`. Actual diagnostic:

```json
{
  "code": "unsupported-syntax",
  "path": "$.states[0].latex",
  "expected": "Unsupported scalar sum/product notation."
}
```

Full stdout saved via captured-output `apply_patch` to
`probe-unsupported.attempt-1.report.json` by `2026-09-10T19:13:26Z`.
The observed outcome is a syntax rejection at the first state, not
`unsupported-presentation`, a proof of mathematical invalidity, or an executed
renderer failure. The diagnostic is typed and locates the rejected expression,
but its text does not specifically explain the negative-coefficient restriction;
that limit comes from the original authoring packet.

Outcome: the mathematically valid unsupported chain was rejected at the
documented task's syntax boundary. One attempt, no repair or replacement case.
Making this exact negative-coefficient chain pass would require support outside
the documented packet; no such expansion was attempted. No silent replacement
animation or preview execution occurred. This is not evidence of presentation
rejection behavior, since the observed syntax gap precedes that question.

Extra reads/searches: none; public checker read the assigned source. Assistance:
parent probe assignment and prior instrumentation instructions, no source hints.
Canonical boundary remains in `author-context.md`. No renderer/compiler
inspection, prior-source changes, engine edits, external services, subagents,
Git or Theseus writes. All initial authored cases/probes are now complete;
awaiting parent verification without changing the baseline packet.
