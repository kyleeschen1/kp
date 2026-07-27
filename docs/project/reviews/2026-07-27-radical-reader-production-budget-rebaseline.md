# Radical Reader Production-Budget Rebaseline

Date: 2026-07-27
Status: slice-19 production evidence

## Decision

Rebaseline two stale measurement ratchets without changing product behavior,
the five-percent regression guard, module count, renderer vocabulary, route
runtime budgets, or forbidden-asset policy.

## Native scene source

The canonical native scene core remains exactly four production modules, five
paint kinds, and six lifecycles. Its measured source is 128,628 bytes after the
accepted generic paint-space handoff, structural succession, explicit session
disposal, bounded WebGL leasing, and context-loss recovery work.

The old 124,000-byte ceiling predated those accepted repairs. The new
130,000-byte ceiling leaves 1,372 bytes of headroom, or less than 1.1 percent.
It does not permit another module or lifecycle category.

## Reader HTML

Six equation routes had stale compiled-HTML gzip baselines while their raw HTML
and runtime-code measurements remained within the existing limits. Production
measurement established these exact baselines:

| Route | Previous | Measured baseline |
| --- | ---: | ---: |
| `/reader/solve-x/` | 4,503 | 4,885 |
| `/reader/solve-x/teacher-zero/` | 3,868 | 4,267 |
| `/reader/solve-fractional-linear/` | 5,029 | 5,416 |
| `/reader/divide-both-sides/` | 3,670 | 4,061 |
| `/reader/split-merge-fractions/` | 3,448 | 3,839 |
| `/reader/fractional-transfer/` | 4,078 | 4,457 |

These increases were already present before promotion-kit extraction and track
the accepted shared reader shell. The radical route, distribution route,
quadratic route, every raw-HTML baseline, every runtime-code baseline, and the
forbidden-asset gate remain unchanged. Future growth is still limited to five
percent from these measured values.
