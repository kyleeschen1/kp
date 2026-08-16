# Adjacent retirement B: explicit deferral

After retiring the saddle tween prototype, the exact reachability graph has
only two roots with no internal source caller. Neither is safe to delete.

| Candidate | Observed caller | Unique contract | Revisit trigger |
| --- | --- | --- | --- |
| `src/animation/visual-frame-laws.ts` | `tests/kp-animation-visual-frame-laws.test.ts` | Proves that persistent selectors bind the same visual references in forward and rewind frames. The semantic seek/rewind law checks phase identity, not renderer bindings. | A canonical visual-frame law consumes rich `CorrespondenceMap` records and reproduces the changed-binding failure before the compatibility-pair consumer is removed. |
| `src/animation/motifs/public-api.ts` | `tests/canonical-animation-api-map.test.ts` | Deliberate renderer-neutral public equation-motif vocabulary. An internal caller count is not a public reachability measure. | A versioned public API replacement exists, downstream consumers are migrated, and the canonical API map approves removal. |

The nine generic equation presentation paths also remain live according to
the fallback audit: five serve 23 compatibility surfaces and four serve seven
specialized canonical surfaces. The six-entry renderer-neutral equation SDK
manifest likewise remains a distinct public compatibility surface.

No second deletion is authorized. Manufacturing one would either weaken the
visual rewind invariant or mistake an intentionally external boundary for dead
code. This deferral is the required complexity-negative result for slice 20;
the next work moves to typed capability declarations, where the approved plan
already has exact migration and retirement criteria.
