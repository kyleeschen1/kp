# Typed Semantic State Scale And Inference Evidence

Date: 2026-09-03  
Run: `run-contract.kp.typed-semantic-state-facade-derived-graph-v3`  
Slice: s21  
Status: measured evidence

## Runtime Probe

The stable test `tests/semantic-state-scale-probe.test.ts` builds the scale
contract frozen before facade work began:

| Measure | Result |
| --- | ---: |
| Concrete leaves | 128 |
| Derived nodes | 64 |
| Dependency edges | 184 |
| Sequential changes | 16 |
| Journal operations | 16 |
| Aggregate snapshots | 17 |
| Shared entity stores per change | 127 of 128 |
| Shared bindings per change | 127 of 128 |
| Shared derived declarations per change | 64 of 64 |

Eight chains of eight derived nodes are primed once. Sixteen revisions then
change concrete versions across seven chains. Reading one terminal for each
changed chain and one terminal for the untouched chain produces exactly 120
compute calls, 120 cache misses, one cache hit, and 120 caller-owned entries.
The untouched chain performs no additional compute. Changed-chain results move
by `[3, 3, 2, 2, 2, 2, 2]`; the eighth result remains unchanged.

One local observation reported 112.55 ms elapsed and a 4,882,552 byte heap
increase. These are advisory machine-dependent observations, not acceptance
thresholds. The semantic pass conditions are the exact operation, sharing,
and cache counts above.

## Compiler Attribution

`npm run measure:inference-attribution` measured 43 fixtures. The complete
inference project is at 104,742 types and 176,892 instantiations, below the
frozen ceilings of 106,300 and 181,400. That leaves 1,558 types and 4,508
instantiations of headroom; no ceiling changed.

The dedicated direct-import scale fixture measured:

| Measure | Result |
| --- | ---: |
| Total fixture types | 32,616 |
| Types over library baseline | 4,669 |
| Fixture instantiations | 36,966 |
| Public barrel imports | 0 |

Compared with the pre-s21 project measurement, the dedicated scale fixture
adds 1,554 project types and 4,188 instantiations. The attribution is explained
by the new explicit fixture rather than an accidental public barrel or a
weakened type boundary.

## Decision

The probe does not indicate a storage redesign. Exact version identity drives
selective recomputation, unchanged stores and bindings retain structural
sharing, and the caller-owned cache stays outside snapshots and transactions.
This slice therefore adds no persistent collection, public facade, broader
barrel, or inference-budget increase.
