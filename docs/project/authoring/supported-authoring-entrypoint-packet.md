# Supported authoring entrypoint packet

Status: canonical bounded local task packet
Start with `llm-generation-entrypoint.md`; run commands from the repository root.
This is executable local integration evidence, not a live-model or comprehension
benchmark. No external model call, browser write API or automatic publication occurs.

## Select before authoring

```sh
npm run author:check -- --list
npm run author:check -- --task bayes.binary --example
npm run author:check -- --task equation.logarithm-base --example
```

Examples are raw editable source JSON, not prepared objects or check reports.
Choose an exact listed task; unknown task names fail before source reads or owner
imports. `--request path|-` reads a UTF-8 regular file or stdin, bounded to 100,000
bytes and 64 structural nesting levels. Author only the selected schema's fields,
never serialized proof, geometry, renderer selection, timing or a new clock.

| Task | Accepted scope | Preview / publication boundary |
| --- | --- | --- |
| `equation.common-factor` | One ordered common factor: a declared single-letter scalar or a nonnegative single digit, with symbolic addends; two endpoints, one transition. Multi-digit factors return `unsupported-presentation`. | Explicit Apply at `/experiments/reusable-reasoning/?example=common-factor`; full/compact reading, bounded prediction/reconstruction with exact return; `author:common-factor-publication -- --source <file>` emits an immutable static reading/self-check edition, not interactive animation |
| `bayes.binary` | Exact binary joint masses or prior and two likelihoods; strict v1 defaults or bounded v2 editorial explanation | Explicit Apply at `/experiments/bayesian-reasoning/`; immutable local Bayes edition |
| `equation.logarithm-base` | Supported positive numeric base other than one, positive argument, coherent two-state change of base and narration | Explicit Compile at `/experiments/authoring-market/#equation-authoring`; export inside a selected market branch, not as a standalone edition |
| `reasoning.equation` | Existing verified distribution-operation prefixes and editorial explanation | Explicit Apply at `/experiments/reusable-reasoning/`; context, readings, practice, exact return and immutable equation-reasoning edition |
| `reasoning.code` | Existing TypeScript free-shipping source revisions, exact stage pins and editorial prose | `/experiments/reusable-reasoning-code/` is reference-only, not a selected-source editor; bounded context/return, no selected-source edition builder |
| `graph3d.saddle` | Pinned fixed-camera saddle denominator 4 → 8 through the existing gallery router | Follow the exact accepted result's `artifact.directUrl`; no selected-source edition or reasoning extraction |
| `graph2d.supply-tax` | Existing market branch, parameters, Article bindings and optional governed equation | `/experiments/authoring-market/` follows trusted local source builds/retained revisions, not JSON Apply; local named text-and-exact-facts edition |

The executable capability inventory owns these distinctions. A report has
`authority: report-only` and `handoff.execution: not-performed`. A successful
check or route link never proves a revision was applied, reviewed or published.
Preserve `result` diagnostics verbatim: owner codes/paths and equation repairs
remain domain-specific; transport failures have `author-invocation-gap`.
Exit 2 means a repair is required. Repair the selected source and recheck; do
not feed the check report back as source or erase constraints to obtain success.

## Two retained tasks and exact checks

The urn task requests prior 1/3, likelihoods 1/4 and 3/4, and red-first key-steps
teaching. Its four joint masses are 1/12, 1/4, 1/2 and 1/6; posterior is 1/7.
The logarithm task requests log base 3 of 9 and the equivalent natural-log quotient.

```sh
npm run author:check -- --task bayes.binary --request content/authoring/r4a-urn-prior.bayes.json
npm run author:check -- --task equation.logarithm-base --request content/authoring/r4a-logarithm-base.json
npm run author:assess -- --task urn-prior-third --request content/authoring/r4a-urn-prior.bayes.json
npm run author:assess -- --task log-base-three --request content/authoring/r4a-logarithm-base.json
npm run check:authoring-task-packet
```

The last command runs the same CLI boundary for both tasks, checks their source
bytes, verifies fulfillment against compiler-owned values, proves that untouched
starters compile but fail the changed-task intent, and demonstrates `{}` repair
results. It never writes source. Additional executed cases live in
`tests/authoring-entrypoint-fulfillment.test.ts`: equivalent joint form succeeds;
wrong teaching, wrong operands and a different model with the same posterior fail
intent; an undefined condition or reversed quotient fails compilation.
Editorial prose quality and the meaning of free labels remain ungraded.

## Explicit visual and edition handoff

The proven authored explanations are `content/authoring/r4b-spam-filter.bayes.json`
and `content/authoring/r4b-urn-explanation.bayes.json`. Check either with the same
`bayes.binary` task. Retrieve them with `author:bayesian-reasoning -- --example
spam-explanation` or `--example urn-explanation`. The original generic examples
remain v1. See `bayesian-reasoning-packet.md` for the closed v2 slots and limits.
Authored check summaries explicitly report `editorial-not-proof`; this does not
grade free prose or confer prepared, applied or publication authority.

Use the existing shared port-8000 server. A host URL does not load the retained
source automatically. Paste the selected JSON and Apply/Compile, inspect all
stops and continuous reverse travel, then export through that host's control.
The retained browser workflows are executable with:

```sh
npm run visual:authoring-entrypoints -- --grep 'R4A retained'
```

Bayes **Download displayed source** exports the valid displayed revision even
with an unapplied draft. Build that selected file with
`author:bayesian-publication -- --source <file>` and verify with `--check`.
Equation inclusion in market export requires **Include displayed, compiled
equation in this edition**; dirty or invalid equation drafts block inclusion.
Build that `.market.json` using `author:market-publication -- --source <file>`.
Bayes and equation-reasoning editions preserve immutable content-addressed bytes;
market edition names are rebuildable directories, so use a new name to preserve
an older named output. No builder deploys or modifies canonical source files.

These editions are generated artifacts, not live subscriptions: shared templates
change future builds, while previously exported immutable bytes remain unchanged.
Static reading does not imply animated-publication parity across domains.

## Deeper owner packets and compatibility

- `common-factor-authoring-packet.md`: verified ordered factoring, source-only numeric reuse and presentation limits.
- `bayesian-reasoning-packet.md`: probability context, teaching and publication.
- `reusable-reasoning-packet.md`: equation/code assumptions, prefixes and returns.
- `authoring-round-trip-packet.md`: market file authoring and equation inclusion.

Existing `author:bayesian-reasoning` and `author:reasoning` commands retain their
grammar and delegate owner checking. `author:equation-series -- --example
logarithm-change-of-base` remains explicitly pinned to its original reference;
use `author:check -- --task equation.logarithm-base` for supported numeric edits.
No arbitrary algebra, new mathematical family, code refactor or Graph3D formula
is authorized by this packet. Return the typed gap at the existing owner.
