# R4B authored explanation coherence: closeout

Outcome: COMPLETE. Theseus owns the final 22/22 slice state and receipts for
`run-contract.kp.authored-explanation-coherence-v2`. The approved proposal is
`2026-09-09-authored-explanation-coherence-long-loop-proposal.md`. The primary
editorial/visual checkpoint was accepted; the authorized second-caller and
release work is finished. No successor, external model call, deployment or merge
was performed. Branch: `feature/20260907-reusable-reasoning`.

## What an author can now do

One bounded Bayes v2 source owns title/setup, seven stop-linked passages,
full/compact explanation, denominator wording and two practice prompts. Verified
facts and answers come from the existing probability owner, not free prose.
The same selected revision reaches the interactive card, both readings,
extraction, practice and immutable no-JavaScript edition. Invalid replacements
retain the last valid lesson; superseded and disposed owners cannot revive it.

Two actual sources demonstrate reuse:

| Lesson | Source bytes | Model/result | Implementation needed for second source |
| --- | ---: | --- | --- |
| Spam filter | 6,607 | Prior 1/100; posterior 2/13 | Primary implementation and review |
| Red draw from two urns | 6,273 | Prior 1/3; posterior 1/7 | One source file; no runtime/renderer glue |

The urn starts with the observation-first tree, unlike the spam lesson. Both use
the existing seven-stop controls, persistent SVG and native KaTeX compositor.
The canonical artifact remains `animation.probability.flagged-ticket-bayes` at
`http://localhost:8000/experiments/bayesian-reasoning/`; BinaryJointModel, verified
trace and governed evidence remain semantic truth. The default page still loads
the v1 example. Load the spam explanation and Apply, or paste the committed urn
source into the existing editor and Apply. The older “Load urn example” remains
the original v1 compatibility example, not the newly authored explanation.

Sources: `content/authoring/r4b-spam-filter.bayes.json` and
`content/authoring/r4b-urn-explanation.bayes.json`. The shared CLI exposes named
`spam-explanation` and `urn-explanation` examples; see the updated Bayes authoring
packet. Shared card/edition assembly is domain-local; no universal prose schema,
new probability model, renderer, motion or editor framework was introduced.

## Inspection and reproduction

The single local server remains port 8000. Release editions snapshot the repaired
provenance wrapping; previously issued editions are not overwritten.

- [Spam explanation edition](http://localhost:8000/tmp/codex/bayesian-editions/637f9e7ff7d18f1ce51722179dbc83e4d1cd6ee14de21b2b0d48b6d892961d6f/index.html)
- [Urn explanation edition](http://localhost:8000/tmp/codex/bayesian-editions/141948bf5cf49e63ae640a433c152d7bffe72a0ad3cfb52b8751ed46f5f1aa78/index.html)

These local generated outputs are reproducible, not committed publications:

```sh
npm run author:bayesian-publication -- --source content/authoring/r4b-spam-filter.bayes.json --check
npm run author:bayesian-publication -- --source content/authoring/r4b-urn-explanation.bayes.json --check
npm run check:authored-bayes-workflows
```

Omit `--check` to recreate a missing edition. Spam lesson revision is
`sha256:a5b48db5cee74e19aca2fdf0b1651ebf8ea7376a734fd3ba3cbc9f968013a24f`;
urn revision is
`sha256:bc638cfdfc716e3851f93f170b6a9470cdb5e9de1f2477b946d78231f490a803`.
The urn HTTP URL returned 200 at closeout. Durable evidence resides in committed
sources, tests and scoped commands, not disposable screenshots.

## Release evidence and costs

- `npm test`: 6,853 passed; zero failures, skips or cancellations.
- `npm run visual:authoring-entrypoints:cohort`: 69 passed, 23 each in Chromium,
  Firefox and WebKit, preserving the earlier equation/code/Graph3D/Bayes paths.
- Full typecheck and build passed; bundle rebuilt after the CSS repair.
- Reader budgets, reader production closure (12 routes), dev-review production
  closure (455 files), both edition checks and reachability freshness passed.
- Core inference: 112,493 types / 192,595 instantiations; complete combined
  frontend: 142,340 / 239,402. All 48 core fixtures and the complete consumer
  fixture retained. No additional cost amendment or budget waiver in this
  post-approval continuation.
- Repeated real Apply/disposal tests passed across browsers; zero idle mutations.
  Six-swap Chromium discovery observed 131–205 ms Apply; later concurrent release
  checks were slower. These are diagnostic observations, not device benchmarks.

The initial browser cohort was 66/69. A 71-character revision hash widened the
static urn page to 566 px at a 390 px viewport. Scoped provenance wrapping fixed
the actual overflow without changing mathematical ink. A WebKit code-card test
sampled expected progress before a click blurred the slider and started its
legitimate settlement. Capturing at activation fixes the test while preserving
exact equality; no navigation/runtime fix was required. The fresh 69/69 cohort
includes both repairs. See `2026-09-09-authored-explanation-authoring-evidence.md`
for authoring interventions, lifecycle ownership repair and honest provenance.

Continuation commits: `1a7e03095` approval; `8eddb9b22` urn; `9790dc544`
discovery; `8c13da336` adversarial checks; `cebc9338d` shared assembly;
`bcca50bfd` workflow evidence; `9edbb9ea4` lifecycle/costs; `bbfd5fb2f` release.
The closeout commit contains this report and final execution receipts.

## What this does not establish

Authored prose is editorial, not a theorem. Changing numeric parameters updates
bound facts but can invalidate a free-text interpretation. The implementing
assistant authored both lessons: no independent LLM success rate, human authoring
time, physical-device Safari result or learner-comprehension improvement was
measured. Broader R4 promotion and external model trials remain deferred. The
existing large-bundle advisory remains; fixed production budgets were not raised.

## One next recommendation: verified common-factor authoring

Propose a bounded M1 task: author a common-factor deduction with ordinary LaTeX,
verified endpoint correspondence and existing animation mechanisms, then pressure
it with a structurally different numeric-factor caller. This is a recommendation,
not authority to implement it or expand all lower-undergraduate math at once.

Read-only compiler probes on September 9 found:

| Explicit `kp.algebra.factor-common-term` request | Observed result |
| --- | --- |
| `ab+ac` → `a(b+c)` | Unsupported-syntax repair at target |
| `2x+2y` → `2(x+y)` | Unsupported-syntax repairs |
| Explicit `\\cdot` versions of those deductions | Unsupported-syntax repairs |
| `a*b+a*c` → `a*(b+c)` | Compiled candidate |
| `2*x+2*y` → `2*(x+y)` | Compiled candidate |
| `a*b+a*c` → `a*(b+d)` | Also compiled candidate, despite invalid equality |
| `2*x+2*y` → `3*(x+y)` | Also compiled candidate, despite invalid equality |

Reproduce through `compileKpEquationTransformSeries` in
`src/authoring/compile-equation-transform-series.ts`, with request schema
`kp.equation-transform-series-request.v1`, kind `equation-transform-series-request`,
two states `{id, latex}`, and one adjacency with matching `fromStateId` /
`toStateId`, `intent: {mode: "explicit", operationId:
"kp.algebra.factor-common-term", semanticArguments: {}}`. No governed sources
or external diagnostics were supplied. The compiled plan reports
`authority: "explicit-request"`; this is not evidence that downstream verified
rendering or publication would accept the invalid deduction. Those downstream
paths were not exercised by these probes.

The registry already contains the factoring operation and its distributive-law
references. The coverage plan's substitution/collection/factoring family remains
Exemplar, not family certification. Therefore the useful gap is end-to-end
authoring authority and notation, not simply inventing another factoring motif.

Recommended order inside the next proposal:

1. Trace the candidate-to-verified-renderable boundary and pin invalid-deduction
   rejection there. Prefer distinct nominal/discriminated candidate and verified
   authorities so an explicit operation name cannot stand in for proof.
2. Support the smallest declared-symbol LaTeX subset needed by the actual task.
   Do not globally rewrite adjacent letters into multiplication: identifiers and
   functions require semantic context. Preserve located unsupported-syntax gaps.
3. Feed verified results through the existing Focus Card, shared controls and
   governed motifs. Review one representative visual before generalization.
4. Add the second caller and negative cases, then release checks and honest
   authoring-cost evidence. Require real compositor evidence before promotion.

This prioritizes a usable, rigorous deduction workflow while preserving the
cross-domain roadmap. It neither replaces Bayes truth nor creates a universal
CAS. Independent author/LLM and comprehension evidence remain separate product
research needs, not silently satisfied by compiler tests.

## Resume boundary

Read the roadmap, active thread and this report; run `theseus work resume` and
`npm run --silent loop:status`. R1–R4B are completed evidence. Old inference stops
and the accepted visual checkpoint are historical, not active blockers. Draft
and obtain approval for a bounded successor before implementation. Retain the
standing minimal visual check-ins and automatic nonvisual/TypeScript cost repair
policy; do not merge or launch a successor merely because this run is complete.
