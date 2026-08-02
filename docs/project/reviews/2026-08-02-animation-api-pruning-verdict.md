# Animation API pruning verdict

Date: 2026-08-02  
Status: complete; no candidate qualified for deletion

## Outcome

The source-derived post-migration audit found no safe adjacent deletion. The
stale `candidate-after-two-caller-migration` disposition is removed, but every
reviewed path remains because it has either a live caller or unique durable
authority. Zero imports alone were not treated as deletion permission.

## Candidate verdicts

| Candidate | Exact evidence | Verdict |
| --- | --- | --- |
| Generated display JSON | One production consumer, `animation-library-display-catalog.ts`; owns representation roles, availability, canonical-format, and review/promotion projection absent from search metadata | Retain internal |
| Generated search JSON | One production consumer, `animation-library-metadata.ts`; owns controls, duration, beat count, and searchable promotion metadata absent from display JSON | Retain internal/deferred |
| Semantic compatibility ledger | One architecture script and one conformance test; records live owners and closure evidence | Retain internal evidence |
| Equation motif facade | Zero imports, but it is the named canonical replacement for four retired rendering facades and anchors compiler/API authority records | Retain separate canonical vocabulary |
| Internal balanced-solve seam | Public facade is its sole production caller, but the module owns the implementation and is not a compatibility wrapper | Retain internal implementation |
| Jacobian/Hessian presentation | Live editor/catalogue callers and unique semantic/conformance evidence; its product disposition remains human-owned | Defer unchanged |

## Why no deletion is the correct slice result

The approved deletion rule required both a proven last caller and an exact
replacement. The two migrated callers prove the new public facade boundary,
but they do not replace catalogue metadata, motif vocabulary, compatibility
evidence, or the balanced-solve implementation. Deleting any reviewed path
would cross the slice stop condition by removing a live caller or unique
evidence.

The executable ledger now contains no provisional post-migration candidate.
This prevents a future agent from mistaking the completed facade migration for
authorization to delete an unrelated one-caller asset.

## Rollback

The reversible unit is the disposition update, its executable ratchet, and this
verdict. No production file, semantic fixture, conformance evidence, generated
metadata, or user-owned work was removed.
