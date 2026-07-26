# Canonical animation construction release matrix

Date: 2026-07-26  
Run contract:
`run-contract.kp.canonical-animation-construction-governed-round-trip-v1`  
Proposal:
`docs/project/reviews/2026-07-25-canonical-animation-construction-governed-round-trip-long-loop-proposal.md`

## Outcome

The governed canonical-construction path passes the release matrix without a
waived invariant or widened budget. The fraction reader remains the only
product-default migration. Governed fraction variation, exponent absorption,
radical succession, and the compound trace remain fixtures and review
surfaces, not competing product implementations.

## Release repairs

The first broad run exposed three bounded integration defects:

1. The general concept-authoring barrel re-exported the canonical-animation
   cohort, raising the concept inference graph above its fixed ceiling. The
   canonical construction API now has a dedicated public barrel. The ceiling
   remains unchanged; measured inference is 35,710 types and 42,368
   instantiations.
2. The glyph experiment controller crossed its fixed 40,000-byte source
   ceiling. KaTeX rendering and passive review-gallery framing moved into
   narrow presentation helpers. The controller is 39,959 bytes and keeps one
   runtime authority.
3. The reader-manifest inventory still expected the fraction route's former
   single review checkpoint after the accepted 5-moment × 4-profile review
   matrix was committed. The ratchet now names all 20 checkpoints and checks
   their progress, viewport, and motion profiles.

These repairs change neither mathematics nor runtime lifecycle vocabulary.

## Verification

| Area | Command | Result |
|---|---|---|
| Full repository | `npm test` | 2,498 passed |
| Types and domains | `npm run typecheck` | passed |
| Production build | `npm run build` | passed; 616 modules |
| Architecture | `npm run check:architecture` | passed; zero semantic-animation exceptions |
| Inference | `npm run check:inference` | passed; fixed ceilings retained |
| Reader conformance | `npm run test:browser:reader-conformance` | 9 passed |
| Native glyph compositor | `npm run test:browser:real-katex-glyph-compositor` | 44 passed |
| Canonical construction | `npm run test:browser:canonical-animation-construction` | 6 passed |
| Compound visual matrix | `npm run visual:canonical-animation-construction` | 3 passed |
| Packaged output parity | `npm run test:browser:canonical-animation-review:packaged` | 1 passed |
| Generated HTML safety | `npm run test:browser:tutorial-generated-html-escaping` | 5 passed |
| Canonical budgets | `npm run check:canonical-animation-budgets` | passed |
| Budget laws | `npm run test:canonical-animation-budgets` | 2 passed |
| Glyph performance | `npm run perf:glyph-reconciliation-experiment` | passed |
| Reader route budgets | `npm run check:reader-budgets` | passed |
| Reader production closure | `npm run check:reader-production` | 8 routes passed |

The browser development server logged unavailable optional dev-review proxy
requests because the inbox backend was not running. Those requests are outside
reader and animation behavior; every browser assertion passed.

## Frozen measurements

- Construction p95: 2.96 ms under 50 ms.
- Verification p95: 1.12 ms under 10 ms.
- Compound sample p95: 0.017 ms under 0.1 ms.
- Canonical projection: 26,725 bytes under 48,000 bytes.
- Review entry gzip: 2,301 bytes under 4,000 bytes.
- Review closure gzip: 47,748 bytes under 80,000 bytes.
- Review plus glyph closure gzip: 236,628 bytes under 250,000 bytes.
- Ordinary-reader canonical review leakage: zero files.
- Glyph cold-plan p95: 6.49 ms under 12 ms.
- Glyph frame-sample p95: 0.0065 ms under 1 ms.

## Release conclusion

The release gate supports closeout. The canonical construction contract,
compiler-owned verification, renderer-session compositor, native semantic DOM,
review gallery, and export projections remain distinct layers connected by one
artifact lineage. No stop condition fired.
