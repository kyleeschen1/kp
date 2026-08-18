# Compositor Before Balanced Operations Next-Step Review

Date: 2026-08-18
Status: accepted ordering; implementation awaits long-loop approval

## Decision

The balanced-equation animations are not the immediate defect. Existing
subtract, multiply, divide, and apply-log callers have semantic traces,
presentation plans, deterministic playback, and strong focused tests. Their
generation family remains only `Exemplar` because KP lacks one parameterized
both-sides operation authority, shared causal recipe, governed authoring
surface, and varied pressure corpus.

Before consolidating that family, restore the canonical native-KaTeX
compositor's architecture gate. Current evidence is deliberately asymmetric:

- real-glyph compositor: 73/73 passing;
- reader runtime hardening: 18/18 passing;
- operation-presentation plans: 186/186 passing;
- canonical equation renderer: 13/14 passing;
- failed gate: 309,245 direct-dependency source bytes against 295,000.

The four canonical core modules remain within their 140,000-byte ceiling, and
the route bundle budgets remain green. The failure therefore indicates
ownership and maintainability pressure, not a visible renderer regression.

## Candidate Order

Scores are relative; risk is better when lower.

| Candidate | Authoring | Reliability | Reuse | Risk | Recommendation |
| --- | ---: | ---: | ---: | ---: | --- |
| Generalize balanced operations immediately | 5 | 3 | 5 | 4 | Defer one gate |
| Raise the compositor dependency ceiling | 1 | 1 | 1 | 5 | Reject |
| Restore compositor ownership and measurement first | 4 | 5 | 5 | 2 | Do next |
| Build alternative-base logs immediately | 3 | 3 | 4 | 4 | Do after balance |

## Revised Order

1. Attribute and separate compositor rendering from scene-plan compilation;
   restore the existing closure gate without disguising moved bytes.
2. Reconcile existing balanced-operation authorities and promote only their
   proven common causal seam.
3. Add governed both-sides authoring and a varied positive/negative corpus.
4. Normalize alternative logarithm bases and build one visual exemplar.
5. Stop for human review before promoting the new visual family.

The detailed proposed execution contract is
`2026-08-18-compositor-balanced-log-base-long-loop-proposal.md`.

## Preservation Boundary

- approved log product, quotient, exponent, distribution, cancellation,
  fraction, radical, operation-evaluation, and place-value behavior;
- native KaTeX ownership at settled endpoints and inert transit paint;
- one deterministic clock, direct seek/rewind, and exact URL state;
- current route/bundle ceilings and lazy feature-pack boundaries;
- user-owned economics and unrelated documentation changes.

## Stale-Plan Notes

The generic Theseus delivery workflow still summarizes an older gold-reader
frontier. The roadmap and active compiler thread are newer authority. Do not
revive that stale wording or create a competing product-layout run.
