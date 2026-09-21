# A persistent code stage inside the focus card

Status: HUMAN_CHECKPOINT; one unpromoted exemplar.
Execution: `run-contract.kp.passage-consolidation-v2`, `code-transfer`.

Review: <http://localhost:8000/experiments/centroid-reasoning/?reading=focus#extract>.
Select **Keep the answer**, then **Move the calculation**, and scrub through the
same transformation. The explanation changes while the code stage remains in
place. Open **More about this extraction** to recover the fuller reasoning.

## Approved direction and boundaries

The user values the existing animation but found the prior page layout unable
to keep text and code visibly coordinated, with unclear clickable affordances.
Reuse the focus-card format while preserving continuity through several moves.

Canonical artifact: centroid-before/after TypeScript and checked
`centroid-extraction.generated.json`. Host: existing centroid inspection.
Renderer: existing native code and token theater. Semantic authority and the
six-second clock remain unchanged. The shared `renderKpFocusDeckScaffold` and
its typography own the card shell; the local adapter owns this exemplar's
arrangement, editorial landmarks, navigation and measured fit.

One stage node is moved into the card slot, never cloned or recreated when a
thought changes. A reserved instruction area precedes the code; inactive cues
reserve geometry but are inert and excluded from accessibility. Named buttons
animate from the current playhead; scrubbing seeks continuously. Reduced motion
seeks directly. Deeper explanation is outside the measured working surface.

Fit is measured after layout and on viewport/font resizing. When possible the
card fits within the viewport with a readable scrollable code surface. Native
code stays unscaled and the last line remains accessible. Extremely short
windows switch explicitly to ordinary page reading when less than 96 pixels
would remain for code. Instructions also retain keyboard-accessible overflow
at extreme text sizes. This is an explicit fallback, not a claim that arbitrary
text and code can always be shown simultaneously.

Rollback unit: local focus publication/adapter, host hook and scoped styling.
Default paragraphs and prior query-based trials remain available. No other card
or code caller is migrated. Added maintenance is two small exemplar modules;
no new clock, language evidence, renderer or global state store.

## Focused verification and limits

- Nine focused source/model/publication unit cases passed.
- Eleven Chromium cases passed through `npm run visual:code-reasoning -- tests/centroid-reasoning.browser.spec.ts`.
- A final focused rerun covers the active cue's accessibility state.
- App, node and test TypeScript checks and architecture gates passed.
- New checks cover actual animated navigation, rewind, persistent stage identity,
  stable stage geometry, direct scrub, keyboard/reduced-motion access, 24px root
  text at desktop/phone widths, bounded fit, bottom scroll access, extreme-window
  reading fallback and deeper disclosure preserving stage geometry.
- Desktop and enlarged-phone captures inspected; captures remain disposable.

The first fit assertion assumed even a 480px-high window at enlarged text could
retain a useful code viewport. Verification now distinguishes the bounded layout
from its explicit reading fallback instead of claiming universal fit. An initial
dependency check mistook a DOM helper named `require` for a module import; it is
now named `element`. A browser run reset during development and another lost
resources during a dev-server restart; an unchanged full rerun passed.

The impact selector lacks a focused rule for this adapter. This remains visual
discovery under the repo cadence, not broad promotion. Human judgment must decide
whether the card coordinates attention naturally; second-caller transfer and
cross-browser release checks remain downstream.
