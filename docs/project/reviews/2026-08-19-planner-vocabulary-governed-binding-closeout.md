# Planner vocabulary and governed binding closeout

Date: 2026-08-19

Status: complete

## Outcome

Natural-language equation planning now ends at one narrow, model-neutral
boundary:

```text
natural-language intent
→ canonical operation proposal
→ alias validation and provenance
→ deterministic verified-source binding
→ governed validation
→ deterministic compilation or typed repair
```

The model may choose only canonical registered operations. It cannot author
semantic arguments, source identity, correspondences, assumptions,
presentation, geometry, timing, or motion.

## What closed

- Every operation explicitly declares canonical planner exposure or alias
  status; source-owned summaries replace ID-shape prompt heuristics.
- A source-derived alias protocol preserves backend compatibility while
  presenting one semantic vocabulary to the model.
- Unknown and forged aliases fail closed; accepted normalizations retain
  requested-to-canonical provenance.
- Unsupported work is a first-class typed abstention and never enters
  compilation.
- Governed source selection requires exact source and revision pins,
  operations, endpoints, correspondences, entities, assumptions, and branded
  contracts.
- Registry-owned binders cover all six balanced operations and logarithm
  change of base without a central operation switch.
- One orchestration entrance joins planning, binding, repair, and compilation.
- Planner, binding, and compilation failures retain the exact last valid
  candidate with an explicit recovery disposition; there is no silent
  fallback.
- Benchmark reports require explicit model identity, repetition count, prompt
  fingerprint, and per-run raw-response provenance.

## Measured evidence

The deterministic gate passed equation-series orchestration and corpus suites,
balanced-operation and change-of-base governance, architecture ownership,
framework-neutral entrypoints, and all TypeScript/Svelte/domain typechecks.

The pinned live checkpoint used `gpt-5.6-sol`, three repetitions, six cases per
repetition, and prompt fingerprint `fnv1a64:882146c856a2586a`:

- 18 of 18 case-runs passed;
- 15 of 15 supported selections used the exact expected operation IDs;
- all proposed adjacencies preserved identity;
- 3 of 3 unsupported fraction-equivalence requests abstained explicitly;
- authority attempts: 0;
- compiled selection mismatches: 0;
- silent fallbacks: 0;
- provider errors: 0.

Full live evidence is in
`2026-08-19-equation-series-pinned-live-benchmark.md`.

## Decision

Close planner-vocabulary and governed-binding convergence. Preserve this
boundary and add capability through registered semantic operations and source
binders, not prompt elaboration or model-authored truth.

Fraction equivalence and repartition is now the next bounded family. Build one
governed semantic operation and one reversible native-KaTeX exemplar, then
stop for human visual review before promotion or broader generalization.
