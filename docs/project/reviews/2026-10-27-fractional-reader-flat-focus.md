# Fractional equation: flat focus and Nocturne candidate

User direction: apply the tutorial handoff's dark palette, then remove the depth
focus effect just for this example. The reported symptom was outgoing terms
remaining visible. The user identified depth as a suspected cause; the inspection
did not establish that depth itself owns the opacity defect.

Canonical reference: `/reader/solve-fractional-linear/`, backed by
`fractional-linear-equation-asset.ts` and the existing fractional animation adapter
through the shared native equation reader. This is still the existing reader;
the planned document-anchored derivation trail is not implemented by this change.

## Changes and boundary

- The fractional asset explicitly selects `flat-v1`; other assets retain their
  profiles. Remove this reader's separate legacy focus shadow as well.
- The compiler opts this page into the Nocturne palette before enhancement and
  measurement. Page, native math, moving fragments, controls and borders use the
  shared role variables. Paper colors preserve the printable static transcript.
- Keep semantic operations, equation states, existing cancellation/synthesis
  choreography and native endpoints unchanged. No new fallback animation.
- Restore revision and material-kind diagnostics on freshly created material
  visuals after authority stripping. The old browser check expected these
  attributes, but the owner only recorded revision on the parent. Those diagnostic
  failures were not evidence of stale visible ink.

The browser command now samples intermediate frames, actual forward/reverse
document scrolling and the final solution; it checks flat depth, no focus shadow,
Nocturne foreground/background, requested progress and no outgoing source-anchor
paint at the final solution. These guard the observed treatment and terminal
ownership, not every possible intermediate compositing failure.

## Verification

- Focused fractional animation, compiler and page-shell tests: 13 passed.
- `npm run visual:fractional-linear-equation -- --smoke --base-url=http://127.0.0.1:8000`:
  17 samples, zero failures (Chromium desktop; direct seek and scroll reversal).
- Full repository `npm run typecheck`: passed, including Svelte and domains.
- Subjective motion acceptance remains pending. No cross-browser certification
  or general trail-format promotion is claimed.

## What to inspect

Reload `/reader/solve-fractional-linear/`. Scroll through subtraction and the
denominator cancellation, then to `x = 8`, and back. Focus should have no lift,
depth enlargement or shadow; the final solution should contain no outgoing
source terms. Judge whether the remaining mathematical choreography is now clear.
Rollback is the fractional profile/palette opt-in; shared diagnostic metadata can
remain independently of the visual candidate.
