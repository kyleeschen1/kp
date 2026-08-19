# Fixed Live-Model Equation Generation Benchmark

Date: 2026-08-19
Status: historical baseline; convergence completed by
`2026-08-19-planner-vocabulary-governed-binding-closeout.md`

## Question

Can a live model use the governed equation-series entrance to select the
intended semantic operations while KP retains mathematical, identity,
assumption, presentation, and motion authority?

## Method

One fixed six-case corpus covers function wrapping, distribution, logarithm
product decomposition, a three-adjacency exponential solve, logarithm change
of base, and unsupported fraction equivalence. A provider-neutral evaluator
scores exact operation IDs, adjacency identity, governed repairs, explicit
unsupported abstention, forbidden authority fields, compiled selection
mismatches, and silent fallback.

The script-only Codex adapter sends the shared registered catalogue and all six
requests in one ephemeral, low-reasoning structured-output call. It instructs
the subject not to inspect the repository. The returned records still pass
through the production planner validator and equation-series compiler. Raw
responses and replayable reports remain disposable under `tmp/codex/`.

The first attempted call was excluded: the provider rejected the adapter's
JSON Schema before model inference because `const` properties lacked explicit
types. The adapter was corrected without changing the corpus.

## Results

Across the two valid calls, the model consistently:

- selected distribution, the complete ordered exponential-solve sequence,
  and change of base;
- preserved every proposed adjacency identity;
- explicitly abstained on unsupported fraction equivalence;
- authored no semantic arguments, truth, geometry, rendering, or timing;
- reached KP's typed governance repairs for the operations that require a
  verified semantic source;
- triggered zero silent fallbacks.

The strict benchmark was not stable-green. Function wrapping and logarithm
product decomposition each expose two plausible registered IDs. One response
selected `kp.algebra.wrap-function` and `kp.semantic-motion.log-product`; the
next selected `operation.wrap-function.v1` and
`operation.equation.log-product-decomposition.v1`. All four IDs compiled, but
only one ID in each pair is the intended planner-facing vocabulary. The latest
replay therefore reports three exact positive selections, two compiled
selection mismatches, one explicit unsupported abstention, zero authority
attempts, and zero silent fallbacks.

This is not primarily a model-reasoning failure. KP is presenting backend
operation kinds and promoted authoring operations as peers, then accepting
either without canonicalizing the choice.

## Decision

Do not open fraction-equivalence choreography yet. First:

1. define one planner-facing canonical operation ID per semantic act;
2. mark implementation operation kinds as internal aliases or normalize them
   before validation and compilation;
3. keep the full registry available to runtime/tooling without exposing its
   duplicate vocabulary to the model;
4. add the deterministic post-selection binding step that joins governed
   choices to already-verified semantic sources without allowing the model to
   mint bindings or evidence;
5. rerun this exact corpus with an explicitly pinned model ID.

If that rerun is stable-green, fraction equivalence and repartition remains the
next visual exemplar.

## Evidence

- `npm run test:equation-series-live-model-benchmark`
- `npm run benchmark:equation-series:live`
- `npm run benchmark:equation-series:live -- --replay`
- `src/authoring/equation-series-live-model-benchmark.ts`
- `scripts/run-equation-series-live-model-benchmark.ts`
