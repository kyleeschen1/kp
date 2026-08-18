# Canonical Compositor Ownership Budgets

Date: 2026-08-18
Contract: `run-contract.kp.compositor-balanced-log-base-convergence-v1`
Slice: `s04`

## Result

The canonical compositor now has four independently enforced source accounts:

| Account | Current | Ceiling |
| --- | ---: | ---: |
| Four canonical owners | 139,103 bytes / 4 modules | 140,000 / 4 |
| Scene-plan boundary | 249,735 bytes / 14 modules | 315,000 / 20 |
| Renderer support | 63,867 bytes / 7 modules | 65,000 / 7 |
| Unique aggregate | 452,705 bytes / 25 modules | 455,000 / 31 |

The 315,000-byte planner ceiling is a migration envelope: planning code still
inside the 94,122-byte compositor must move into that account. It does not
permit total growth because the unique aggregate has only 2,295 bytes of
headroom. The unchanged 295,000-byte direct-dependency ceiling remains red at
309,245 until the final renderer depends on the narrow planner facade rather
than all of its implementation modules.

The three partitions are disjoint, every current direct compositor dependency
appears in the aggregate, and the new ephemeral plan contract is counted even
before it becomes the facade handoff. This prevents all three false wins:

- moving source from a core owner into a helper;
- calling planning code “separate” while omitting it from measurement; or
- reducing a direct import graph while increasing the delivered aggregate.

Reproduce the exact inventory with:

```sh
npm run --silent measure:canonical-compositor-ownership
```
