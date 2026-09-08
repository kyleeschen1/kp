# R2 held-out edits and actual live repair trial

Date: 2026-09-08. Approved scope: R2 s22, existing authenticated model access.
Command: `npm run benchmark:reasoning:live -- --model gpt-5.6-sol` — passed.
No credentials, model account or spending settings changed. No implementation
agents were delegated; the model received a bounded source-generation prompt
instructing it not to use tools or inspect files.

## Actual results

One two-case batch per round, two calls total. First call: 21,155 ms. Repair
call: 21,476 ms. These are wall-clock measurements including CLI overhead, not
token usage, cost or general latency benchmarks.

- First output compiled both requested edits: two equation operations/three
  stops and revised TypeScript prose/seven pedagogical stages.
- Because both succeeded, the harness explicitly injected two binding faults:
  replace the equation parent target with `fraction-solve.state.constant-quotient`
  and reverse code `stageIds`. These were **not model-generated mistakes**.
- Actual diagnostics: `kp.reasoning.parent-conclusion` at `$.parent`, requiring
  exact child/parent endpoints; `kp.reasoning.code-binding` at `$.stageIds`,
  requiring canonical source revisions and ordered pedagogical stages.
- The second model call received those drafts and diagnostics, not a hardcoded
  repaired response. It restored both original valid drafts byte-for-byte.
- Zero silent fallback artifacts: rejected requests returned repair gaps, not
  generic animation or a substituted valid lesson. Scoring also rejects an
  unchanged valid starter that fails the requested edit.

First prompt SHA-256:
`1818e1b321398f7299d7349d8761c399cd1891d2668d772702341fa9fc2c6284`.
Repair prompt SHA-256:
`0c707c7df0df69f0219431a8fdee2df5f7f846567f3c1c99ce4804ff72b9aad1`.
Both raw response fingerprints:
`d6e79c3791a2b09c4fcc46f3e304833880f5dced71e9a5b4e81e1b94479362ea`.

Parsed source strings for both identical responses are retained in
`2026-09-08-reusable-reasoning-live-trial.json`. The committed harness reconstructs
the labelled fault injection. Equation revision:
`sha256:c061279d4041b1a698e34e3270a5d9ba809c8d20c7334a1ec218408dad2d015c`;
code revision:
`sha256:a95faa5ce6455c5b6a07936036085500e49301202cf53dd2bf06b262aa916a0e`.

## Independent deterministic checks and limits

`npm run test:reusable-reasoning` exercises early one/two-operation endpoints,
every reading/prompt revision, last-valid preservation on unsupported calculus,
coefficient authority and dropped assumptions, plus CLI and scorer rejection.
Full typecheck passes. These are deterministic checks, not additional live runs.
The captured response replay remains labelled replay, never fresh evidence.

This trial measures constrained source editing and diagnostic-driven repair.
It does not measure spontaneous error frequency, stability across repetitions,
novel mathematical/code generation, pedagogical quality, visual approval of the
new wording, or learner comprehension. Free prose remains editorial. No model
output was installed into the accepted visible exemplars. Code compilation here
does not establish a live source editor or selected-source publication for code.
