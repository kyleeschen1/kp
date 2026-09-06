# Structural authoring: second caller and compiler-cost stop

Status: STOP_CONDITION at the two-caller API/cost gate; G2 is not reached
Contract: `run-contract.kp.structural-authoring-canonical-tax-v2`

## What is now integrated

The user accepted the coherent fraction Focus Card after `c6aeedb8e`, then
requested continuation. G1 acceptance is recorded in the distribution review.
The accepted fraction treatment is preserved, not promoted globally.

The second caller, `operation-evaluation.two-times-one-carrier` (`2 × 1 → 2`),
now flows through a verified local receipt, immutable aggregate versions,
explicit selector pins, discrete settlement, historical queries, prepared data,
and its existing canonical native-KaTeX carrier renderer. The renderer compiles
the supplied authored asset into its existing recipe/governance rather than
ignoring it and loading an unrelated asset. Native endpoint HTML remains the
existing exact canonical binding after source validation.

Review on the same server:
`http://127.0.0.1:8000/experiments/authoring-simplification-focus-card/`.
Both the page and its read-only prepared-data endpoint returned HTTP 200.
The original fraction card and default catalogue/reader routes remain intact.

Implementation commits:

- `13f156d1f`: G1 acceptance and nominal simplification authority receipt.
- `f98f48652`: retained simplification state, selection, family and recovery.
- `0b51633b1`: prepared source and Focus Card using the existing carrier surface.
- `b747e561c`: cross-caller history and integrated lifecycle pressure.

## What is actually shared

Both callers reuse the existing model assembly, atomic transaction, discrete
family, logical-address, pinned-recovery and bounded query owners. Both send
data, not author callbacks or receipt capabilities, to their browser hosts.
Both reuse the Focus Card scaffold and shared reader playback clock.

Their mathematical and presentation authorities remain distinct. Distribution
retains the verified fraction equation tree and explicit fan-out bundles;
simplification retains semantic asset objects, one explicit identity relation
and two removals. The simplification adapter uses the existing carrier verifier,
recipe, native binding, optical profile and settlement session. No new renderer,
AST, CAS, clock implementation or global rule was created. The visual-salience
workflow kept semantic identity separate from withdrawal and native paint
ownership; it did not authorize new salience or choreography.

Some selection/receipt guards and card navigation glue remain duplicated.
These two callers justify the existing state APIs, but not a universal receipt
or expression model. The fixed-specimen constructors are internal integration
entrances, not an arbitrary-equation authoring API or a live-model benchmark.

## Charged implementation inventory

Physical line counts, including comments/blanks, measured with `wc -l`:

| Boundary | Distribution | Simplification |
| --- | ---: | ---: |
| Experiment model/selection/receipt/family/explanation/projection/preparation | 398 | 215 |
| Focus Card entry | 168 | 113 |
| Browser prepared-data restoration | 48 | 22 |

The distribution inventory includes `structural-selection.ts`, whose error
contract is also reused by simplification. Separately charge the existing
carrier adapter change (25 added / 8 removed lines) and dev-route change
(13 added / 1 removed), plus tests and generated reachability evidence. These
counts do not include the substantial pre-existing shared state/rendering
infrastructure. They are not an apples-to-apples proof of authoring savings:
the operations and host requirements differ, and a no-argument fixed fixture
hides substantial implementation code.

## Required gate failure

`tests/type-fixtures/authoring-structural-callers.ts` now consumes both actual
internal entrances, checks typed query results and logical names, and rejects
wrong operation parameters, nonexistent fields and mutation of retained values.
It remains in the existing inference gate, including its failure evidence.

| Inference measurement | Before consumer fixture | With both callers | Unchanged ceiling |
| --- | ---: | ---: | ---: |
| Types | 111,313 | 118,158 | 112,500 |
| Instantiations | 192,390 | 205,487 | 195,800 |

The fixture adds 6,845 types and 13,097 instantiations to the checked closure.
Both compilations satisfy type correctness; `npm run check:inference` exits 1
because the latter exceeds the cost ceilings by 5,658 types and 9,687
instantiations. This is not evidence of a browser performance regression.
Attribution between newly reached dependencies and generic instantiation work
is not yet established, so a specific optimization is not claimed.

The approved s17/X boundary forbids raising these budgets or promoting a new
public hierarchy to escape the gate. The run stops with s17 incomplete. The
fixture was not removed, moved outside the gate, cast to `any`, or excluded to
manufacture success. Consequently `npm test` is expected to stop at its inference
prerequisite until this is repaired; no full-suite/release success is claimed.

## Verification and remaining boundary

- 31 structural unit tests pass, including interleaved queries, two-entry
  caches, two retained snapshots per caller, foreign recovery rejection,
  stale selection and malformed/copy-forged authority.
- Full typecheck passes, including the new negative-type consumer fixture.
- Five integrated structural browser checks pass; the subsequently extended
  three-test simplification subset also passes phone, URL reload, interrupted
  playback, resize, reduced motion, disposal and invalid-source rejection.
- Five existing carrier browser checks pass, including add-zero preservation.
- All 18 fraction/card/cache checks pass in Chromium and Firefox after the
  simplification integration.
- Architecture and exact reachability checks pass. The simplification browser
  closure requests no semantic-state implementation modules.

Runtime ownership checks observe one visible paint surface, one accessible
native endpoint, an opaque unscaled material carrier, and exact reverse material
signatures. This is bounded integrated evidence, not full cross-browser
simplification certification. Its G2 release cohort, full tests/build and human
review remain unexecuted. The new simplification card has not been visually
approved by the user. No canonical supply-tax migration has begun.

Recommended next step: authorize a bounded compiler-cost attribution and repair
at these two internal entrances, preserving the current ceilings and all source,
identity, query and visual laws. Do not broaden into API publication or remove
the realistic consumer pressure. After that repair, resume the existing s17–s18
review sequence; G2 still precedes canonical migration.

Resume context with `theseus work resume next-action.kp.structural-authoring-canonical-tax`.
If its known brief-budget error recurs, use `theseus work start
next-action.kp.structural-authoring-canonical-tax --mode brief` and this report.
