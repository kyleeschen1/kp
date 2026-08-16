# Fixture and test authority audit

This audit classifies test forms by the invariant they protect. Syntax is not
enough reason to keep or delete a test: a hard-coded number can encode a real
semantic law, while a broad integration test can merely repeat a cheaper exact
set check.

| Test class | Current owner | Decision | Replacement or retention law |
| --- | --- | --- | --- |
| Generated architecture projections | The corresponding `createKp*` or `compileKp*` function | Retain | Generated JSON must equal a deterministic projection and its generator must fail freshness checks. |
| Live catalogue or equation totals | Canonical membership exact set | Replace raw totals | Compare sorted identities or sets. Counts are derived from that set. |
| Historical snapshot totals | A dated source reference and explicit baseline field | Retain when provenance is named | A historical number is evidence, not current membership; tests must also prove current exact-set closure. |
| Semantic cardinality | Typed operation or motif law | Retain | Counts such as one-to-many correspondence, branch arity, or required endpoint cardinality describe meaning and are not catalogue totals. |
| Source-shape/import checks | Architecture or bundle boundary unavailable through runtime inspection | Retain narrowly | Use only for forbidden imports, literal dynamic-import ownership, or absence of application/browser dependencies; pair with public behavior where possible. |
| Runtime endpoint and seek fixtures | Semantic compiler and single-clock contract | Retain | Native endpoints, direct seek/rewind, identity, and deterministic samples are durable truth. |
| Compatibility fixtures | Compatibility ledger entry and exact caller graph | Retain until replacement | Delete only with the final compatibility declaration after zero callers and a stronger owner are proved. |
| Visual sample counts and timing checkpoints | Approved exemplar/preservation contract | Defer | No migration during this non-visual run; subjective sampling changes require a human checkpoint. |
| Documentation inventories | The cited generated or canonical exact set | Keep only as freshness checks | Prose totals must be derived or paired with an exact identity comparison, never treated as runtime authority. |
| Malformed-input fixtures | Public validator diagnostic | Retain | Failure code and repair path are part of the authoring protocol, not incidental implementation shape. |

## Applied correction

`equation-presentation-profile-authoring-ratchet.test.ts` asserted that there
were 25 equation assets. The canonical inventory contains 30 and already owns
their exact identities. The test now compares the concrete asset IDs with the
inventory IDs before applying the presentation-profile law. This preserves the
historical failure—an equation asset escaping the profile contract—without a
second hand-maintained total.

## Deliberate non-deletions

The generated manifest, inventory, authority graph, preservation matrix,
disposition ledger, reachability graph, fallback audit, and infrastructure
inventory equality checks remain. They prove freshness of serialized evidence,
not merely counts. Semantic cardinality assertions also remain because replacing
them with collection non-emptiness would weaken the operation laws.

Source-shape checks remain only where the forbidden property cannot be observed
reliably from a runtime value, especially import direction, public-barrel use,
and literal lazy-loader edges. Slices 19-20 may retire adjacent tests only when
the exact reachability graph demonstrates that their compatibility owner can be
deleted as the same rollback unit.
