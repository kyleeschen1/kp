# TypeScript Inference Attribution

Date: 2026-08-16  
Status: measured attribution in slice `s05`; evidence-backed closeout in `s29`
Stable command: `npm run measure:inference-attribution`

## Slice 29 Closeout

The four owner-local fixtures now import their direct owners. The intentional
animation public-surface fixture still imports `animation/public-api.ts`.
Strictness and every inference assertion remain unchanged.

| Measure | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| Reachable files | 230 | 200 | 30 (13.0%) |
| Reachable TypeScript lines | 31,039 | 26,303 | 4,736 (15.3%) |
| Types | 57,283 | 52,864 | 4,419 (7.7%) |
| Instantiations | 79,220 | 71,006 | 8,214 (10.4%) |

The enforced ceilings are now 55,000 types and 75,000 instantiations. Those
are measured compiler-work limits with roughly 4.0% and 5.6% headroom,
respectively—not counts of source declarations. `skipLibCheck` remains off.
The two largest direct closures remain operation-evaluation presentation and
factoring motif binding; their generic contracts were not weakened merely to
chase diagnostic counts.

## Answer

KP does not contain 57,283 handwritten or conceptually unique types. The
number is TypeScript's compiler-internal type-object workset for the complete
inference fixture project. A two-line empty fixture using the same standard
libraries already creates 27,947 types and 27,046 generic instantiations. The
21 KP fixtures add a combined reachable closure that brings the project to
57,283 types and 79,220 instantiations.

The useful interpretation is:

```text
standard-library and compiler baseline
+ reachable imported declarations
+ inferred anonymous and literal structures
+ unions, intersections, mapped and conditional results
+ repeated generic specializations
= compiler workset
```

The per-fixture numbers are not additive because fixtures share large import
closures. They are attribution signals for where isolation or generic
simplification can improve the aggregate project.

## Aggregate Measurement

| Measure | Empty-library baseline | All 21 fixtures | KP/reachable delta |
| --- | ---: | ---: | ---: |
| Files | 60 | 230 | 170 |
| TypeScript lines | 2 | 31,039 | 31,037 |
| Types | 27,947 | 57,283 | 29,336 |
| Instantiations | 27,046 | 79,220 | 52,174 |
| Symbols | 52,940 | 141,854 | 88,914 |
| Memory | 123,760 KiB | 193,688 KiB | 69,928 KiB |
| Compiler check time | 0.96 s | 2.61 s | not additive |

Almost half of the reported type objects exist before KP imports anything.
The 50,000 ceiling therefore measures total compiler work, not source-level
type count.

## Largest Single-Fixture Closures

Each incremental column subtracts the empty-library baseline.

| Fixture | Import shape | Incremental types | Incremental instantiations |
| --- | --- | ---: | ---: |
| `operation-evaluation-presentation-registry.ts` | four direct animation modules | 9,149 | 14,030 |
| `factoring-motif-binding.ts` | one direct animation module | 8,710 | 16,607 |
| `concept-room-theme-inference.ts` | `app-adapters/public-api.ts` | 6,933 | 12,045 |
| `animation-authoring-public-api.ts` | intentional public barrel contract | 5,472 | 7,288 |
| `concept-room-inference.ts` | `authoring/public-api.ts` | 4,086 | 10,067 |
| `concept-manifest-inference.ts` | `authoring/public-api.ts` | 3,940 | 9,725 |
| `fraction-composition-certificates.ts` | five direct semantic modules | 2,857 | 5,650 |
| `fraction-composition-promotion-certificate.ts` | three direct architecture/authoring modules | 1,843 | 1,817 |

This disproves a barrel-only diagnosis. Broad barrels cause avoidable closure,
but the two largest isolated fixtures are operation/factoring generic contracts
imported directly. Both import isolation and type-design pressure matter.

## Direct Import Comparisons

The measurement command compiles four fixtures unchanged, then compiles an
equivalent scratch copy with only its import redirected to the actual owner.

| Fixture | Barrel to direct owner | Avoided files | Avoided source lines | Avoided types | Avoided instantiations |
| --- | --- | ---: | ---: | ---: | ---: |
| Concept-room theme | app-adapters barrel to `concept-room-theme.ts` | 41 | 6,580 | 6,466 | 11,623 |
| Concept-room handles | authoring barrel to `handles.ts` | 22 | 2,981 | 3,568 | 8,986 |
| Concept manifest | authoring barrel to `concept-manifest.ts` | 9 | 1,192 | 1,807 | 4,833 |
| Concept-room state | kernel barrel to `concept-room-state.ts` | 2 | 117 | 278 | 227 |

These comparisons do not mean public barrels should disappear. A fixture that
asserts the supported public surface must import the public barrel. A fixture
that asserts one owner's inference law should import that owner directly. The
existing `animation-authoring-public-api.ts` fixture deliberately checks both
allowed and forbidden public exports and therefore remains a legitimate barrel
consumer.

## Implications For This Run

1. **Keep separate purposes.** Public-surface fixtures and internal inference
   laws should not share one undifferentiated budget or import convention.
2. **Use direct imports for owner-local laws.** The theme, handles, manifest,
   and state fixtures can preserve the same assertions with materially smaller
   closures; this is an evidence-backed candidate for slice `s29`.
3. **Do not stop at barrels.** Operation-evaluation presentation and factoring
   binding are the largest direct closures. Their mapped/conditional/generic
   shapes need targeted trace inspection before simplification.
4. **Do not add the future equation intent facade to a broad barrel.** Give it
   one direct, tool-neutral module so model/editor tooling does not inherit the
   application or complete animation-public closure.
5. **Budget structural groups.** Slice `s29` should retain an aggregate guard
   while reporting at least public-contract and owner-local groups separately.
   Rebase only after safe closure reductions land, with recorded headroom.

## Measurement Boundary

The command writes its full disposable report and scratch configs under
`tmp/codex/`. It invokes the repository TypeScript compiler with the exact
inference compiler options for the aggregate project, an empty fixture, each
individual fixture, and four direct-import comparisons. Structural counts are
repeatable; check time and memory vary with host contention and remain
informational.

No production import, type, fixture, or budget changed in this slice.
