# Next: compose the dot passage inside a rectangular product

Status: recommendation following focus tuning; no implementation started by
this review. The existing matrix-authoring contract retains its visual gate.

The current dot exemplar has a 6px default lift, 0–24px height control, 40%
background opacity, no background scaling and no shadows. Its held focus and
native/moving token correspondence are tested. This establishes one working
presentation, not a general-purpose authoring interface or learning outcome.

Recommend the preserved 2×3 by 3×2 integration from
[the approved authoring plan](2026-09-30-matrix-authoring-next-step.md).
Keep both factors and the result visible; choose a result cell, derive its
original row/column relationship, run the existing three-term passage, and
return its value to the corresponding result position. Start with one cell,
then demonstrate all four selections and a second set of values through the
same authoring source boundary. Record any remaining renderer edits honestly.

| Candidate | Authoring benefit | Reuse evidence | Risk | Recommendation |
| --- | --- | --- | --- | --- |
| Rectangular product integrating the dot passage | High | Tests composition and semantic selection | Medium | Next |
| Entry inspection and provenance | Medium | Tests audit usefulness | Medium | Follow integration |
| Polynomial-to-matrix transformation | High | Tests a new representation boundary | Higher | Later pressure case |
| More focus controls | Low | Little new reuse evidence | Low | Only for observed defects |

Canonical host remains the matrix menu; native KaTeX and the existing material
adapter own paint, and `src/math/matrix-product.ts` owns mathematical identity.
Preserve the standalone passage, evaluation choreography and source-only signed
variation. Keep this integration independently reversible and review its layout
before promotion. No universal scene API, arbitrary-dimensional renderer or
new content library is implied.

Success means selecting another cell changes the semantic input and destination,
not the dot-product animation implementation. The old rectangular continuation
is still relevant; the shadow experiment is superseded, and parked symbolic
inspection work is not automatically resumed. This recommendation does not
change Theseus execution status or declare the latest visual changes accepted.
