# Algebra API retirement evidence

Date: 2026-10-29
Scope: [approved bounded pilot](../2026-10-29-algebra-api-retirement.md).
Execution: `run-contract.kp.algebra-api-retirement-v1` owns live verification
and completion status; this review records findings and the budget amendment.

## Conversion and preservation

The v2 fixture-default compatibility facade was eight lines. Browser and edition
readers already used the current compiler/session owners. Nine remaining test
and type-fixture importers now select explicit source and use those owners;
two current-code imports no longer alias them to obsolete names. The facade
and its four exported aliases are retired. v1/v2 saved-source formats and the
distinct earlier exemplar remain supported.

Baseline checks established old/new equality before deletion. Surviving tests
exercise source round-tripping, revision/checkpoint identity, mathematical
verification, issued authority, preview failure retaining the last valid result,
supersession and disposal. Type fixtures still exercise actual publication,
reader and authoring consumers, including negative authority tests. Removing
the redundant wrapper comparison did not remove these behavioral guarantees.

The existing compatibility ledger now records the retired module and names.
Its guard checks module absence and forbidden references in production source,
build scripts and executable type fixtures. This closes the consumer gap found
in the audit; it is not a universal detector for semantically equivalent wrappers
or external consumers. The current compiler still rejects omitted source at the
type boundary. Proof issuance and preview validation retain runtime enforcement.

No renderer or CSS implementation changes are part of this pilot. Native
mounting, exact source, animation assets, endpoints and timing are preserved.
There is no claimed reader performance improvement from removing the facade.

## Complete authoring consumers

`npm run check:authoring` passed before and after conversion. Every measured
consumer has identical before/after costs; none emits example fixtures.

| Consumer | Emitted modules | Raw bytes | Gzip bytes | Types | Instantiations |
| --- | ---: | ---: | ---: | ---: | ---: |
| matrices | 6 | 6,369 | 2,315 | 62,088 | 82,471 |
| algebra-source | 3 | 3,734 | 1,549 | 59,238 | 77,226 |
| algebra-compile | 156 | 380,053 | 88,799 | 109,871 | 161,919 |
| algebra-editor | 159 | 381,210 | 89,231 | 109,960 | 161,947 |
| matrix-source | 3 | 3,779 | 1,670 | 59,132 | 76,880 |
| matrix-compile | 9 | 13,123 | 5,275 | 63,139 | 84,028 |
| matrix-editor | 11 | 13,982 | 5,606 | 63,238 | 84,056 |

## Explicit inference-budget amendment

The initial `npm test` stopped at core inference: 200,009 instantiations exceeded
the 199,900 ceiling by 109. The passing type count was 116,885. The combined
cohort passed at 180,418 types and 304,906 instantiations.

This retirement changes no file in the core compiler's actual 481-file program.
The migrated algebra consumer belongs to the combined cohort, whose membership
and ceilings are unchanged. A read-only compiler-host counterfactual held the
current compiler and all 49 core fixtures fixed while substituting historical
owner source from `e9c4ce103` (the last budget amendment):

| Source substitution | Types | Instantiations | Diagnostics |
| --- | ---: | ---: | ---: |
| Current source | 116,885 | 200,009 | 0 |
| Earlier rendering owners | 116,499 | 198,906 | 0 |
| Earlier animation owners only | 116,885 | 200,009 | 0 |
| All earlier changed owners | 116,499 | 198,906 | 0 |

The rendering substitution exactly reproduces the recorded October 21 baseline.
Its five changed owners are font readiness, native paint geometry, rendered scene,
material-layer DOM and scene compositor.
The source delta includes batched native measurement and color-only material
refresh. Attribution here is to that rendering cohort, not an isolated estimate
for each function. It adds 386 types and 1,103 instantiations (about 0.55%).

Under the standing engineering-budget repair authority, update the measured
baseline and only the exceeded instantiation ceiling: 199,900 → 201,100.
This restores the existing 0.5% headroom rounded to hundreds. Keep the passing
117,700 type ceiling, both combined ceilings, all 49+2 fixtures, library checks
and negative tests. `npm run check:inference` remains the executable cost gate;
`tests/typescript-inference-budget.test.ts` fixes membership and bounded headroom.

This is an explicit acceptance of existing measured compiler cost, not an
optimization. Alternatives were to leave integration blocked by a pre-existing
overrun or change rendering implementations during an API-retirement pilot.
There is no evidence here of an import leak or pathological inference requiring
that broader implementation change. Future growth must pass the amended gate.

## Integration accounting repairs

After inference passed, the full suite exposed four additional failures: three
pre-existing inventory/budget/expectation failures and a stale generated graph.
The three responsible production owners did not change in this pilot. The graph
also needs to account for this pilot's deleted module.

The caller ledger omitted four actual consumers of the internal learner runtime:
`fractional-passage-progress.ts`, `fractional-passage-sliders.ts`,
`fractional-rising-passages.ts` and `fractional-rising-scroll.ts`. Inspection shows
only the shared piecewise scroll sampler and/or its geometry type, within the
declared reader-runtime authority. Update the exact expected inventory to include
them; retain exact comparison, all existing callers and the public/internal
authority separation. No new production import is introduced by this correction.

Renderer support now measures 103,724 bytes across the same nine modules, exceeding
100,000. Comparing source at `e9c4ce103` accounts for the complete delta:

| Partition / owner | Prior bytes | Current bytes | Difference |
| --- | ---: | ---: | ---: |
| Core, 4 modules | 145,965 | 147,146 | +1,181 |
| Planner, 20 modules | 322,694 | 322,694 | 0 |
| Renderer support, 9 modules | 95,159 | 103,724 | +8,565 |
| Support: font readiness | 1,704 | 3,146 | +1,442 |
| Support: material-layer DOM | 17,695 | 20,753 | +3,058 |
| Support: native paint geometry | 10,583 | 14,648 | +4,065 |

The three support changes implement existing scoped font invalidation, native
color refresh and batched measurement. The aggregate remains 573,564 bytes below
its existing 575,000 ceiling. Keep all partitions and module memberships; amend
only support bytes to 106,000 (2% headroom rounded to thousands). This accepts
measured existing source cost, not a size reduction. Moving source to an uncounted
helper, minifying it or deleting preservation logic would hide cost; a renderer
rewrite is outside this pilot. The tight aggregate gate still requires diagnosis
before further growth. The policy validator fixes the new support ceiling and
`tests/canonical-equation-renderer-convergence.test.ts` measures actual closures.

The older promotion test still expected semantic depth for the fractional-linear
asset, conflicting with the [explicit user-directed flat-focus change](2026-10-27-fractional-reader-flat-focus.md)
and its asset test, committed in `1e7a22e83`. Reconcile only that asset's expected
profile to `flat-v1`; all other fields and other assets retain their expectations.
No motion implementation changes, and no visual reapproval is needed to preserve
the user's existing instruction.

Regenerate the derived reachability graph with `npm run generate:equation-reachability`.
Review its complete diff: it adds the four reader callers, records an existing
lesson-descriptor test at four roots and updates the scanned-file count from
5,106 to 5,133 (including this retirement). All 68 declared roots remain. This is
derived inventory maintenance, not retirement of semantic authority or consumers;
the exact graph equality test stays active.

## Architectural conclusion

One completed API replacement is now actually closed: explicit source has one
current v2 convenience path, maintained consumers have migrated, guidance names
the survivor and a guard rejects reintroduction. This establishes a small,
repeatable retirement example; it does not demonstrate broad decoupling.

The coordination cost exceeded the eight-line source removal: nine importers,
two aliases, current guidance, a retirement guard and derived inventory needed
attention. Broad verification also exposed existing accounting drift. This is
evidence that replacement must include consumer/discovery closure and that
existing records need to stay synchronized; it does not justify another parallel
lifecycle database. Follow-up work should reduce the changes a real host
replacement requires, rather than merely adding more classifications.

The next useful boundary to assess is shared reader mounting still owned under
`experiments` (`composed-algebra/card.ts` and `common-factor/native.ts`), together
with style inheritance between exemplars. Moving filenames alone would not
resolve that ownership. A follow-up should specify the shared host contract,
preserve two real consumers and remove the old ownership path when conversion
is complete. This is a recommendation, not an automatically authorized migration.

For review, read the canonical path table in the pilot and the current API in
`authoring/concise-domain-api.md`. Run `npm run check:authoring` to check current
authoring contracts and costs; the retirement regression is
`tests/semantic-animation-compatibility-ledger.test.ts`. No visible animation
change is expected, and this maintenance result does not require aesthetic review.

## Final verification

- `npm run check:authoring`: passed, 25 tests and all seven complete consumers;
  measurements above are unchanged before/after.
- `npm run test:composed-algebra-authoring`: passed, 105 tests after migration.
- `npm run typecheck`: passed for app, node, tests, Svelte and domains;
  Svelte reported zero errors and warnings.
- `npm test`: clean final rerun passed architecture, both inference cohorts,
  catalogs and all 7,436 tests, with no skips. Earlier failures and their repairs
  are recorded above and in Theseus; focused passes alone were not substituted
  for the full-suite gate.
- `npm run check:equation-reachability`: passed, 68 declared roots.
- `npm run build:bundle`: passed again after final accounting changes. Existing
  large-chunk warnings remain (Graph WebGL and the animation workbench); this
  pilot does not claim to solve their payload cost.

The rollback unit is the checked retirement plus its evidence and explicit
accounting repairs. Unrelated browser-test edits and inbox/workbench notes remain
outside this change. No renderer aesthetics or learned pedagogical effectiveness
were evaluated or promoted.
