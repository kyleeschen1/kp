# Carrier-Preserving Simplification Release

Date: 2026-08-20  
Status: accepted  
Run: `run-contract.kp.carrier-preserving-simplification-v4`  
Slice: `cps22`

## Decision

Promote the demonstrated carrier-preserving simplification boundary:

- family: `carrier-preserving-simplification`
- handoff: `persistent-carrier-transfer`
- transformations: `simplifyMultiplicativeIdentity` and
  `simplify-additive-identity`
- reviewed callers: `animation.operation-evaluation.two-times-one-carrier`
  and `animation.generated.add-zero`
- renderer: the shared Native KaTeX carrier profile and specialized adapter

The release remains evidence-gated. A semantic carrier, strict identity-law
witness, removal cohort, stationary context, and exact endpoints are required;
equal glyph text or geometry never establishes identity.

## Evidence

The canonical fade-only treatment passed human review. The add-zero pressure
caller exposed an italic-ink ownership defect, which the completed Native
KaTeX compositor-conformance run repaired at the shared realized-paint seam.
The repaired digit and italic carriers then passed the human checkpoint,
bounded lifecycle pressure, and Chromium/Firefox/WebKit conformance.

Nominal release authority lives in
`src/architecture/carrier-preserving-simplification-release-approval.ts`.
Catalogue format and human disposition are projections of that authority; no
UI-owned flag can promote an additional caller.

## Preservation boundary

This decision does not promote other identity expressions, infer carrier
lineage, alter contributor fusion, remove the generic identity-absorption
compatibility path used by other callers, or authorize another renderer,
clock, operation family, or handoff.
