# Whole and parts: exemplar review

Candidate, not visually accepted. User direction is algebra or linear algebra;
the disliked calculus presentation is explicitly out of scope. Contract:
`run-contract.kp.algebra-whole-and-parts-v1`; rationale and limits are in
`../2026-10-21-algebra-whole-and-parts.md`.

Open <http://localhost:8000/experiments/reusable-reasoning/?example=algebra-intuition&variant=whole-and-parts>.
The dev server remains on port 8000. Start with the whole expression, use the
arrows for each move, then scrub backward across collection and distribution.
Inspect whether the intact x+y feels like one quantity while its copies are
counted, and whether opening five copies makes both contributions clear.
The final prose contrasts unequal groups; it does not animate an invalid step.

Canonical source: `content/authoring/algebra/whole-and-parts.json`, 1,820 UTF-8
bytes. Revision:
`sha256:9e16fc7a10f4fcf3f79469ad98da36572f4ff1b42cf66fc702e6ab5e201fe6ef`.
Four states: `3(x+y)+2(x+y)`, `(3+2)(x+y)`, `5(x+y)`, `5x+5y`.
All three moves compile through existing v2 algebra proof/presentation owners.
No math engine, native compositor, timing, focus treatment or clock change.

Host work was necessary: the browser previously imported the primary source
regardless of the server's selected content. It now compiles the checked source
embedded in the page, with no fallback if that data is absent or invalid. The
bounded `whole-and-parts` variant is explicit; unknown/repeated variants fail.
Question links preserve the variant and revision; custom editor drafts retain
their existing reapply-on-reload boundary. The original five-state example and
its Apply, downloads, practice and exact-return behavior remain intact.

Inspection also found that the older algebra scaffold places prose below the
equation. Six opt-in style lines and one renderer option put it above only for
this exemplar, including its smaller questions and newly applied drafts. Font,
color and native math conventions are inherited. The text area can grow; this
is a local application of the accepted top-text convention, not a rollout of
new scaffold defaults. Desktop and 390px screenshots were inspected; the card
fits within an 844px viewport and does not overflow horizontally. This does not
certify all viewport sizes, enlarged text or human comprehension.

Checks executed:

- Actual `author:check` for the selected source: four checkpoints/three moves.
- Five focused tests for selected source, primary preservation, rejected unequal
  groups and lost contributions, existing session, sequence and publication.
- `npm run visual:algebra-whole-and-parts`: three Chromium tests pass. Real native
  transitions and reversible intermediate poses, exact source/revision, direct
  smaller-question link/return, reduced-motion keyboard, phone containment,
  no-script reading and malformed embedded-source rejection.
- `npm run visual:composed-algebra -- --grep 'both extended sources download|extended practice restores'`:
  two original/transfer preservation checks pass.
- Full `npm run typecheck`, `npm run check:architecture` and
  `npm run build:bundle` pass. Generated reachability is current. Existing large
  application-chunk build warnings remain; no budget limit was changed.

The initial browser test failed because its query-only `page.goto` was resolved
against Playwright's root base URL, not the current experiment path. The test now
uses the correct absolute route; all three checks were rerun and passed. That
failure was in the test navigation, not the source link emitted by the page.
The full unit corpus and multi-browser visual certification are intentionally
not rerun for this pre-review exemplar. Static and mathematical preservation
are evidence; they do not certify that the explanation is worth using.

HUMAN_CHECKPOINT: is it useful to track the whole group before opening it, and
does the top-text presentation make that distinction easy to follow? No further
polish, second caller or promotion until that judgment. Resume with
`theseus work resume`; accept/revise this candidate before the visual-review
slice can be complete. The implementation commit is its rollback unit.
