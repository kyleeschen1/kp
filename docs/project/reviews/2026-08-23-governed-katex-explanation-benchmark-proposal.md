# Governed KaTeX Explanation Benchmark Proposal

Status: proposed recurring benchmark; not yet an implementation contract
Reviewed: 2026-08-23
Active thread: `../threads/animation-catalogue.md`
Benchmark ID: `benchmark.kp.governed-katex-explanation.v1`

## Decision Question

Can Kinetic Press turn a natural-language teaching goal and a verified
mathematical trace into a deterministic Native KaTeX sequence and a grounded,
pedagogically clean explanation using only governed operations and promoted
motifs—or return an exact typed repair gap when it cannot?

The model does not generate authority. Mathematical authority belongs to a
solver, interpreter, authored proof, or verified fixture. Presentation
authority belongs to KP's compiler and renderer contracts. The model may
propose semantic intent, operation selection, role bindings, grouping,
explanation depth, and pedagogical emphasis.

This correction matters because “LLM-generated authority” would collapse the
boundary that currently prevents plausible prose or attractive motion from
silently asserting unsupported mathematics.

## Current Baseline

KP has most of the required pieces, but not one end-to-end recurring benchmark.

| Capability | Current evidence | Remaining gap |
|---|---|---|
| Verified mathematical authority | Generated problem traces, governed operations, exact source binders, and fail-closed repair diagnostics | Authority sources and operation coverage are still bounded by family |
| LLM planning boundary | Natural-language equation-series planner and a six-case live-model benchmark | The live benchmark stops before rendering and explanation |
| Governed operation compilation | Direct equation-intent facade plus a three-member governed construction cohort | The authoring paths are related but not one public end-to-end request contract |
| Standard motifs | Promoted carrier, correspondence, shell, cancellation, fraction, evaluation, and operator-application machinery | Maturity varies by operation; many equation assets remain adapter-backed or static-only |
| Native KaTeX rendering | Canonical endpoint and compositor paths with lifecycle and paint-ownership laws | Not every caller traverses the same certified mechanism; a loadable asset is not proof of Native KaTeX conformance |
| Grounded explanation | The verified subtract-then-divide linear solve has a deterministic claim authority, explanation spine, and learner projection | This is specialized and template-authored; no general LLM-planned explanation path is certified |
| Pedagogical review | Human-approved exemplars and visual checkpoints | No recurring rubric scores explanation-motion alignment, granularity, cognitive load, and misconception risk together |
| Honest unsupported behavior | Typed gaps and zero-silent-fallback laws exist | The complete prompt-to-render-to-explanation path is not tested for abstention |

The present inventory therefore supports a narrower claim: KP can govern and
render several bounded mathematical transformations, can benchmark LLM
operation selection, and has one human-gold generated solve with a grounded
deterministic explanation. It cannot yet claim general prompt-to-pedagogical-
KaTeX generation.

## Caller Convergence

All callers do not currently use one literal pipeline:

- the governed canonical-construction cohort uses one public request and
  compilation contract for three promoted variations;
- the natural-language equation-series path separates probabilistic planning
  from deterministic binding, validation, and compilation;
- the direct equation-intent facade dispatches bounded requests to existing
  operation authorities;
- generated problem import converts verified traces into animation assets; and
- the verified linear-solve explanation compiler is a specialized explanation
  path.

Equation assets also remain split across canonical, adapter-backed,
static-only, and retirement-candidate paths. Cross-domain callers should not be
forced through one mathematical frontend: equations, code, graphs, and 3D own
different semantic authorities.

The target is therefore not one implementation function. It is one governed
handoff and one set of observable laws:

```text
teaching goal + learner context + verified trace
  -> LLM semantic/pedagogical proposal
  -> exact source binding and validation
  -> compiler-selected operations, profiles, and motifs
  -> deterministic sequence
  -> canonical Native KaTeX projection
  -> claim-grounded explanation projection
  -> lifecycle, accessibility, and human pedagogy review
```

Every supported equation caller should be identifiable at each boundary. A
domain-owned frontend may differ, but it must not bypass mathematical
authority, select renderer geometry or timing, invent a motif, or substitute a
generic fade for a missing operation.

## Standard Benchmark Request

Use this formulation when asking for the recurring review:

> Run the KP Governed KaTeX Explanation Benchmark against the current branch.
> Given a natural-language teaching goal and a verified mathematical trace,
> determine whether an LLM can propose a governed construction request and
> pedagogical score that KP compiles—without model-authored mathematical or
> presentation authority—into a deterministic Native KaTeX sequence and a
> claim-grounded explanation using only promoted motifs. Require an exact typed
> repair gap for unsupported requests. Report regressions, caller-path
> divergence, and the next smallest closure slice.

The short recurring request is:

> Run `benchmark.kp.governed-katex-explanation.v1` and report the gap delta.

## Benchmark Corpus

Version 1 should use a small, pinned corpus rather than an open-ended survey.
It should include:

1. a supported variation of an existing operation with fresh notation and
   values;
2. a two-operation composition, such as derivative rule application followed
   by constant-difference evaluation;
3. a structurally different caller reusing an already promoted motif;
4. compact, standard, and expanded explanation-depth requests over identical
   mathematics;
5. an ambiguous or unsupported near miss that must return a typed repair gap;
6. an adversarial authority attempt that asks the model to specify truth,
   DOM selectors, geometry, keyframes, timing, or a free-form recipe; and
7. at least two held-out supported cases that are not copied from an authored
   asset or prompt example.

The same pinned prompt, model revision, compiler revision, motif/profile
revisions, and source fixtures must be recorded for every run. Model output and
repair attempts remain evidence, not authority.

## Pass Contract

The benchmark has hard automated gates and a separate human pedagogy gate. A
high average cannot compensate for a failed authority or fallback law.

### Hard gates

- every mathematical claim binds to an exact verified source object,
  operation, or frame;
- the model emits no mathematical truth, renderer, geometry, timing, DOM, or
  free-form motion authority;
- supported requests select an allowed operation and compiler-owned
  presentation profile;
- unsupported requests return a specific typed gap with actionable repair
  guidance;
- silent fallback count is zero;
- no caller-specific renderer, timing, geometry, or motif implementation is
  introduced;
- source-native and target-native KaTeX endpoints remain exact;
- realized paint has exclusive ownership during transit and settlement;
- direct seek, rewind, replay, interruption, and URL restoration converge on
  the same semantic state;
- required contextual information remains legible and accessible; and
- explanation sentences introduce no claim absent from the verified trace.

### Repeatability gates

- each live-model case is run three times against a pinned model revision;
- supported cases select the exact operation on all three runs, either first
  pass or after at most one typed repair;
- unsupported cases abstain on all three runs;
- deterministic compiler, renderer, and explanation outputs remain stable for
  identical accepted requests; and
- a second caller reuses certified machinery without adding a caller-local
  presentation path.

### Human pedagogy gate

A reviewer scores each supported case from 1–5 on:

- mathematical and causal clarity;
- step granularity and absence of redundant beats;
- explanation-motion alignment;
- attention hierarchy and cognitive load;
- concise, natural wording; and
- avoidance of likely misconceptions.

A promotion candidate requires at least 4/5 on every dimension and no critical
finding. The model must not grade its own pedagogy. Human preference about
shape, timing, emphasis, and choreography remains an exemplar checkpoint until
a second caller proves a reusable boundary.

## Result Vocabulary

Every case receives exactly one outcome:

- `PASS_SUPPORTED`: governed request, verified compilation, rendered sequence,
  grounded explanation, and all gates pass;
- `PASS_TYPED_GAP`: KP correctly refuses an unsupported or ambiguous request
  and names the repair boundary;
- `FAIL_AUTHORITY`: unverified mathematics or forbidden presentation authority
  crosses the boundary;
- `FAIL_COMPILATION`: a declared-supported request cannot compile;
- `FAIL_CONFORMANCE`: rendering, lifecycle, paint ownership, or accessibility
  breaks;
- `FAIL_PEDAGOGY`: the artifact is technically valid but fails human review;
  or
- `FAIL_PIPELINE_DIVERGENCE`: a caller bypasses or duplicates the governed
  handoff.

The headline report should show supported-pass rate, typed-gap precision,
first-pass rate, one-repair recovery rate, silent-fallback count, authority-
attempt count, pipeline-divergence count, automated conformance, human rubric
scores, and changes from the previous pinned run.

## Target

The near-term target is reliable prompt-to-reviewed-artifact throughput for a
declared supported subset, not universal mathematical animation generation:

- 100% hard-gate compliance and zero silent fallbacks;
- 100% correct support or typed-gap classification across three repeated runs;
- at least 90% first-pass success and 100% success within one typed repair for
  supported cases;
- one full compile-render-explain browser harness over 8–12 representative
  cases;
- at least two held-out callers and one structurally different motif-reuse
  caller;
- no new caller-specific presentation code for reused certified mechanisms;
  and
- human pedagogy approval for every case claimed as a reference exemplar.

Run the benchmark after changes to the planner prompt, public authoring
contract, operation catalogue, motif/profile registry, Native KaTeX
compositor, or explanation compiler, and periodically against the pinned live
model. Do not compare scores across unpinned model or prompt revisions.

## Recommended Next Slice

If this benchmark is approved, implement one bounded vertical harness before
promoting another family. Reuse the approved derivative exemplar as the
two-operation case and the verified linear solve as the grounded-explanation
reference. Add only the evidence needed to connect planning, binding,
compilation, Native KaTeX rendering, and explanation auditing. Stop at a human
checkpoint before generalizing explanation generation or treating the
operator-scope box as shared presentation policy.

Preserve the existing semantic models, operation authorities, renderer
ownership, and domain-specific frontends. The smallest rollback unit is the
benchmark harness and its proposal-to-result adapter; no production caller
needs to migrate merely to establish the measurement.

## Baseline Check, 2026-08-23

- equation-series benchmark fixtures: 19 passing checks;
- governed canonical construction: 61 passing checks;
- transformation coverage: 18 passing checks;
- direct equation-generation boundary: 9 passing, 3 failing because the
  exponential-homomorphism surface lacks a matching pressure fixture;
- verified linear explanation/session: 7 passing, 1 failing because the
  production asset is not byte-equivalent to the trusted compiler output.

These failures do not establish a mathematical or renderer regression by
themselves, but they are exactly the kind of drift a recurring benchmark must
surface rather than averaging away.
