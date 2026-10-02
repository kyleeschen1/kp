# Fresh-agent fraction-chain reproduction

Date: 2026-10-01. Scope: the approved convergence proposal's existing
`equation.fraction-chain` path. A delegated agent independently followed the
documented entrypoint, rather than changing an existing engine implementation.
This is one agent's observed local reproduction, not a general model benchmark.

## Outcome and authority

Three changed source/Article pairs checked and reached the existing fraction
host with passing bounded Chromium preservation checks. No engine, renderer,
host, clock, geometry, motif or timing changes were required. One attempted
negative-result chain failed with a located compiler repair and was replaced
with a positive-result subtraction caller; negative-result support is not claimed.

The canonical artifact is `kp.algebra.fraction-chain.v1`. The semantic owner
checks ordered adjacent alignment, raw combination and reduction; prose remains
editorial. `src/tutorial/fraction-chain/publication.ts` supplies static Article
and equation output. The real `/experiments/fraction-chain/` host module and
native KaTeX compositor consume that source. The existing retained exemplar and
its shared presentation remain unchanged. Each JSON/Article pair and the isolated
test harness can be removed independently.

## Reproduction steps and retained inputs

Read the repository instructions, roadmap and active thread, system vocabulary,
LLM generation entrypoint, supported authoring packet and fraction-chain packet.
Ran `author:check -- --list` and the selected task's `--example`, preserving the
starter's schema and lowercase identity syntax. Edited numeric states and
corresponding prose without hints. Authored adjacent Articles for actual host
application, then reused the repeatability harness's document interception.

All files below are in `content/authoring/convergence/`:

| JSON and matching `.article.md` stem | Checked sequence | Owner revision |
| --- | --- | --- |
| `fraction-add-reduce` | `3/8+1/8 → 6/16+2/16 → 8/16 → 1/2` | `df1a45d7ea3f5e88151c485062a98bba5b50d31935c2691f537843e45b4ac821` |
| `fraction-two-sided` | `1/6+1/4 → 2/12+3/12 → 5/12` | `bc60cdee19d6b26f4f73e7f5cec58568b504c048424e6a1ee768f16e55e0c5d6` |
| `fraction-subtract` | `5/6−1/4 → 10/12−3/12 → 7/12` | `c9311ec12a8f5f3f8b0a9c39e806b029eeedba7289e0827a4691c4b5a4b8600b` |

The first caller deliberately renames already equal denominators to exercise
two-sided alignment and reduction. Its Article explicitly says that this extra
step is equivalent-fraction practice, not necessary addition work. The other
two callers require different scaling factors for their two operands.

## Located failure and limits

The initial third proposal was
`1/6−3/4 → 2/12−9/12 → −7/12`. Both `\\frac{-7}{12}` and `(-7)/12`
as final-state source returned exit 2 with:

```json
{
  "status": "repair-required",
  "code": "fraction-chain.operation",
  "path": "$.moves[1]",
  "expected": "Ordered LaTeX endpoints do not represent the pinned combination."
}
```

The documented signed numeric semantic coverage did not suffice for this full
author-check compilation. Changing only the spelling did not repair it. The
bounded source test retains both rejections as observed evidence, explicitly
not as a desired mathematical restriction. This reproduction does not diagnose
or repair the underlying operation/presentation mismatch. No silent fallback
or negative-result host application occurred. Two of the original three
proposals passed first attempt; all three retained supported sources passed.

## Executed checks

```sh
npm run author:check -- --task equation.fraction-chain --request content/authoring/convergence/fraction-add-reduce.json
npm run author:check -- --task equation.fraction-chain --request content/authoring/convergence/fraction-two-sided.json
npm run author:check -- --task equation.fraction-chain --request content/authoring/convergence/fraction-subtract.json
node --disable-warning=ExperimentalWarning --test tests/algebra-convergence-source.test.ts
npm run visual:algebra-convergence
```

All retained author checks exited 0 and reported `hostEligibility: eligible`.
The source suite passed 4 tests (421.5 ms reported total). The Chromium suite
passed 3 tests in 10.7 seconds using the existing shared port-8000 server.
It verified exact parsed source value, checked revision, native endpoint HTML,
accessible MathML annotations, forward/reverse seeking, exact held-position
return after detail disclosure, and absence of page errors. The browser report
attaches each original file's SHA-256 with its owner revision.

Checking and application are separate evidence. Application intercepted only
the selected browser document response and compiled each retained Article/source
through the real publication owner; the real host module/CSS still loaded from
the shared server. JSON serialization can change whitespace, so the assertion
is exact source value plus owner revision, with the input-file hash retained.
This is the existing-host fixture technique, not a new upload/Apply route,
canonical route replacement, deployment or immutable publication.

## Cost and remaining judgment

The three JSON files total 2,346 bytes; their Articles total 1,609 bytes
(3,955 combined, measured with `wc -c`). Content edits required no caller-specific
runtime code. Durable verification adds one isolated source test, one browser
test, one Playwright config and one npm command. The test's rail-driving helper
follows the existing repeatability harness; it is test infrastructure rather
than a new production abstraction.

Documentation successfully constrained identity, operation sequence and host
selection. It still required real Article authorship and test-fixture plumbing
to demonstrate a changed file in the host. Negative compilation was not
predictable from the authoring packet alone. Setup and reading time were not
instrumented; these byte counts and test times are not total authoring cost.

These checks do not certify new choreography, all signed/zero values,
cross-browser/font-resize/no-JS behavior of these particular inputs, or teaching
quality. Existing broader repeatability evidence remains separate. No human
visual approval is inferred from passing tests.
