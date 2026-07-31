# Canonical Scene Source Closure Report

Date: 2026-07-31

## Result

The canonical native KaTeX scene audit now measures four canonical owners and
discovers their direct local dependency closure from source imports. The four
owners remain over their accepted 136,000-byte ceiling at 141,543 bytes; this
slice deliberately strengthens measurement without claiming that later
responsibility reduction is complete.

A new or removed direct local dependency changes the discovered closure and
fails the exact inventory. Growth inside the existing dependency closure also
fails its frozen 248,260-byte aggregate ceiling. Consequently, deleting bytes
from the four owners and moving the same responsibility into an unlisted or
existing helper cannot satisfy the audit.

## Canonical Owners

| Responsibility owner | Bytes |
| --- | ---: |
| `src/rendering/native-katex-fragment-observer.ts` | 11,081 |
| `src/rendering/native-katex-glyph-compositor.ts` | 11,783 |
| `src/rendering/native-katex-rendered-scene.ts` | 22,512 |
| `src/rendering/native-katex-scene-compositor.ts` | 96,167 |
| **Total** | **141,543** |

## Direct Dependency Responsibilities

The dependency modules remain peer responsibilities rather than additional
canonical owners. Their exact paths are stored in the typed convergence policy
and rediscovered from imports by the source-closure test.

| Responsibility | Included direct dependencies | Bytes |
| --- | ---: | ---: |
| Semantic lineage and matching | 2 | 9,464 |
| Structural succession | 2 | 31,007 |
| Native paint, measurement, and DOM ownership | 5 | 31,204 |
| Motion planning and operation choreography | 5 | 131,749 |
| Scene contracts and successor synthesis | 2 | 44,836 |
| **Total** | **16** | **248,260** |

## Preservation Boundary

Later reductions must preserve the public renderer-session contract, the five
paint kinds, the six lifecycles, native KaTeX paint ownership, direct seek and
rewind, and accepted glyph behavior. Slices 13 and 14 may delete or consolidate
responsibility, but they may not extract it into the frozen dependency closure.
