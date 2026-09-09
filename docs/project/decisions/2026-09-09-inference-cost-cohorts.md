# Approved inference cost cohorts

Status: accepted — user approved with “got. approve”
Date: 2026-09-09

Amend R4A s02 only. Preserve every pre-R4A fixture, including R3, under the
unchanged core ceilings: 112,500 types and 195,800 instantiations. Keep the
actual frontend consumer fixture mandatory in a second, combined gate.

The measured combined baseline is 127,387 types / 214,823 instantiations.
Apply the existing headroom formula (2% types, 3% instantiations, rounded up
to hundreds): 130,000 types / 221,300 instantiations. These are fixed ceilings,
not automatically refreshed measurements. They measure compiler structures,
not animation speed, runtime imports, or production bytes.

`npm run check:inference` must execute both programs. Explicit cohort membership
must match the fixture directory and parsed configs. Missing, duplicate,
unassigned or reassigned fixtures must fail. Preserve all negative type cases.
The historical core budget record remains unchanged.

This resolves the policy stop described in
`../reviews/2026-09-09-authoring-entrypoint-inference-stop.md`; its original
measurements remain provenance. The verified Graph3D identity import repair
remains. Resume the existing 24-slice contract, not a successor loop.

No other budget changes, external model calls, new semantic families, visual
redesign, universal schemas, merge or deployment are authorized. The original
R4A proposal and all its other stop conditions remain authoritative.
