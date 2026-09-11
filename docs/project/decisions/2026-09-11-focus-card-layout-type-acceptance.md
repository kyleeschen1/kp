# Canonical focus-card text positioning and typography

Status: accepted by user, 2026-09-11.
Reference implementation: `1daab1f91`, gradient-contour primary on shared port 8000.

The user accepted the current text positioning and font policy as canonical.
Keep one instruction home above the figure, compact passage-to-stage handoff,
stable playback layout, shared passage/annotation typography, screen-readable
annotation sizes, and native math/code typography. Responsive and enlarged-text
composition may adapt; paragraph or attention changes must not move the stage.
These are focus-card defaults, not a universal layout for every article or essay.

The canonical policy is `../principles/focus-card-typography.md`. This acceptance
does not claim every legacy card has been migrated or every renderer certified.
No implementation or catalogue migration was requested in this discussion turn.

## Separate unresolved G3 issues

- The learner still cannot explain why the gradient gives steepest local ascent.
  The current comparison asserts the across/along contribution and introduces
  the numeric gradient in its last passage without deriving the connection to
  partial derivatives. Preserve the accepted presentation while repairing the
  explanation; visual polish is not pedagogical acceptance.
- Swiping outward at sequence endpoints sometimes invokes browser Back/Forward.
  Investigate shared gesture ownership, native scroll containment, momentum and
  real browser/OS navigation, not an equation- or semantic-model repair. Browser
  and input-device reproduction remain to be pinned down. Synthetic wheel/seek
  tests alone cannot certify absence of native browser history gestures.

G3 remains open for these issues; G4–G6 remain gated. The user asked to discuss,
not to implement either repair or resume the loop. No completed plan is reopened.
