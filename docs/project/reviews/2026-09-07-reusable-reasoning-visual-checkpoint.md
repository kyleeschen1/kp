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
   references, assumptions and revision. The reason's compact reading hides
   intermediate prose pages, not the underlying verified operations or motion.
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

- `npm run test:reusable-reasoning`: 38 tests through source/authority/reference,
  formula/procedure/support/extraction, real-clock navigation, reading equivalence,
  existing flashcard projections and atomic last-valid drafts.
- `npm run visual:reusable-reasoning`: isolated native browser integration.
- `npm run visual:reusable-reasoning:shared`: the same three integrated Chromium
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
