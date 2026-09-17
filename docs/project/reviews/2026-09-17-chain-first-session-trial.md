# Current-session proposal trial

Raw prompts, expected endpoint intent, unmodified proposal JSON and correction
counts are retained in `content/authoring/chain-first-session-trial.json`.
The current Codex model authored them with the checker contract and implementation
visible. This is a small, deliberately selected integration trial, not an
independent/blinded benchmark or a statistical precision estimate. No external
model service, paid API, training or browser Apply was used.

All proposals run through the same `author:check` CLI function and domain owner
as ordinary requests. The retained test also checks the exact intended sequence,
so accepting a different easy problem would not count as fulfillment.

| Proposal | Meaning / pressure | Result | Corrections |
| --- | --- | --- | --- |
| tenths | `2/5+1/10 → 4/10+1/10 → 5/10 → 1/2` | Checked | 0 |
| twelfths | `1/4+1/6 → 3/12+2/12 → 5/12` | Checked | 0 |
| ordered-difference | `7/8−1/4 → 7/8−2/8 → 5/8` | Checked | 0 |
| unspecified-path | `1/3+1/6 → 1/2`, route omitted | Located operation repair | 0 |
| false-difference | Deliberately false `5/6−2/6 → 7/6` | Located operation repair | 0 |
| symbolic-denominator | `1/x+1/x → 2/x`, unsupported domain | Located notation repair | 0 |
| specified-path-repair | Add alignment, raw sum and reduction to unspecified-path | Checked | 1 |

First pass: three accepted supported proposals, three checker abstentions.
One retained correction then passed. False acceptance: zero among the three
deliberately inadmissible proposals. This denominator is too small and selected
to estimate general precision. The model intentionally preserved invalid inputs
for two boundary probes; these are checker-negative cases, not spontaneous
model mistakes. Abstention here describes the checker, not a demonstrated model
ability to detect its own uncertainty.

Executed with `node --disable-warning=ExperimentalWarning --test
tests/fraction-chain-inference-trial.test.ts` and included in
`npm run test:fraction-chain`. No renderer/CSS edits were needed for these
authoring checks. No new visual certification or curriculum checks follow;
arbitrary mathematical inference, symbolic fractions and independent evaluation
remain open work.
