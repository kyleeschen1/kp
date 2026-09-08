# R2 reusable reasoning: combined visual checkpoint

Date: 2026-09-07 (local; execution evidence crosses into September 8 UTC)
Outcome: HUMAN_CHECKPOINT — visual acceptance required before promotion.
Authority: approved `2026-09-07-reusable-reasoning-long-loop-proposal.md`;
live execution remains solely in `run-contract.kp.reusable-reasoning-v1`.

## Open and review

Working shared-server URL: <http://localhost:8000/experiments/reusable-reasoning/>.
The existing port-8000 server was verified in a browser. No new persistent server
or deployment was introduced. If the server is later stopped, run `npm run dev`
from the repository root; do not use the production preview for this dev host.

1. Scrub or use arrows through the parent argument. Open **Why does this step
   work?**, inspect its four intermediate operations, then return. An interrupted
   parent position should be preserved exactly.
2. Switch **Full / Compact**. The shorter reading keeps the same equation range,
   references, assumptions and revision. Every reading has one passage slot per
   semantic checkpoint; compact changes the introductory prose, not step spacing.
   The header counts beat slots from **1 / 5** to **5 / 5** (initial state plus
   four operations), or **1 / 4** through **4 / 4** for the three-step draft.
3. Try **Predict** and **Reconstruct**. Write an attempt, compare with the native
   equation answer, and return to reading. Working is a local self-check, not
   automatic grading. Required assumptions remain available during practice.
4. Open **Edit source JSON**, choose **Load three-step draft**, then **Apply
   source**. The draft-loader alone intentionally changes nothing in the reader.
   The applied lesson ends at `2x/3 + 12/3 = 10`, not `2x/3 + 4 = 10`; both
   practice answers and all readings update. Applying a valid revision resets the
   reader to its beginning. Invalid JSON or unsupported bindings leave the last
   valid lesson and position unchanged.
5. Check the same interactions at phone width and with keyboard controls. Touch
   passage travel and slider input should show intermediate states continuously.

Approval concerns the clarity and feel of this one integrated exemplar:
argument/reason distinction, return behavior, reading density, practice flow,
source-apply feedback and phone layout. It does not certify learning efficacy,
arbitrary math support, publication readiness or every supported browser.

## Canonical identity and preservation

- Artifact: `animation.fraction-composition.two-thirds-solve`.
- Reference host: `/experiments/authoring-distribution-focus-card/`.
- New isolated host: `/experiments/reusable-reasoning/`.
- Source: trusted `createKpLawfulFractionSolveMacro()` trace, with authored
  structural distribution projection restored through the existing preview
  boundary. Every native endpoint's actual LaTeX is checked against that trace;
  matching an asset ID is not sufficient.
- Renderer: existing chrome-free native fraction-composition session, material
  transport/salience adapters and shared timeline playback clock.
- Form: shared Focus Card scaffold and passage typography, including practice.
- Initial authored revision:
  `sha256:51f057a347a7e03d59d035d29a8c306ad3cf76e967589d3ef88ac213203b7817`.
  The digest pins source bytes and trusted trace; it is not itself proof.

No shared animation choreography, semantic grammar, Article v1 schema, tax
exemplar or R1 host was replaced. The smallest rollback is an individual slice
commit; the new visible host and its GET route are isolated.

## Evidence and limits

Repeatable commands:

- `npm run test:reusable-reasoning`: 47 tests through source/authority/reference,
  formula/procedure/support/extraction, real-clock navigation, reading equivalence,
  existing flashcard projections and atomic last-valid drafts.
- `npm run visual:reusable-reasoning`: isolated native browser integration.
- `npm run visual:reusable-reasoning:shared`: nine integrated Chromium
  checks against the human's port-8000 URL, without starting another server.
  Captures include the distributed state, exact return, changed native endpoint,
  phone reason and phone practice. The phone check includes keyboard operation,
  multiple intermediate scroll samples, a Chromium emulated touch gesture,
  one active accessible equation and no horizontal page overflow.
- Full typecheck, architecture gate and production build passed during this
  integration. Existing large-chunk build warnings remain; budgets were not raised.
- Theseus workspace validation accompanies the checkpoint commit.

Captures are disposable outputs of the stable browser command, not reviewed
goldens. The source-owned canonical contact-sheet command supports its existing
reader route manifest, not this isolated authoring host; this checkpoint uses the
scoped integrated browser captures instead of adding the experiment to that
production route authority. No broad aesthetic certification matrix was added.

Actual failures found and repaired: CSS scroll snapping competed with exact
clock-owned return; optional native duration needed validation; a claim-reference
field typo was caught by types; one negative test needed to assert the typed gap
code rather than its human-readable message. All corresponding final checks pass.

The authoring envelope is the first one to four verified operations of this
fixed fraction trace plus editorial text and valid bindings. Arbitrary coefficients,
new rules and skipped semantic handoffs return repair gaps. Editorial prose is
not mathematically verified. Drafts and learner working are page-local and do not
survive reload. Initial no-JS semantic truth exists, but revision-pinned filesystem
export/static publication and URL/history lifecycle hardening remain later work.
Phone-width Chromium and emulated touch are not physical-device or cross-browser
release certification. The native phone layout retains its stacked equation form.

## Resume boundary

### Checkpoint refinement: continuous gestures with predictable settlement

Historical implementation; superseded by the current supply-tax convergence
section below. The adjacent-only clamp and wheel-tail fence are no longer used.

The user approved the design recommendation and explicitly required attention
to Safari's scroll semantics. Horizontal passage input now drives the semantic
playhead directly, rather than reading native scroll offsets or waiting for
`scrollend`. The browser owns vertical pan and pinch zoom; CSS snapping is off.
This separation is consistent with WebKit's distinction between platform
scrolling/momentum and engine snap behavior; see
[WebKit scrolling architecture](https://trac.webkit.org/wiki/Scrolling).

Passage gesture authority is a private capability distinct from slider scrub
authority. One gesture explores at most the adjacent checkpoints. Its release
destination combines distance and recent velocity; a paused small exploration
returns, a decisive flick advances, and reversal can cancel an advance. Release
uses a monotonic deceleration on the existing clock, not a second RAF loop or
CSS animation. Arrow playback and ink motifs are unchanged. The visible counter
holds the prior settled beat during input; explicit intermediate restoration
orients the count to the nearest beat without rounding the saved playhead.

Touch/pointer release settles immediately. Trackpads have no portable physical
finger-up signal: the local treatment uses 90ms of wheel quiet and a 180ms
quiet tail fence. Cancellation preserves that fence across disclosure/return;
late inertial input cannot immediately claim a new gesture. Those numbers and
the distance/velocity policy are provisional exemplar tuning, not global laws.
A sufficiently long event gap can be indistinguishable from a new gesture;
do not claim perfect physical trackpad classification.

Executed checks cover real mouse passage drags at phone width, emulated
Chromium touch, continuous intermediate values, release, native snap events,
overscroll offsets, wheel tails, exact interrupted return and vertical page
scrolling. The bounded three-test cohort passed in Chromium, Firefox and WebKit
(nine checks). The vertical test exposed a real inherited `overscroll-behavior`
trap in nested passage sections; the exemplar now allows vertical scroll to
chain to the page. Deterministic unit laws cover flick/hold/reversal, bounded
destinations, stale authority and interruptible no-overshoot deceleration.

WebKit automation is not physical iPhone/iPad or installed Safari certification.
The human should review touch/trackpad feel at the same port-8000 URL, especially
short flicks, exploratory reversals, repeated gestures and vertical scrolling.
Rollback unit: this gesture-refinement commit. No semantic source, authoring
schema, equation renderer, or other card family is replaced. The run remains
deferred at **14/24**, pending this exemplar's visual acceptance before s15.

### Checkpoint refinement: semantic slots, progress fraction and ink evaluation

The user requested actual step-beat slots, a visible n/total counter, and the
crisper ink-glyph evaluation treatment. Every parent/reason and full/compact
reading now maps one passage page to each verified checkpoint. Controls retain
their navigator-owned semantic authority; CSS snap and page count do not become
another clock. The counter counts states, not completed operations, and is hidden
during practice. Source replacement updates both its numerator and denominator.

The prior host used the legacy successor-synthesis compositor treatment. The
promoted contributor-fusion ink-knot primitive existed, but this chrome-free host
did not mount its certified playback wrapper. The bounded product and quotient
now use that existing wrapper and its unchanged optical profile. No new motion
curve, glyph geometry, equation source, evaluation rule or timeline was authored.

Certificates are compiled through the existing grammar, evaluation registry and
topology verifier. An operation-specific projection adds operation identity to
existing contributor roles without mutating the shared source: a result such as
12 can legitimately be the next operation's operand. The migration input type
now names only the semantic fields it consumes, avoiding a fabricated playback
asset for single-transition certification. The chrome-free host accepts nominal
certificates as an opt-in capability and rejects forged, duplicate or unmatched
bindings; existing callers retain their treatment. This is not catalogue-wide
promotion or a claim that every legacy host has migrated.

Unit checks prove nominal family authority, source immutability and fail-closed
missing contributor roles. Browser checks execute source compression, opaque
paint, exclusive source/target ownership, rewind and both native endpoints.
The bounded ink and release tests passed in Chromium and Firefox; screenshots
were inspected, not adopted as goldens. The full shared-server suite also covers
phone interaction and source edits. Human review still owns the aesthetic
acceptance; the run remains deferred at **14/24**, before s15.

Rollback unit: this checkpoint refinement commit. Preservation boundary:
accepted distribution arc, normalization, verified fraction trace, shared
scaffold typography, single clock, and exact interrupted return.

### Current checkpoint repair: supply-tax control convergence and live beat count

This supersedes the earlier one-gesture/one-beat clamp, wheel-tail fence and
endpoint-only counter policy. The counter and active passage share a live projection from
the existing semantic playhead. A narrow midpoint deadband prevents flicker;
neither waits for gesture release or exact settlement. Endpoint and intentional
fractional-return semantics remain unchanged.

The follow-up backward-lock diagnosis reproduced an invisible wall: starting at
beat 3, requests for 2.5 and 2 worked, but 1.5 and 1 remained at 2. A continuous
gesture retained its original anchor and adjacent-only clamp. Recognizing fresh
input after release did not repair that active-gesture defect. Continuous travel
is now bounded only by the lesson; one-step restrictions remain on arrows.

`focus-deck-continuous-navigation.ts` extracts supply-tax's settlement policy:
the visibly reached checkpoint wins over an older gesture origin. Both tax and
reasoning invoke it. Exhaustive bounded-input parity checks preserve the former
tax calculation. Tax keeps its existing thresholds, native snap corrections,
SVG renderer, source and lifecycle adapter; it is not wholesale rewritten.

`focus-deck-native-input.ts` supplies the reasoning card's domain-neutral input
adapter. Passage wheel/touch movement uses native scrolling and inertia, sampled
once per frame. The equation area proxies horizontal input into that same lane.
No momentum-tail classifier or blanket lockout remains. Only an issued active
input session can project scroll into the semantic clock; derived scroll writes,
late scrollend, cancelled sessions and disclosure cannot acquire those rights.
CSS snap remains disabled in this exemplar so exact fractional restoration and
clock-owned settlement do not compete with browser correction. Wheel quiescence
still uses supply-tax's 140ms quiet/220ms fallback convention; it is not a claim
of perfect physical finger-up detection. Live count feedback does not wait for it.

The card is the consistent horizontal input region, including equation and
passage surfaces. Established horizontal wheel intent tolerates diagonal noise.
Touch retains native vertical scrolling and pinch zoom; form controls are left
native, and mouse drags on prose/math preserve selection. Mouse blank-space
drag, touch swipe, horizontal wheel, slider and keyboard retain their existing
single-clock and bounded-lesson ownership. No renderer, verified source, equation
motif or shared semantic contract changed, following the visual-salience skill's
presentation preservation boundary.

New deterministic tests cover multi-beat travel, reversal, shared settlement
parity, live beat projection, jitter and endpoints. Browser tests execute actual
native multi-beat wheel travel backward and forward, synchronous stage-proxy
renewal/reversal and live count updates. Stale-capability, exact-return,
vertical-scroll and phone continuous-control checks remain. The length/view
matrix is split by authored length to keep independent cases bounded.
This does not certify physical iOS Safari or catalogue-wide controller adoption.
What is shared now is the settlement policy; the reasoning native adapter is a
reusable module, but tax retains its proven adapter until a separate migration
is justified. Full unification of all card lifecycle adapters is not claimed.

Final evidence: 47 reasoning and 81 tax unit tests, full typecheck and the
architecture gate passed. Integrated browser cases passed across the full run
and focused reruns in Chromium, Firefox and WebKit. One earlier case was
invalidated by a shared-server hot reload during file edits. The final scoped
`native passage` cohort passed in all three engines with sustained smaller
wheel events instead of assuming an oversized event has identical OS scaling.
Fresh vertical scrolling passes. An immediate vertical wheel after a long
horizontal Firefox stream did not scroll the article in automation; rapid axis
switching remains an explicit physical-browser review item, not a passed claim.

Rollback unit: this isolated control-refinement commit. HUMAN_CHECKPOINT remains
14/24; subjective feel still requires acceptance before promotion.

### Checkpoint repair: release-to-settle and standing prevention rule

The user subsequently identified missing release-to-snap and requested durable,
preferably static-type prevention for bug fixes. `AGENTS.md` now carries that
repo-wide standing instruction: repair the invariant at its owner, prefer
unrepresentable invalid states and constrained APIs, supplement browser/external
boundaries with runtime guards and executable regression laws, and state limits.

Fractional sampling is valid only during interaction or intentional restoration;
gesture completion now settles to the nearest verified checkpoint through the
existing native clock (ties choose the upper checkpoint). Slider input and commit
are distinct. Passage contact, momentum and rest are represented explicitly.
A privately branded scrub capability is issued only by the navigator; stale,
cancelled, superseded or disposed gestures cannot move or settle the clock.
Static types prevent callers from manufacturing a structurally similar handle;
runtime identity checks enforce the temporal/linear ownership that TypeScript
alone cannot prove. Open/return and source replacement invalidate gesture rights.

The release browser test found Firefox advertised `scrollend` but omitted it for
the tested wheel event. The host therefore uses the existing Focus Card pattern
of 180ms input quiescence alongside native scrollend, and waits while contact is
held. This is gesture-end detection, not a second animation clock. Timers are
cancelled with interaction ownership and cannot resnap restored positions.
The scoped browser entrypoint now tests actual mouse slider release, wheel
settlement in Chromium and Firefox, touch settlement in Chromium, delayed stale
events and reduced motion. Unit laws cover exact settlement and stale authority;
typechecking includes a rejected forged-handle fixture.

### Checkpoint repair: semantic stepping (2026-09-07)

User confirmed editing but reported that Next traversed the whole argument.
Cause: the host used `(visible prose pages - 1) / range end` for both prose
pagination and animation controls. Parent/full and compact views had two prose
pages, so one increment targeted all operations. Detailed reason/full happened
to have a page per checkpoint. This was introduced by the R2 host integration,
not KaTeX rendering, the verified algebra schema, or the existing motion motifs.
Earlier browser checks tested Next only inside the detailed reason and missed
the default parent control contract.

The navigator now derives adjacent step destinations exclusively from verified
procedure checkpoints; its step API cannot receive prose-page counts. Sliders,
ticks, accessible labels and keyboard limits use semantic steps in every reading.
Prose travel keeps its separate continuous projection. Replay and explicit End
remain whole-range actions. The shared keyboard helper also now uses directional
floor/ceiling, rather than rounding a unit offset that skipped boundaries from
fractional positions.

Regression laws cover every supported procedure length, parent/reason traversal,
forward/backward exact stops, interrupted positions and invalid seeks. Browser
coverage crosses full/compact with parent/reason before and after a source edit,
checks exact native states, and verifies normal-motion Next stops instead of
merely passing through an intermediate state. The shared keyboard test checks
fractional positions across 2–15 checkpoints. These tests fail if prose density
is allowed to retarget operation controls again. This is a checkpoint repair;
it does not authorize post-checkpoint promotion or claim all future regressions
are impossible.

Stop here until the user explicitly accepts this combined visual checkpoint.
Do not infer acceptance from earlier approval to execute through this checkpoint.
After acceptance, use `theseus plan run` at the repository root, restore the
deferred R2 contract to ready through Theseus, then execute its remaining approved
slices beginning with accepted interaction regressions. The contract owns the
remaining queue: lifecycle, publication, code pressure, demonstrated shared seam,
authoring packet/live trial, release and closeout. Materially different code
visuals still require their own bounded checkpoint. R3/Bayes is not authorized.
