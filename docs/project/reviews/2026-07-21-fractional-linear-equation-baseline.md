# Fractional Linear Equation Baseline

Status: captured before implementation  
Command: `npm run baseline:fractional-linear-equation`

## References

The canonical motion reference remains the reader's accepted `x + 3 = 7`
symbol choreography. At 1280 by 900 its equation stage is 509 by 558 pixels,
uses KaTeX_Main at 23.232 pixels throughout the native equation states, and has
no internal scroll overflow.

The existing `2/4 -> 1/2` editor animation is a structural fraction reference,
not a visual acceptance reference. It exposes fraction rules and semantic
motion owners across factor split, common-factor separation, and unit-factor
absorption. Its stage is approximately 542 by 560 pixels and its principal
KaTeX states also use 23.232 pixels. The current unit-factor witness drops to
13.9392 pixels and the late absorption state uses partially transparent
material; neither behavior is inherited as an exemplar requirement.

## Measured preservation boundary

- Principal equation typography stays KaTeX_Main at 23.232 pixels.
- The new reader stage must remain within the existing approximately 509 by 558
  pixel desktop envelope and must not gain internal scroll overflow.
- Fraction structure should reuse measured numerator, fraction-rule, and
  denominator roles, but native/material ownership must follow the reader's
  solid atomic handoff rather than the editor reference's fading absorption.
- The linear reader's subtract-both-sides and cancellation choreography remains
  the accepted reference for the first half of the new equation.
- The baseline command is the stable visual-check entrypoint for this exemplar;
  later slices extend its capture set rather than adding scratch browser scripts.

Disposable screenshots and the machine-readable measurements are written to
`tmp/codex/fractional-linear-equation-baseline/`.
