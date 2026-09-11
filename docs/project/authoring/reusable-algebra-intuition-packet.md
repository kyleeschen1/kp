# Author a reusable algebra intuition

Task: `equation.algebra-intuition`. Input: `kp.composed-algebra-source.v2`.
This extends the bounded three-state task; it does not change v1 acceptance.

## Start with a working source

- `src/authoring/examples/composed-algebra-intuition.json`: five states, one variable and a constant contribution.
- `src/authoring/examples/composed-algebra-intuition-transfer.json`: four states, two variables and no final constant evaluation.

Run from the repository root:

```sh
npm run author:check -- --task equation.algebra-intuition --example
npm run author:check -- --task equation.algebra-intuition --request src/authoring/examples/composed-algebra-intuition.json
npm run author:check -- --task equation.algebra-intuition --request src/authoring/examples/composed-algebra-intuition-transfer.json
```

Open <http://localhost:8000/experiments/reusable-reasoning/?example=algebra-intuition>.
Paste the selected JSON in **Edit source JSON**, then **Apply source**. Editing
text alone does not replace the displayed explanation. A failed draft preserves
the prior native card and its downloadable source. Download, reload, and reapply
the saved bytes to recover the exact checked revision. Edited links do not store
custom source automatically; matching source is required.

## Author reasoning, not motion

Keep stable lesson/state IDs, declared single-letter real symbols, ordered LaTeX
endpoints and editorial title/setup/summary/narration. The checker owns proof;
canonical operation extensions own factoring, ink-glyph evaluation and
distribution; the shared native session and card own paint and playback.
Do not supply selectors, coordinates, timing tables, proof-shaped JSON or a
replacement animation. A successful check is a report, not live Apply authority.

Supported chain: factor two nonnegative integer counts of the same binary sum;
evaluate the count; distribute it to both ordered members; optionally evaluate
the final addend when it is a product of two nonnegative safe integers. Keep the
first contribution unchanged. Broader algebra requires a typed gap, not fallback.

The source asks a question, states its starting context, and explains what
changes and what is preserved. The two smaller questions derive their referents
and evidence from this checked chain. Full/Compact, whole/scoped Predict and
Reconstruct, and static editions use the same revision. Prose remains editorial;
self-checks do not grade reasoning or establish learning/retention efficacy.

## Two common repairs

- Replacing the distribution endpoint `5x+5*3` with `5x+15` produces
  `unsupported-shape` at `$.states[3].latex`. Keep the product explicit, then
  evaluate it in the separate fifth state. Never silently combine both moves.
- Adding a fifth evaluation state after `6x+6y` produces `unsupported-shape`
  at `$.states[4].latex`. The final product contains a symbol: retain the valid
  four-state chain instead of inventing symbolic evaluation.

Executable examples and recovery assertions live in
`tests/composed-algebra-repair-v2.test.ts`.

## Publish a static edition

```sh
npm run author:composed-algebra-publication -- --source src/authoring/examples/composed-algebra-intuition.json
npm run author:composed-algebra-publication -- --source src/authoring/examples/composed-algebra-intuition.json --check
```

The existing immutable writer packages exact source bytes, build-time KaTeX,
Full/Compact readings, both independent questions and self-checks. It rejects
altered output; do not overwrite old editions. Shared template changes enter
new content-addressed builds. This is not animated export or public deployment.

## Observed effort and limits

The second source changed the group from `x+3` to `x+y`, the counts and the state
count. It passed the first checked compile and actual native Apply without engine
changes. One generated answer incorrectly mentioned the absent final evaluation;
the shared editorial projection now keys that sentence to the checked chain
extent. Download/reload/reapply reproduces both revisions. This is one local
source-only adaptation—not a fresh model trial, timed author benchmark, general
author economics claim or learner outcome study.

Preservation and regression commands: `npm run test:composed-algebra-authoring`,
`npm run visual:composed-algebra`, and the supported-browser cohort at promotion.
Release status and remaining assurance come from the active Theseus contract,
not this packet's existence.
