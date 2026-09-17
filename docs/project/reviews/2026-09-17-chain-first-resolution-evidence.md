# Bounded move resolution

The compiler now asks the existing alignment, raw combination and reduction
owners to check each pair of adjacent source states. A unique issued candidate
requires no hint. A supplied hint must match a checked candidate; it cannot
override arithmetic, operand order, domain constraints or presentation limits.
Resolved authority is passed into compilation without re-authoring endpoints.

All four retained callers compile without hints and retain the same operation
authorities. Source revisions still include hints and prose: editing intent
does not reuse a stale compiled revision. Proof and renderer injection remain
forbidden by the source reader.

These three current patterns have disjoint endpoint shapes (pair→pair,
pair→fraction, fraction→fraction). There is no natural multi-candidate example
in this bounded family. The resolver refuses multiple unchecked intentions:
`1/3+1/6 → 1/2` does not choose between unshown derivations; it asks for explicit
intermediate stops. The defensive multiple-candidate branch would require a
matching hint if future checked owners overlap. That branch is not evidence of
tested arbitrary algebra disambiguation.

`npm run test:fraction-chain` includes four hint-free callers, wrong hints,
equivalent endpoints with missing paths, false subtraction, unsupported symbolic
denominators and a repaired raw combination. Negative/zero presentation gaps
remain explicit. No new renderer, visual treatment or theorem solver is added.
