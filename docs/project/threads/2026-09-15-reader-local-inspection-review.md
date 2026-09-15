# Local inspection access: visual checkpoint

Desktop access approved on September 15. Phone treatment remains provisional by
explicit user direction; its review does not block the approved desktop pressure
and integration work. Keep the candidate URL below for phone experimentation;
do not interpret desktop approval as mobile or LAN-exposure approval.

Desktop local access is now the default on the base URL. Use
`derivation-access=off` for the earlier no-entry comparison; `derivation-access=local`
still explicitly opts into the provisional phone layout. Server binding remains
localhost-only.

The committed long-prose fixture reuses the same four permanent states with
unequal explanation lengths. It verifies selecting a nearby transition while
the previous handle is offscreen, held-position restoration, justification,
and provenance return after resizing. This tests document geometry, not authoring
arbitrary-length reasoning or new mathematical operations.

Do not overstate reachability: entries sit at transition boundaries, not at
every point within long prose. Restoring a held pose preserves its document-based
lens position; this is not a guarantee that the restored lens is in the viewport.
A viewport-local inspection or additional local transport would be a separate
interaction decision, not something these tests silently certify.

Production closure after local-access integration: 34,029 initial and 136,898
activated JS/CSS gzip bytes, +1,244 versus the previous 32,785/135,654 baseline.
Additional activation remains 102,869 bytes. Measured with the committed closure
command after `build:bundle`; excludes HTML, fonts, images, network overhead and
CPU/paint cost. No new dependencies or semantic renderer changes.

Scope: reader.l1 in [the approved delivery proposal](../reviews/2026-09-15-next-step-review.md).
Live package status and evidence belong only to
`run-contract.kp.reader-local-inspection-v1`.

## Review

Shared server candidate:
<http://localhost:8000/experiments/mechanics-relations/?derivation-access=local#energy-from-momentum>

Accepted baseline, now default:
<http://localhost:8000/experiments/mechanics-relations/#energy-from-momentum>

On desktop, use **Inspect 2 → 3** to bring the vertical lens to that transition.
Scrub partway, inspect another transition, then return: the previous pose should
be held, without autoplay. **Restart** explicitly returns that transition to its
source. Selecting an adjacent source retains the chosen transition's identity,
not the preceding transition's endpoint explanation.

At a phone-width viewport (520px or narrower), prose receives normal reading
width. Inspect opens a labeled local working equation above the explanation.
The horizontal control and Back/Forward buttons inspect the same canonical
transition; Done returns to reading without discarding held progress. There is
no gesture listener on the prose or page. Switching local areas preserves the
chosen entry's viewport offset when the old area closes above it.

Human judgments requested: Are nearby entries discoverable without making the
record busy? Is the explicit phone inspection area preferable to the cramped
side lane? Does the working equation read as an inspection rather than a
competing statement? The local-area handoff is provisional; tests cannot answer
these questions or establish a learning benefit.

## Ownership and preservation

The canonical article is `examples/physics/momentum-energy.article.md`, hosted
by the mechanics-relations experiment. Its checked physics derivation and
authoring pipeline still supply all three moves to the native KaTeX session.
No domain source, semantic operation, compositor motif or renderer was changed.
One existing playback clock remains the sole live playhead. The small
revision-bound bookmark adapter stores inactive positions, rejects stale or
unknown transitions and never infers meaning from document distances.

Desktop keeps the accepted contextual carry/docking. Phone inspection keeps a
fixed local stage, with the same algebra and emphasis projection; its labeled
native endpoints do not overlay the permanent record. Layout is measured on
entry, scene mount and reflow, not on every scrub sample. Static states and
prose remain authoritative; added controls are enhancement-only and omitted
from print. No global navigation/salience store or new dependency was added.

Rollback: default adoption is separate from the local-access/mobile commit.
Removing `derivation-access=local` restores the accepted baseline without a
semantic rollback. Explicit older comparisons remain `derivation-motion=participants`,
`derivation-motion=equation`, `derivation-emphasis=contrast` and
`derivation-provenance=off`.

## Evidence and limits

Repeatable checks: `node --disable-warning=ExperimentalWarning --test tests/momentum-energy.test.ts`,
`npm run typecheck`, and `npm run visual:mechanics-relations`.
The browser harness captures desktop and phone candidates and exercises local
entry, bookmark/restart identity, latest-request handoff, keyboard access,
scroll independence, static text selection, stale-revision rejection, reverse,
native ownership, print and existing provenance/return behavior. Actual outcomes
are recorded in Theseus; screenshots are disposable harness outputs, not goldens.

This is reader-engine work, not evidence of source-only authoring reuse. The
bookmarks are same-mounted-document only, not reload persistence or cross-document
history. The original three-move derivation is still the only semantic chain.
Desktop long-prose/offscreen-knob pressure and reflow/return stress now pass,
along with full types/build, 21 unit checks, 19 Chromium checks and a 15-check
representative Chromium/Firefox/WebKit cohort. An initial Chromium run exposed
an offscreen pointer-start assumption in the test helper; the repaired full run
passes. These are executable checks, not a learning-outcome study.
The phone capture remains desktop emulation, not real-device touch or Safari
certification. No broader mobile/layout or catalogue promotion is implied.

Eligible desktop work is finished; phone review remains deferred under the
continuation amendment. Do not start later repertoire/semantic loops or resume
deferred v2 under this approval. Retrieve the parked run explicitly with
`npm run theseus -- work context run-contract.kp.reader-local-inspection-v1 --mode brief`.
