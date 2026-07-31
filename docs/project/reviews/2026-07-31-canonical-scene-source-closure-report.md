# Canonical Scene Source Closure Report

Date: 2026-07-31

## Result

The canonical native KaTeX scene audit measures four canonical owners and
discovers their direct local dependency closure from source imports. After two
responsibility reductions, the owners total 135,932 bytes and pass the unchanged
136,000-byte ceiling.

A new or removed direct local dependency changes the discovered closure and
fails the exact inventory. Growth inside the existing dependency closure also
fails its frozen 248,260-byte aggregate ceiling. Consequently, deleting bytes
from the four owners and moving the same responsibility into an unlisted or
existing helper cannot satisfy the audit. Source laws also require one
stage-relative rectangle-delta implementation and one internal handoff
telemetry constructor behind the three existing public microscope entrypoints.

## Canonical Owners

| Responsibility owner | Bytes |
| --- | ---: |
| `src/rendering/native-katex-fragment-observer.ts` | 11,138 |
| `src/rendering/native-katex-glyph-compositor.ts` | 11,564 |
| `src/rendering/native-katex-rendered-scene.ts` | 22,147 |
| `src/rendering/native-katex-scene-compositor.ts` | 91,083 |
| **Total** | **135,932** |

## Retired Duplication

| Reduction | Bytes removed | Result |
| --- | ---: | --- |
| Retire the diagnostics-only three-candidate typography comparison | 3,268 | Runtime selection remains the same exact-paint-or-checkpoint decision. |
| Unify handoff telemetry and rectangle-delta measurement | 2,343 | Glyph, rule, and correlated microscopes retain their public entrypoints; all core geometry uses one delta authority. |
| **Total** | **5,611** | The four-module core passes without moving responsibility into its dependency closure. |

## Direct Dependency Responsibilities

The dependency modules remain peer responsibilities rather than additional
canonical owners. Their exact paths are stored in the typed convergence policy
and rediscovered from imports by the source-closure test.

| Responsibility | Included direct dependencies | Bytes |
| --- | ---: | ---: |
| Semantic lineage and matching | 2 | 9,464 |
| Structural succession | 2 | 31,007 |
| Native paint, measurement, and DOM ownership | 5 | 31,187 |
| Motion planning and operation choreography | 5 | 131,749 |
| Scene contracts and successor synthesis | 2 | 44,836 |
| **Total** | **16** | **248,243** |

## Preservation Boundary

The public renderer-session contract, five paint kinds, six lifecycles, native
KaTeX paint ownership, direct seek and rewind, and accepted glyph behavior are
unchanged. Future growth must remain inside both source ceilings and may not
extract responsibility into the frozen dependency closure.
