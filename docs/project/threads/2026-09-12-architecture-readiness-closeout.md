# Architecture readiness: improvements, costs, and next boundary

Date: 2026-09-12
Release status: COMPLETE; all 25 approved slices verified. Theseus owns execution evidence.
Scope: the approved [25-slice proposal](2026-09-12-architecture-readiness-long-loop-proposal.md), recommendations 1–5 from the [architecture/cost/ontology audit](../reviews/2026-09-12-architecture-cost-ontology-audit.md).
Execution: `run-contract.kp.architecture-cost-semantic-readiness-v2`.
Branch: `feature/20260912-mechanics-architecture-readiness`; no merge or push.

## Executive assessment

This was a worthwhile readiness repair, not a wholesale simplification of KP.
It corrected concrete publication, loading, semantic ownership, and interaction
boundaries before more content multiplied their consequences. Existing native
animation pipelines, accepted choreography, and domain models remain in place.
No mechanics lessons were implemented and no universal renderer was introduced.

The strongest results are: complete local dependencies for three immutable
publication families; approximately 19% lower initial transfer on the canonical
tax host; materially smoother representative gradient transitions; immutable
semantic issuance in real callers; stronger correspondence/composition checks;
and removal of independently implemented tax/code gesture transport.

The principal unfinished cost is genuine 3D camera motion on a throttled CPU.
The repository also still has a large test and command surface. This loop did
not establish that most of it is redundant, nor substantially shrink it.

## 1. Publication can receive shared repairs without rewriting history

Bayesian, common-factor, and composed-algebra publication builders now share a
deterministic stylesheet/asset closure collector instead of three manual lists.
It follows supported local CSS imports and asset URLs, preserves order, deduplicates
dependencies, and fails on missing files, unsupported targets, unsafe paths,
symlink escapes, cycles, and collisions. The dependency is build-time, not a new
reader runtime dependency. Isolated browser checks load actual editions without
JavaScript or source-server fallback.

This closes a practical hole in retroactive repairs: a shared font or nested
stylesheet change can now propagate into a newly generated edition without an
author remembering every transitive dependency. Existing immutable editions keep
their bytes. Updating every already-published artifact is still an explicit
regeneration/republication action, not a mutation of history.

Revision ownership is now explicit at the affected builder APIs: raw source
identity, explanation identity, and byte-edition identity are distinct. A branded
byte-edition ID prevents substituting an arbitrary source hash in typed callers.
Style-only repairs can preserve explanation identity while changing byte identity;
editorial changes can change both. Compatibility aliases and existing hashes and
directory formats are preserved. Gradient reading return restores semantic
position; it does not promise identical historical pixels after a renderer repair.

Evidence: [repair workflow](2026-09-12-static-edition-repair-workflow.md),
[revision ownership](2026-09-12-revision-ownership.md).

## 2. Reader startup is lighter, with activation costs visible

The canonical tax host still publishes meaningful static content for all four
cards. Unrelated equation, code, and 3D capabilities now load at their declared
activation conditions rather than all mounting eagerly. A typed lifecycle handles
single-flight loading, retries, disposal during loading, direct entry, and replay
of the first interaction. The existing card controllers remain the playback owners.

Two shared CSS entrypoints partition document essentials and focus-card runtime
styles from broad application CSS. The change moved 641 selector/declaration/context
records without redesigning the typography or motion. It reduces delivered CSS,
not the number of styling rules the project ultimately maintains.

Final actual-request accounting against the s01 baseline, modeled gzip bytes:

| Scenario | Baseline | Final | Change |
| --- | ---: | ---: | ---: |
| Static quadratic reader | 134,760 | 135,030 | +270 / +0.20% |
| Tax host, initial | 718,743 | 580,271 | −138,472 / −19.27% |
| Gradient host, initial | 382,264 | 374,544 | −7,720 / −2.02% |
| Tax host, all measured capabilities activated | 718,743 eager baseline | 720,732 | +1,989 / +0.28% |

Tax initial JavaScript fell from 642,444 to 512,305 gzip bytes; CSS from 30,307 to
22,520. Gradient CSS fell from 26,265 to 17,987, while JavaScript increased slightly
from 287,593 to 288,150. Activation adds 140,461 bytes to the tax host, including
Three.js. These are meaningful startup savings, not disappearance of the full
experience's cost. The static reader did not improve.

At 1 Mbps, the tax payload change represents an arithmetic transfer floor of
about 5.75 to 4.64 seconds. This excludes latency, contention, parsing, decoding,
and rendering; it is not an observed page-load result. Gradient JavaScript still
contains roughly 1.05 MB of raw code. This remains material on low-powered devices.

New acceptance checks cover actual initial and activated requests, missing assets,
unexpected page errors, and complete nested build-manifest import closure. Final
timing probes ran alongside verification work, so their timings are not used to
claim speedups. Byte accounting is unaffected by that distinction.

Evidence: [activation](2026-09-12-tax-deferred-activation-evidence.md),
[CSS partition](2026-09-12-focused-reader-css-evidence.md),
[loading acceptance](2026-09-12-loading-acceptance.md),
[final measurement data](2026-09-12-readiness-release-measurements.json).

## 3. Gradient motion avoids redundant work; camera cost remains

Profiling identified repeated native 3D painting and geometry/fit work even when
the relevant scene inputs had not changed. Repairs stay at the existing native
surface-contour stage and projection owners. They do not introduce a second clock,
renderer, global cache, or alternate animation motif.

The native guard records only successful paints. The projection guard snapshots
comparison inputs so a caller mutating an aliased object cannot hide a real change.
Exhaustive typed input coverage makes newly added projection fields require an
explicit decision. Camera, source, theme, resize, font readiness, interruption,
reverse seeking, and disposal retain their invalidation responsibilities.

In the isolated s15 profiler-disabled 6× CPU cohort, representative first and
comparison transitions had median frame intervals around 16.7 ms and p95 around
17.5–17.6 ms. Earlier initial cohorts had p95 around 51–67 ms. Script time in those
two-second transition windows was 273–392 ms for the first transition and
269–328 ms for comparison. Separately, matched profiler-enabled cohorts showed
roughly 43% and 55% median script-time reductions; those absolute timings must not
be mixed with profiler-disabled measurements.

**A genuine later camera transition is still expensive:** approximately 1,177 ms
of script work, median frame intervals of 33.7–49 ms, and p95 of 67.1–84.2 ms under
6× throttling. There is no matched old camera baseline supporting a camera speedup
claim. The renderer still rebuilds work during real camera change. A bounded
retained-geometry/material repair is a sensible future investigation if the next
exemplar needs that motion. This is not uniform 60 fps or physical-phone certification.

Evidence: [CPU attribution](2026-09-12-gradient-cpu-attribution.md),
[runtime acceptance](2026-09-12-gradient-runtime-acceptance.md).

## 4. The object/transformation ontology has stronger actual enforcement

Previously, supported semantic payloads could retain external mutable aliases:
the meaning associated with an identity could change after construction. The new
immutable issuance boundary clones supported plain data, validates it, freezes the
owned result, and returns a branded deeply readonly value. It does not freeze the
caller's input or silently accept renderer handles and arbitrary class instances.
Unsupported data, cycles, and resource-limit violations return typed repair gaps.

Adoption is intentionally bounded to real supported callers: tax assets and
governed source, code operations, Bayesian evidence, and fraction equivalence.
The legacy constructor remains an explicitly compatible path, not a claim that
every semantic object in the repository has been migrated. Runtime issuance is
not transferable merely by serializing JSON; checked loaders still own that trust
boundary. Types prevent ordinary misuse; runtime checks handle external data and
temporal mutation.

Transformation and correspondence composition now validate endpoints and reject
duplicate or empty endpoint identities, malformed inputs, and unsupported results.
Composition checks inputs, intermediate results, and outputs. Material born and
retired entirely inside a composition does not become a fictitious boundary
correspondence. Intentionally partial maps and explicitly lossy interpreters remain
valid; the repair does not pretend every useful representation is bijective.

This is stronger fidelity to objects, transformations, identity, provenance, and
composition. It is **not** a general theorem prover, a proof that every `lawRef`
is mathematically true, or certification of an unrestricted category-theoretic
model. Domain verifiers still establish domain-specific claims. That separation
is healthy: share structural guarantees without flattening mathematics, code,
economics, and native visual representations into one universal implementation.

The gradient-to-mechanics handoff separately documents symbolic differentiation,
numeric evaluation, local linearization, stationary points, and Euclidean/unit
assumptions. Reusing a gradient for force requires conservativity and units;
force is not velocity or an automatically followed descent trajectory.

Evidence: [immutable issuance](2026-09-12-immutable-semantic-issuance.md),
[transformation laws](2026-09-12-transformation-law-enforcement.md),
[mechanics reuse boundary](2026-09-12-gradient-mechanics-reuse-handoff.md).

## 5. Fewer independent input owners; more selective verification

Tax and canonical code cards now use the shared native-input transport and a
factored travel-playback owner. Their domain clocks, native renderers, and accepted
release profiles remain explicit. Tax's drag/wheel thresholds are not silently
replaced by another card's thresholds. Shared transport does not mean every
pedagogical sequence must have identical timing or snapping policy.

The migration retired approximately 335 net lines from the tax entry and the
code card's independent wheel/scroll/RAF/release-timer machinery. Revocable session
tokens prevent obsolete gestures from updating or finishing new playback. Tests
exercise held gradual swipes, reversal, animated controls, fractions/prose,
late scroll events, and interruption. Lazy activation also exposed and repaired
a real first-click bug: clicking an SVG icon inside a button now replays the
normalized control action after loading.

Verification impact routing now selects existing focused input cohorts instead
of requiring the entire suite for each discovery iteration. Unknown paths retain
the broad fallback; shared base CSS deliberately retains broad coverage. Example
measured focused costs: 31 input tests in 3.22 seconds wall time; 26 CSS/gradient
tests in 3.58 seconds; 13 Chromium input cases in 46.3 seconds; 15 three-engine
cases in approximately 1.1 minutes. These are local observations, not CI promises.

Tax and gradient production checks share an isolated built-route fixture on the
existing server. It rejects source-development fallback and unexpected origins.
The tax production suite no longer needs a second server on port 4173. Two exact
duplicate npm command bodies now delegate with tested argument forwarding; all
command names remain available. Behavioral tests were not deleted to meet a quota.
The full main unit cohort takes about 12.5 minutes locally (7,064 tests in the
release attempt), before considering all build and browser gates. Selective
iteration is cheaper; this loop does not demonstrate a faster full release suite.

The source inventory is a useful counterweight to simplification claims:

| Inventory | Baseline | Final |
| --- | ---: | ---: |
| Source TypeScript files / lines | 2,219 / 473,021 | 2,224 / 473,084 |
| CSS files / lines | 75 / 21,360 | 77 / 21,550 |
| Test TypeScript files / lines | 2,117 / 319,059 | 2,122 / 319,647 |
| Main unit test files | 1,775 | 1,779 |
| npm command names | 622 | 624 |

Counts include generated material and comments; browser filename conventions are
not a complete browser-test census. We reduced conflicting ownership and reader
delivery cost, not overall repository size. The new tests and tooling have a
maintenance cost. Future consolidation should prove equivalent failure detection,
not infer redundancy from a large number alone.

Evidence: [tax input](2026-09-12-tax-input-convergence.md),
[code input](2026-09-12-code-input-convergence.md),
[verification economics](2026-09-12-verification-economics.md),
[consolidation](2026-09-12-verification-consolidation.md).

## Budget changes are costs, not performance wins

Two earlier artifact budget owners were stale or omitted real consumers. Their
baselines were reconciled to actual supported production artifacts, preserving
negative over-budget, missing-file, and authoring-leakage tests. Nested activation
imports are now counted. The final algebra/fraction active closure is 323,150 gzip
bytes and passes its unchanged 326,147-byte active ceiling. Canonical construction
CPU/projection limits were not relaxed.

The first final release attempt also caught a genuine TypeScript inference-budget
overrun after deep-readonly adoption. A read-only compiler-host counterfactual
using the same 51 fixtures isolated the five adoption callers: 175,948 types and
292,801 instantiations with their baseline text versus 178,493 and 300,444 now.
This attributes 2,545 types and 7,643 instantiations to the stronger boundary.
Only the combined type ceiling changed, from 176,800 to 182,100 with bounded 2%
headroom. The 301,600 instantiation ceiling, core ceilings, all fixtures, and
negative checks remain. No readonly guarantees were removed to get a green build.

Evidence: [artifact budget reconciliation](2026-09-12-budget-owner-reconciliation.md),
[inference amendment](2026-09-12-readiness-inference-amendment.md).

## Release evidence and limits

Final release receipts are recorded in Theseus s25. Completed builds and gates:
main bundle, gradient production bundle, reader budgets, algebra/fraction budgets,
canonical construction budgets, production reader manifest, and dev-review leakage.
The final actual-request audit passed all loading/activation ceilings with no page
errors. Earlier slice boundaries passed static-edition browser checks, production
tax/gradient checks, full type checks, and representative Chromium/Firefox/WebKit
interaction preservation. The final fresh `npm run test` exited zero: architecture,
inference, catalogue and promotion-memory gates passed, followed by 7,064 main unit
tests, zero failures, zero skips/cancellations, in 727,693.9 ms (12.1 minutes for
the main Node phase). No test was waived. Theseus workspace validation also passed.

The final fresh typecheck passed, including Svelte with zero errors/warnings and
domain checks. Six built-tax cases passed, including reduced motion, gradual code
input, sibling keyboard controls, and JavaScript-disabled reading. Nine gradient
cases passed across Chromium, Firefox, and WebKit (controls, phone/reduced motion,
and shared wheel reversal). The full main unit attempt reported 7,063 passes and
one stale generated inventory count, 4,661 versus 4,669 scanned files. Regeneration
changed only that count, not its 68 roots; the six reachability/fallback tests and
the freshness command then passed. The fresh full run above confirms the correction.

Observed failures were not erased: the inference overrun required the documented
amendment; a gradient shader-readiness timeout was checked by unchanged isolated
repeats and the unchanged full cohort; a tax midpoint wall-clock assertion was
replaced by a controlled browser clock; and the lazy SVG-icon first-click failure
received an executable regression. Automation does not certify physical Safari
edge gestures or low-end hardware. No new visual language required human approval.

## Recommended next move

Stop the infrastructure expansion at this boundary and deliver one small mechanics
learning unit using the approved [mechanics-from-zero map](2026-09-11-mechanics-from-zero-curriculum.md).
Begin with M00–M01: why choose a model, and how do we describe where something is?
Use a tabletop object, reference origin, axis, length unit, and timestamps. Compare
two origins: coordinates change, displacement does not. Keep the reusable signed
change/reference-frame mathematics independent from its mechanics motivation.

Prefer a sketch or table where sufficient; animate only the explanatory change.
Use the question-led, motivation-first authoring and canonical card pipeline,
then review the explanation with the learner before broadening the curriculum.
Do not jump straight to potential gradients before force and energy foundations.
Pressure retroactive repairs with the real new caller rather than building another
unexercised abstraction layer first. Best-practice encoding remains a bounded
accepted follow-up, not permission for another indefinite prerequisite loop.

The remaining 3D camera cost deserves its own measured repair when needed for a
chosen exemplar or low-power release target. It does not justify blocking a simple
first mechanics unit. The next product test is whether these stronger foundations
make a useful explanation easier to author, reuse, repair, and understand.
