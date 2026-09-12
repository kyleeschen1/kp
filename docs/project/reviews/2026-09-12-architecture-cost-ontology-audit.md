# Architecture, browser cost, and ontology audit

Date: 2026-09-12
Status: independent, bounded audit completed; repairs recommended, not implemented
Baseline: `24d161183c0371e7355b257e641f9716dc9c0325`
Branch: `feature/20260912-mechanics-architecture-readiness`

## Executive assessment

KP has a substantive semantic architecture and valuable working implementations.
The concern is not that the original idea was abandoned. It is that the growing
number of partially converged hosts, publication paths, verification policies,
and presentation dependencies makes reuse more expensive than the architecture
intends. Browser delivery now has measured problems, not just hypothetical risks.

- Preserve the semantic architecture and canonical native renderers. Do not rewrite.
- Repair concrete dependency/ownership defects before expanding mechanics runtime.
- Treat initial delivery and sustained animation as separate performance problems.
- Audit test value; do not equate test count or source-reading assertions with waste.
- Strengthen semantic guarantees at issued-authority boundaries, not by inventing a
  universal category-theory framework.
- Finish a finite readiness pass with explicit retirements, then return to content.

This extends [the initial readiness assessment](2026-09-12-mechanics-architecture-readiness.md),
which inspected gradient integration and three publication builders. It does not
turn that earlier review into a retrospective whole-repository certification.

## Scope and confidence

Source tracing covered algebra, Bayes, economics, code, gradient/Graph3D, shared
semantic contracts, publication, selected tests, and CSS ownership. Fresh browser
measurements covered three built routes, two CPU rates, three repetitions each.
This is broader than the first assessment but is not an exhaustive call graph,
dead-code analysis, security audit, test mutation study, physical-device matrix,
or proof of all renderer laws. No numeric percentage of redundant code is claimed.

Grades are expert judgments within those boundaries, not generated Theseus scores.

| Area | Grade | Confidence / evidence | Main risk | Next action |
| --- | --- | --- | --- | --- |
| Semantic architecture | B+ | High: object, transformation, diagram, correspondence and law implementations | General contracts weaker than selected checked authoring paths | Close authority/immutability gaps at construction boundaries |
| Cross-family integration | B− | Medium-high: five family traces | Shared shell does not imply shared lifecycle/input policy | Name owners and retire redundant host policies |
| Browser delivery | C | High for three measured routes | Broad capabilities and CSS loaded before needed | Route-level loading and dependency closure |
| Low-powered interaction readiness | C− | Medium: repeated uncalibrated 6× CPU probe | Gradient sustained cost; tax first-step stall | Profile hot paths and offscreen mounts; preserve motion |
| Static publication / retroactive repair | C+ | High: three manually assembled editions | Missing transitive typography dependency | One dependency-closure owner; publish new immutable editions |
| Verification maintainability | C+ | Medium: inventory, sampled tests, historical release duration | Repeated metadata assertions and expensive broad gates | Runtime/impact inventory and targeted consolidation |
| Product foundation | B+ | Medium: accepted gradient and source-only reuse evidence | Infrastructure can consume the content-learning cycle | Bounded cleanup, then one mechanics unit and reusable math companion |

## 1. Browser cost: what ships and what it costs

Reproduction after building:

```sh
npm run build:bundle
npm run build:gradient-contour
npm run audit:architecture-cost
npm run visual:architecture-cost
```

The browser command executes already-built files via request interception. It
does not need another local server or external network access.
[Raw measurements and resource lists](2026-09-12-architecture-cost-measurements.json)
retain all 18 samples, separate CSS coverage, environment and manifest hashes.

### Actual requested resources

Sizes below are decimal KB. Gzip is computed per unique requested resource,
not measured on the wire. These include the first-step probe; they are not
claims about every later capability.

| Built route | JS raw / modeled gzip | CSS gzip | Fonts gzip | Total gzip including HTML | Resource count |
| --- | ---: | ---: | ---: | ---: | ---: |
| Static-first quadratic reader | 221.5 / 63.1 KB | 21.4 KB | 42.8 KB | 134.8 KB | 22 |
| Canonical supply-tax host | 2,437.6 / 642.4 KB | 30.3 KB | 42.8 KB | 718.7 KB | 130 |
| Gradient contour | 1,049.2 / 287.6 KB | 26.3 KB | 68.1 KB | 382.3 KB | 7 |

The tax host mounts the tax, equation, code and surface-contour cards up front.
Its cost is not the economics model alone. See
`src/experiments/kinetic-figure-supply-tax/kinetic-figure-supply-tax-entry.ts`.
Shared scaffolding has not made its capability graph minimal.

“Static-first” also does not mean zero JavaScript: the quadratic route actually
requested 221.5 KB raw JS. Conversely, summing every emitted font file would
overstate delivery: gradient requested roughly 68.1 KB of compressed fonts,
not the whole build's multi-format font inventory.

At an assumed sustained connection throughput, idealized transfer floors are:

| Route | 1 Mbps | 5 Mbps |
| --- | ---: | ---: |
| Quadratic reader | 1.08 s | 0.22 s |
| Supply-tax host | 5.75 s | 1.15 s |
| Gradient | 3.06 s | 0.61 s |

These are byte arithmetic, not observed user load times. They exclude latency,
connection establishment, protocol overhead, retries and CPU work. Caching and
Brotli may reduce transfers; deployment compression was not verified. Request
count is not an equal number of sequential round trips under HTTP/2.
Do not mechanically add these floors to local readiness measurements.

Compressed bytes matter for transfer; decompressed JS matters for parse,
compilation and execution. Those are distinct costs, as described in
[JavaScript startup optimization](https://web.dev/articles/optimizing-content-efficiency-javascript-startup-optimization).

### CPU and interaction sensitivity

Environment: Chromium 149.0.7827.55, macOS, reported Apple M2, Node x64,
390 × 844 viewport, DPR 1. Each sample uses a fresh browser context; the browser
process/OS remain warm across samples. Three repeats per route/rate.

“Ready” here means page load, a route-specific readiness selector and font
readiness. It is not LCP, INP, TTI or readiness of all tax sibling cards.
Timings include local fulfillment/harness overhead, including compression work.

| Route | Median readiness 1× / 6× | Median startup script time at 6× | 6× first-step frame observation |
| --- | ---: | ---: | --- |
| Quadratic | 102 / 392 ms | 70 ms | Idle baseline, p95 about 17.6 ms |
| Supply-tax | 849 / 2,304 ms | 1,041 ms | One 234–283 ms rAF gap per sample |
| Gradient | 562 / 1,619 ms | 732 ms | Median gaps about 33 ms; p95 51–67 ms |

Gradient spent about 1.28–1.31 seconds of the two-second interaction probe in
script execution at 6×. Its slowdown is sustained, not solely a loading flash.
Supply-tax's largest startup long task was 1.16–1.31 seconds; gradient's was
0.91–1.47 seconds. At 1×, frame-gap p95 was about 17.5–17.6 ms for all three.
This helps explain why a powerful machine can look fine while a slower CPU does not.

A 6× slowdown is **not a calibrated low-end phone**. It does not reproduce mobile
GPU, RAM, thermal throttling, browser scheduling or touch behavior. Chrome itself
distinguishes host-dependent multipliers from
[calibrated CPU throttling](https://developer.chrome.com/docs/devtools/settings/throttling).
No CPU flame profile was collected, so these results do not identify the exact
function responsible. rAF intervals are a responsiveness signal, not compositor
frame certification. Only the first next-step transition was exercised.

No page errors occurred in the 18 samples. Heap snapshots here are only sampled
JS heap usage, not total process/GPU memory, and cannot establish a leak.

**Recommendation:** profile the tax initialization/mount boundary and gradient's
active projection/update path separately. First avoid work that should not run;
then optimize measured hot work. Do not replace approved choreography with fades
to make a performance number pass. Preserve direct entry, rewind, reduced motion,
static meaning and accessibility when deferring capabilities.

## 2. CSS, code and maintenance inventory

Tracked baseline inventory includes comments, blanks, generated files and fixtures;
these are scale indicators, not hand-written production complexity estimates.

| Inventory | Files | Lines |
| --- | ---: | ---: |
| Source TypeScript | 2,219 | 473,021 |
| Source CSS | 75 | 21,360 |
| Test TypeScript | 2,117 | 319,059 |
| Script TypeScript | 231 | 38,463 |

There are 1,775 unit-test files, 216 browser-spec files and 620 baseline package
commands (622 with the two audit commands). The root stylesheet alone is about
91 KB of source / 4,400 lines. Several core equation implementation files exceed
2,500 lines. These justify ownership review, not arbitrary file splitting.

Separate load-plus-one-step CSS coverage at 390px reported approximately:
16% used for quadratic, 22% for tax, and 14% for gradient. In the tax host, the
75.3 KB built global stylesheet had only about 2.7 KB marked used in this probe.

Coverage measures UTF-16 code units in this narrow run. It says nothing definitive
about other beats, themes, widths, focus states or error states. It is evidence
for **host-specific CSS partitioning**, not permission to purge all uncovered CSS.

### Confirmed versus suspected redundancy

| Finding | Classification | Appropriate response |
| --- | --- | --- |
| Three edition builders manually copy shared stylesheet dependencies | Confirmed duplicate ownership and missing dependency | Shared closure resolver/manifest; negative missing-transitive-dependency test |
| Tax and canonical code cards have local wheel/pointer policies while newer cards use shared input | Confirmed parallel policy implementations | Compare behavior, migrate only against preservation tests, retire old policy |
| Broad global CSS reaches focused reader hosts | Confirmed measured overdelivery in sampled state | Split by real host ownership; verify full supported states before removal |
| Multiple budget/revision policy owners noted in initial report | Confirmed ownership divergence in inspected paths | One authoritative policy per concern; keep distinct semantic/edition identities |
| Large source modules and repeated catalogue expectations | Candidates, not proven duplicates | Trace callers, responsibility and failure coverage before consolidation |
| Separate native renderers and domain mathematics | Usually essential distinctions | Share contracts, not unrelated algorithms |

A source-level dependency can be legitimate while its eager inclusion in a
particular reader bundle is not. Likewise, one file per domain is not itself
duplication. The objective is fewer independent owners of the same rule.

## 3. Are there excessive tests?

There is enough test and command volume to impose a real maintenance tax.
The previously recorded full Node test phase took about 765.9 seconds (12.8 min)
for 7,037 tests. That is historical release evidence, not a freshly rerun benchmark.
This audit does not establish how much time is redundant.

379 of 1,775 unit-test files mention readFile/readFileSync. This is only a heuristic:
many legitimately inspect fixtures, package boundaries or immutable editions.

Sampled cases:
- `tests/current-direction-authoring-ratchet.test.ts` contains historical
  document-phrase expectations. These can keep old wording and routing alive
  without protecting present learner behavior.
- `tests/project-dashboard-symbolic-family-catalog.test.ts` repeats large
  registry expectations. Some are valuable goldens; others may be generated
  table-driven expectations or duplicative metadata protection.
- `tests/native-katex-rendered-scene.test.ts` exercises ownership/lifecycle
  laws. Its size is not a reason to discard it. Mocked law tests also cannot
  substitute for realized native-paint browser evidence.

Recommended test taxonomy: semantic laws, compositor mechanisms, integration
boundaries, authoring repair diagnostics, browser regressions, publication,
metadata/document routing, and release/performance. Every expensive group should
name the failure class it uniquely protects and when it must run.

Measure per-file runtime and affected scope first. Sample representative mutation
or fault-injection tests to establish usefulness. Consolidate repeated
metadata/document assertions only with preserved failure evidence. Keep a small
fast affected-path gate and bounded native/browser canaries; reserve broad
matrices for release/promotion. Do not replace many useful tests with one giant
end-to-end suite.

Also count agent context and policy surface as maintenance cost: the roadmap and
active thread retain extensive completed history. Keep their live sections short
and link provenance instead of requiring future sessions to process it all.

## 4. How much of the original ontology survives?

The governing doctrine remains
[`kp-asset-calculus.md`](../principles/kp-asset-calculus.md) and
[`kp-composition-laws.md`](../principles/kp-composition-laws.md).
It explicitly uses category theory as architectural inspiration, not a mandate
to implement general category theory.

### Real implementation, not just naming

- `src/semantic/asset.ts`: semantic objects, stable IDs and selectors.
- `asset-transformation.ts`: source/target object IDs, preservation categories,
  assumptions, law references and correspondence information.
- `asset-diagram.ts`: identity, sequential, parallel and tree composition;
  sequential boundaries require matching ordered object-ID arrays.
- `asset-laws.ts`: composition, determinism, rewind and interpreter-loss checks.
- `semantic-lineage-graph.ts`: provenance through identity/copy/split/merge.
- `src/animation/asset.ts`: bundles semantic structures with behavior/render ports.

Fresh focused verification passed 34 tests spanning asset laws, correspondence
composition, animation runtime laws and semantic lineage. This is meaningful
executable evidence, not proof of all mathematical or rendering properties.

### Cross-family adoption

| Family | Semantic authority / interpretation | Shared versus local boundary |
| --- | --- | --- |
| Algebra | Checked authoring, verified sequence and canonical native equation machinery | Shared checkpoint/input in inspected newer cards; local host/publication assembly remains |
| Bayes | Validated domain trace creates actual semantic objects and transformations; issued/checked draft ownership | Shared construction and input; domain probability semantics stay separate |
| Economics tax | Generated canonical authored market source and semantic animation asset, correspondence and frame query authority | Shared scaffold/clock; custom input and eager multi-card host |
| Code | Semantic artifact, operation evidence, behavior certificate, score and verified motion plan | Canonical code rendering; inspected focus card retains custom input policy |
| Gradient | Checked field mathematics, branded directions, deterministic sequence and canonical Graph3D stage | Shared clock/input; lesson does not expose equivalent reusable gradient/linearization transformation evidence |

Representative sources include Bayes `draft.ts` / `evidence.ts`,
`canonical-tax-source.ts`, `typescript-free-shipping-animation-asset.ts`,
and `src/tutorial/gradient-contour/gradient-contour-authoring.ts`,
`gradient-contour-model.ts`, `gradient-contour-sequence.ts`.

The gradient is mathematically modeled, not merely a movie. But “compute gradient”
and “form the local linear approximation” have not reached the same reusable
transformation-evidence boundary as Bayes operations. This is partial adoption,
not evidence that its calculations are wrong.

### Important gaps in the guarantees

1. **Immutability is not universal.** The general object constructor stores
   `input.value` directly. A read-only probe created an object from `{x:1}`,
   mutated the original to `{x:2}`, and observed changed content under the same ID.
   Neither object nor payload was frozen. Some newer paths issue stronger checked
   authority, so this is not a claim that every modern asset is mutable.
2. **Law declarations are not proofs.** Assumptions/lawRefs are optional metadata
   in the general transformation type. Domain validation can enforce stronger
   guarantees, but the generic record cannot certify arbitrary mathematics.
3. **Composition laws have a defined scope.** The inspected associativity check
   compares boundary IDs and ordered execution phases. It does not establish
   equivalence of all interpolated frames or every cross-renderer interpretation.
4. **Typed identity is stronger in some layers than others.** Generic string IDs
   and shallow readonly contracts leave invalidity representable outside issued
   wrappers. Assertions or unchecked casts can also bypass TypeScript.
5. **Not every visual transition is a mathematical transformation.** Camera motion,
   attention, disclosure and time sampling must remain distinct from equality,
   inference, approximation and physical evolution.

The right strengthening is an explicit boundary:

semantic objects → domain-validated transformation evidence → pedagogical score
→ deterministic presentation → native renderer.

For future mechanics, distinguish exact equivalence, approximation with validity
conditions, model intervention and time evolution. Preserve source/target,
assumptions, provenance and observables without pretending they are the same
mathematical relation. Require checked authority where correctness is promised;
return typed unsupported/repair gaps otherwise.

Prioritize a small public-construction audit for immutable semantic payloads and
capability-specific transformation evidence. Do not deep-freeze renderer handles
or launch a universal branded-ID migration without measured need.

## 5. Recommended bounded readiness sequence

These are recommendations, not a newly approved run contract.

1. **Publication closure repair.** Fix all three builders through one dependency
   owner. Prove transitive typography inclusion and missing-dependency failure.
   Preserve existing immutable editions; generate new byte-addressed editions.
2. **Reader loading boundary.** Profile and defer tax's unrelated/offscreen
   capabilities; partition focused-reader CSS. Establish byte budgets on actual
   requested route closures, including fonts, not only an entry chunk.
3. **Gradient active-frame cost.** Capture a CPU profile and separate projection,
   DOM/layout and renderer work. Eliminate unnecessary recomputation/writes at
   the owning boundary. Re-run identical probes and pressure later beats;
   validate on a real lower-powered device before making mobile claims.
4. **Semantic authority check.** Audit mutable payload escapes at supported
   issuance boundaries; cover the demonstrated failure class. Describe the
   gradient/local-linearization evidence bridge needed by the first reusable
   mechanics math unit, implementing only the portion that unit requires.
5. **Verification/policy consolidation.** Inventory runtime and unique failure
   protection, reconcile budget/revision owners, then retire demonstrably
   duplicated metadata assertions and input policy. No percentage-cut target.
6. **Return to product.** Build the first question-led mechanics unit plus an
   independently usable mathematics reading. Judge architecture by whether that
   second context costs less, preserves identity, and inherits shared repairs.

Every cleanup package must name a concrete defect/cost, one owner, the old path
it retires, focused preservation evidence, and a stopping condition. An
infrastructure change that adds another wrapper but retires nothing needs an
explicit justification. Do not let this become another unbounded certification
programme before making useful content.

Immediate tradeoff: deferring all performance work makes later content inherit
expensive hosts; doing a universal cleanup now postpones the very reuse cases
needed to choose good abstractions. The bounded sequence addresses observed
problems and lets mechanics supply the next genuine design pressure.

## Verification and limitations

Fresh this audit:
- Main and gradient production builds completed.
- 18 built-route browser samples and three separate CSS coverage samples completed
  without page errors.
- 34 focused ontology/correspondence/runtime/lineage tests passed.
- Node/tooling typecheck completed after correcting optional CSS coverage text.
- Diagnostic commands and measurements are durable; no scratch server was started.

No animation, runtime semantic behavior, CSS, test deletion, budget ceiling or
publication artifact was repaired in this audit. Full release/browser matrices
were not rerun for report/tooling-only changes. Physical low-end devices, Safari
performance, deployment compression, hard offline behavior, every gesture/beat,
complete dead-code reachability, and test mutation effectiveness remain unmeasured.

The generated equation reachability inventory requires its normal refresh when
the diagnostic source file is added; this is inventory maintenance, not semantic
or renderer change.

