# Author a reusable algebra intuition

Task: `equation.algebra-intuition`. Input: `kp.composed-algebra-source.v2`.
This extends the bounded three-state task; it does not change v1 acceptance.

## Start with a working source

- `src/authoring/examples/composed-algebra-intuition.json`: five states, one variable and a constant contribution.
- `src/authoring/examples/composed-algebra-intuition-transfer.json`: four states, two variables and no final constant evaluation.
- `content/authoring/algebra/whole-and-parts.json`: accepted four-state whole-to-parts explanation, with text above the native animation.

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

## Export and reopen a local edition

```sh
npm run author:composed-algebra-publication -- --source src/authoring/examples/composed-algebra-intuition.json
npm run author:composed-algebra-publication -- --source src/authoring/examples/composed-algebra-intuition.json --check
npm run author:composed-algebra-publication -- --source content/authoring/algebra/whole-and-parts.json --interactive
npm run author:composed-algebra-publication -- --source content/authoring/algebra/whole-and-parts.json --interactive --check
```

The existing immutable writer packages exact source bytes, build-time KaTeX,
Full/Compact readings, both independent questions and self-checks. It rejects
altered output; do not overwrite old editions. Shared template changes enter
new content-addressed builds. Without `--interactive`, output is static, including
v1 compatibility. Explicit interactive output supports v2 only and packages the
existing native card, with prose above its stage and complete static reading below.
It contains no editor; author a new source and rebuild to change it.

The command prints its `directory`, source digest, explanation revision and byte
edition ID. With the shared dev server running, open the returned directory's
`index.html` under `http://localhost:8000/` (remove the repository prefix from the
filesystem path). Alternatively serve that directory over local HTTP. Copy the
whole directory when moving it: the manifest includes all chunks, styles and
fonts. Opening `file://` is not the supported module-loading route.

Scrub, wait for the URL to settle, then reload or copy the URL to reopen the exact
fractional position. Playback hashes include the source revision; another
edition cannot silently interpret that position against different mathematics.
Malformed/mismatched links show a repair message and leave the original hash
intact. Clear or correct the hash to recover. Static content remains readable
without JavaScript and when enhancement fails.

`--check` reproduces the complete closure and rejects modified, missing or extra
files. It does not repair an old edition by overwriting it. These are local
outputs, not deployment or an arbitrary algebra generator. Smaller questions
remain complete static readings in an edition; interactive scoped questions and
editable practice remain capabilities of the development host.

Use `npm run measure:algebra-editions` for complete reader/editor and archived
asset costs, and `npm run visual:algebra-editions` for the isolated HTTP browser
cohort. The native compiler/renderer is still substantial; output includes lazy
chunks even when a particular explanation does not request them. Separate
edition directories retain their own assets, with no cross-edition deduplication
or multi-card amortization claim.

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
