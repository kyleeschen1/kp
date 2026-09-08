# Bounded reusable reasoning: human and LLM packet

Status: accepted exemplar authoring path, not a general reasoning schema.
Start with `llm-generation-entrypoint.md`. Execution scope is the approved R2
proposal; this guide is not authority to execute R3/Bayes or add operations.

## Choose the caller

| | Equation | Code |
| --- | --- | --- |
| Shared server URL | `/experiments/reusable-reasoning/` | `/experiments/reusable-reasoning-code/` |
| Canonical artifact | `animation.fraction-composition.two-thirds-solve` | `animation.programming.typescript-free-shipping-refactor` |
| Semantic owner | Trusted lawful fraction-solve macro and verified operations | Existing TypeScript source revisions, language operations and declared-case certificate |
| Native renderer | Existing canonical equation session and native KaTeX material | Existing code source HTML, token theater and DOM frame renderer |
| Editable scope | Editorial prose and one supported adjacent operation prefix | Editorial title, statement and explanation; fixed source/stage pins |

Use the existing server at <http://localhost:8000>; do not start a second one.
Both callers share Focus Card scaffold, keyboard, continuous input, playback
commands and beat mapping. Neither shares the other's proof model. A semantic
checkpoint is not inferred from how many prose pages are visible.

## Get a complete draft and check it

From the repository root:

```sh
npm run --silent author:reasoning -- --domain equation --example
npm run --silent author:reasoning -- --domain code --example
npm run --silent author:reasoning -- --domain equation --request path/to/draft.json
npm run --silent author:reasoning -- --domain code --request path/to/draft.json
```

The example commands print complete editable JSON. Save the output as a source
file with your editor. Request commands only read; `--request -` reads JSON from
stdin. Successful checks report `compiled`, the exact source/revision and stop
count. Rejected requests report `repair-gap` with `code`, `path`, `expected`, and
exit code 2. No output is silently published; no new write service or code
execution authority is created. JSON must remain under 100,000 characters.

The equation page's source editor applies the same binder and projections.
Invalid drafts retain the last valid lesson, all its readings and answers.
The code page currently has no JSON editor or selected-source publication UI:
the CLI checks its bounded source; the host mounts its canonical source factory.
Do not report a CLI check as an applied code-page edit.

## Supported equation edit

Keep the formula's existing law/factor/addend pins. Supported operation prefixes
and matching parent target are:

| Operations retained, in order | Parent `targetStateId` | Stops |
| --- | --- | --- |
| `distribute` | `fraction-solve.state.distributed` | 2 |
| plus `normalize` | `fraction-solve.state.normalized` | 3 |
| plus `constant-product` | `fraction-solve.state.constant-product` | 4 |
| plus `constant-quotient` | `fraction-solve.state.constant-quotient` | 5 |

Operation IDs have the prefix `fraction-solve.step.`. These are selections from
one trusted trace, not user-authored LaTeX, coefficients, or new algebra. Preserve
both required assumptions: real scalar `x` and a nonzero denominator. Revise
editorial prose to describe the chosen endpoint; the compiler does not prove
the truth or pedagogical quality of free text.

For a useful repair exercise, retain only the first three `reason.operationIds`
but leave the old four-operation `parent.targetStateId`. The checker must reject
that mismatch. Repair the target to `fraction-solve.state.constant-product` and
adjust the prose; the result has four stops. Do not forge an evidence field,
delete an assumption, skip the intermediate state, or replace failure with a fade.

Apply the corrected JSON in the equation page, verify the real ink and counter,
then inspect full/compact, reason/return and prediction/reconstruction. Disclosure
preserves exact interrupted progress. References and history are revision-pinned:
an edited source cannot silently inherit another revision's saved address.

## Supported code edit

Change editorial fields while preserving the exact `sourceRevisionId`,
`targetRevisionId` and ordered `stageIds` emitted by the example command. Reverse
the stage array to see a typed `$.stageIds` repair, then restore it. To animate a
different program, first obtain language-owned semantic evidence through the
generation entrypoint; this packet cannot authorize arbitrary-source execution.

There are seven pedagogical stops but only two compiled source revisions. The
behavior certificate covers the three declared threshold cases, not all inputs
or arbitrary TypeScript equivalence. Required context must retain that limit.

## Local publication and handoff

On the equation page choose **Download applied source**. It exports the displayed
valid source, not an unapplied textarea draft. Build a separate immutable edition:

```sh
npm run author:reasoning-publication -- --source path/to/draft.json
npm run author:reasoning-publication -- --source path/to/draft.json --check
npm run test:reusable-reasoning
```

The build returns its content-addressed directory under
`tmp/codex/reasoning-editions/`. Open its `index.html`: source-pinned readings,
every native equation, assumptions, references and prompts remain without
JavaScript. This is a static local edition, not an interactive deployment.
Old editions are not overwritten. `--check` detects stale/altered bytes.

LLM task template: “Using the selected example JSON and this packet, make
[bounded editorial/prefix change]. Preserve exact source, assumption and formula
pins. Return only the source JSON, or explain the unsupported request without
inventing authority. On a compiler repair, change only the rejected binding and
dependent editorial prose, then check again.”

Handoff source path, source revision, stop count, executed check, any diagnostic
and the preserved last-valid revision. Separate first output, actual diagnostic
and repaired output when measuring an LLM trial. Handcrafted fixtures are not
live-model evidence. Executable positive/negative examples live in
`tests/reusable-reasoning-packet.test.ts`.
