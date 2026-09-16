# Stable, compact simulation readouts

Accepted direction: 2026-09-16. Existing exemplar implementation:
`src/tutorial/mechanics-relations/physics-readout.ts`. This is a local API,
not a promoted framework or a migration of existing figures.

For new or revised numerical inspections, enforce these presentation invariants:

- Choose precision per quantity and retain it throughout the inspection. Do not
  strip zeros or change units/notation as time advances. Rounding is display-only.
- Declare supported numeric bounds. Reserve digits, sign and decimal places in
  individual tabular-digit slots; labels and units are separate stable nodes.
  Reject nonfinite or out-of-range readings instead of silently widening,
  truncating or clipping them. Normalize rounded negative zero.
- Represent unavailable quantities explicitly. An undefined force component at
  rest is not zero; reserve its placeholder and explain its meaning.
- Initial HTML and live updates share the readout declaration. Update numeric
  leaves, not whole surrounding sentences. Preserve static and accessible truth.
- Reserve changing text/control variants using their actual layout at the
  current width and text size. Inactive variants must not be exposed to assistive
  technology. Time changes must not reflow the figure; resizing may.
- Use fixed bounds for the complete supported physical trajectory, including
  arrowheads, rather than fitting the viewport independently to each sample.
  Reduce unused space before reducing any reading or interaction affordance.

Required safeguards at the responsible presentation boundary:

1. Unit checks for precision, sign changes, rounded zero, rounding across digit
   boundaries, invalid values and the supported semantic parameter range.
2. Browser checks for label/unit/control/following-prose bounding-box stability
   through seek, reversal and rest. Check text fit and native geometry bounds at
   ordinary and enlarged text sizes. A CLS score alone is insufficient because
   input-associated shifts may be excluded.
3. Human review to select the smallest clear composition, followed by a measured
   size envelope at representative widths. Before acceptance, geometry checks
   establish fit and stability only; they do not certify clarity or minimum size.

Current evidence commands: `node --disable-warning=ExperimentalWarning --test
tests/physics-readout.test.ts` and `npm run visual:mechanics-relations`.
The graph review packet owns the pending compact exemplar checkpoint. A
structurally different caller must justify a shared readout API before promotion.
Do not treat these two fixtures as proof of universal graph layout support.
