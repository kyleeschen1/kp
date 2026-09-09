# R4A s02: frontend cost coverage and budget-ownership stop

Date: 2026-09-09
Outcome: STOP_CONDITION, 1/24 complete; s02 retains useful partial work.
Contract: `run-contract.kp.authoring-entrypoint-convergence-v1`.
No CLI convergence, new visual treatment, budget waiver or external call occurred.

## Measured finding

The new real-consumer fixture checks existing Bayes, numeric equation, code and
pinned Graph3D authoring owners. It exposed previously unmeasured dependencies,
not newly implemented frontend features. The exact gate fails; ordinary full
typechecking succeeds. These are different claims.

| Measurement | Types | Instantiations |
| --- | ---: | ---: |
| Existing pre-R4A fixtures | 112,278 | 192,161 |
| All real R4A consumers, initially | 296,358 | 813,152 |
| After the retained Graph3D identity/import repair | 127,387 | 214,823 |
| Unchanged ceiling | 112,500 | 195,800 |
| Remaining excess | 14,887 | 19,023 |

The build-time Graph3D frontend imported the complete live editor adapter solely
for `KP_EDITOR_GRAPH_3D_SADDLE_ADAPTER_ID`. That pulled in the live player and
WebGL dependency closure. The stable ID now lives in an import-free identity
module; the adapter retains its original export and uses the same value. The
frontend uses the lightweight owner. A regression protects that boundary, and
existing routed packet output remains byte-for-byte identical. No camera,
surface, timeline, semantic or render behavior changed.

Post-repair independent baseline-plus-entry attribution:

| Added entrypoint | Total types | Total instantiations | Checked local files |
| --- | ---: | ---: | ---: |
| None: existing fixture set | 112,278 | 192,161 | 391 |
| Numeric log draft | 123,791 | 210,185 | 443 |
| Code reasoning evidence | 114,098 | 195,006 | 403 |
| Graph3D saddle frontend | 115,791 | 196,680 | 410 |
| Complete new fixture set | 127,387 | 214,823 | 469 |

These closures overlap; never sum their deltas. Checked source-file counts are
not runtime import or browser bundle measurements. The numeric path includes
the existing series compiler, governed validators and source binder, which
assemble several registered families. Code and Graph3D add their own existing
evidence. A further harmless leaf-import reduction sufficient to meet the old
ceiling has not been established. This does not prove optimization impossible.
Separating eager compiler assembly from checked core responsibilities would be
a broader architectural tranche than the verified ID ownership correction.

## Evidence retained

- `npm run profile:authoring-entrypoint-inference`: executes all five measured
  programs and fails on the complete fixed gate. It refuses to run without the
  real R4A fixture, never edits configuration, and never substitutes a
  counterfactual program for the final gate.
- `npm run check:inference`: fails at the exact final counts above. Its existing
  first output line says “passed” before reporting exceeded ceilings; the final
  exit status is 1. No gate success is claimed.
- `npm run typecheck`: full app/node/test/Svelte/domain checks pass after the
  baseline assertion narrows numeric atoms by their existing discriminant.
- Fourteen focused author-task, compiler-boundary, Graph3D generation and paint
  tests pass. `npm run test:cross-domain-gallery` passes all 34 cases, including
  the exact checked-in conformance packet.
- `npm run check:architecture` passes, including eight cross-domain tests.
- `git diff --check` passes. No full release claim or new browser certification.

The negative type fixture remains in `tsconfig.inference.json` through its
existing wildcard. No real caller, diagnostic, assertion, fixture or ceiling was
removed. The scoped work therefore deliberately retains a failing cost gate
until an approved resolution, rather than hiding the coverage finding.

## Recommended explicit amendment

The current budget source, `src/architecture/typescript-inference-budget.ts`,
records an aggregate-core checkpoint of 45 fixtures with formula-based headroom.
The current global wildcard has subsequently accumulated additional end-to-end
compiler consumers under the same absolute ceiling. This makes new coverage
compete with the original core budget even when the implementation already exists.

Recommend amending s02 to introduce two mandatory, explicit cost cohorts:

1. Preserve the entire pre-R4A fixture set and its current 112,500 / 195,800
   ceilings, including R3. No existing consumer moves out of that cohort.
2. Measure the combined pre-R4A plus new frontend-consumer set separately, with
   a reviewed frontend baseline and bounded headroom. Retain the negative tests
   and full program checking; this is a new budget for expanded coverage, not
   a claim that the original combined gate now passes.
3. Require both gates in the normal verification path. Add membership laws that
   reject missing, unassigned or unexpectedly reassigned fixtures, and always
   report core and combined counts. No automatic future baseline refresh.
4. After this explicit policy amendment passes its tests, resume the remaining
   R4A order. Do not change semantics, renderer behavior or the other budgets.

An alternative is a separately bounded shared compiler modularization tranche
targeting at least 14,887 types and 19,023 instantiations of savings under the
current single ceiling. Its achievable reduction is unproven. Another sequence
of speculative annotation edits is not recommended as the default product path.

This recommendation is **not approved or implemented**. R4A explicitly forbids
budget increases/fixture omissions without new authority, so approval of the
original run cannot authorize this reclassification. Theseus retains the stop;
do not advance to s03 or mark s02 complete. Resume after the user selects the
budget-ownership amendment or a bounded compiler-work alternative.
# Resolution

The user subsequently approved the explicit two-cohort amendment. See
`../decisions/2026-09-09-inference-cost-cohorts.md`. The stop and unapproved
recommendation below are historical evidence, not current blocking authority.
No original core ceiling or fixture is removed.
