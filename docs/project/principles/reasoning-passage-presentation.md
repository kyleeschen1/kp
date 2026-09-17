# Shared reasoning-passage presentation

Status: user-directed central ownership, 2026-09-17. Energy and scalar are the
accepted visual references; the fraction reader must reuse their treatment.
This applies to these persistent equation passages, not every KP medium/layout.

## Owners

- `src/reader/presentation/reasoning-document.css` owns document typography,
  reading rhythm and headings. New hosts use `kp-reasoning-document`; the
  existing `physics-reader` class is a compatibility alias. Prose uses the
  existing `--kp-focus-card-passage-font` role, shared with focus cards.
- `src/reader/presentation/equation-passage.css` owns equation passage controls,
  disclosure brackets, focus cues and native record styling. Existing
  `energy-derivation-*` classes remain the compatibility contract across subjects.
- `src/reader/presentation/equation-rail.css` owns statement stops, active
  intervals, grip, inset records and active explanatory text.
- `src/reader/runtime/equation-rail-presentation.ts` projects the current
  measured interval to those shared visual roles. It owns no clock, domain
  semantics, motion recipe or mathematical correspondence.
- `src/reader/app/canonical-equation-surface.css` owns native equation surface
  geometry independently of a lesson's document or the equation demo's theme.

The mechanics stylesheet and historical rail stylesheet delegate to these
owners. They do not contain independent copies. New equation passages must not
import the complete `src/reader/app/exemplar.css` demo page to obtain compositor
geometry: that also imports a different document theme and font.

## Host contract

Load shared document and passage CSS in static HTML, before enhancement. Use
the common action wrapper for disclosure controls, the nested-step markers for
expanded records, and the shared rail projection for both direct seeks and
disclosure updates. CSS alone cannot establish active-interval state.

Local CSS may place a renderer and reserve its measured prose/inspection lanes.
It must not select an alternative prose font, rail palette, inset treatment or
disclosure control appearance. Layout can differ when the math requires it;
reusing a palette while recreating the interaction's state styling is not parity.
Preserve native KaTeX typography and checked parent/child position ownership.

## Safeguards and limits

`npm run test:fraction-chain` rejects accidental demo-theme imports and local
font/rail-palette overrides in the fraction host. `npm run visual:fraction-chain`
compares computed document/disclosure styling across fraction, scalar and energy
before JavaScript, simulates a shared font-token change while preserving KaTeX,
and checks active stops, prose emphasis and the expanded-step bracket.
The existing mechanics browser command protects rail, focus and exact return.
Static edition stylesheet-closure tests retain transitive shared imports.

These are explicit checks for the participating callers, not proof that arbitrary
future CSS cannot drift. Add new reasoning hosts to the parity cohort and retain
shared imports; do not create a caller-specific exception to make it pass.

Fluent motion remains separate from document styling. Energy has a checked
fluent cancellation; scalar's compact view executes its checked child steps.
The numeric fraction chain currently binds
expanded factor reduction; the `fluent` profile name alone cannot certify a
direct numeric reduction or supply its paint correspondence.
