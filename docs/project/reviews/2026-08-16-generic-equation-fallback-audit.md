# Generic Equation Fallback Audit

Date: 2026-08-16  
Status: slice `s16` evidence for
`run-contract.kp.post-convergence-infrastructure-compression-v1`

## Finding

The generic equation route is compatibility infrastructure, but it is not
dead infrastructure. Its motif selection, phase easing, DOM measurement,
whole-equation fallback, and semantic-token sampler each have live production
callers and collectively serve 23 of the 30 equation surfaces.

The remaining seven surfaces use four specialized fail-closed stage owners:
three operation-evaluation surfaces, one log-exponent surface, one log-quotient
surface, and two log-product surfaces. Those failed-stage paths are canonical
error behavior, not visual fallbacks.

| Classification | Paths | Surface ownership | Decision |
| --- | ---: | ---: | --- |
| Live compatibility | 5 generic presentation paths | 23 surfaces each | retain |
| Live canonical | 4 specialized failed-stage paths | 7 surfaces total | retain |
| Diagnostic-only | 0 | 0 | none found |
| Unreachable | 0 | 0 | none found |

## Consequence

No whole-equation or generic-paint path is eligible for deletion in slices
`s19`-`s20`. “Generic” describes its compatibility role; it does not mean
unreachable or behavior-free. Retirement requires every named surface to move
to a listed canonical owner and then requires exact source, route, conformance,
endpoint, and bundle callers to reach zero.

The generated audit at
`../../../src/architecture/generic-equation-fallback-audit.generated.json`
records the current callers, surfaces, replacement owners, and retirement
condition for each path. Later retirement slices must use that evidence rather
than a source-name search.
