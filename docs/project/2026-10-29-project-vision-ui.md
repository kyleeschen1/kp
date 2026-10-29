# Project vision UI

Date: 2026-10-29
Status: first bounded view requested; appearance awaits review

## Why this exists

The user is discouraged by repeatedly starting improvements without a visible
end, and asks to formalize a UI for a longer, revisable vision across the project.
The UI must make commitments and closure visible. A change of direction must
retain what was previously intended and explain its disposition.

The existing project dashboard has useful discovery and references but contains
manually maintained active work from historical plans. Its current data must not
be treated as a live commitment queue. The October 29 source review also found
that the generic delivery workflow summary still names the September reader
priority. This is concrete evidence of record drift, not proof that every record
is stale. The vision view should name its sources and review date explicitly.

The longer product direction remains co-creative mathematical practice. The
architecture repair roadmap is a proposed enabling campaign, not a replacement
for that product direction. Building this view does not authorize that campaign.

## First view and ownership

Canonical host: the existing project dashboard at `/?view=dashboard#project-vision`.
Renderer: its existing HTML application, with a scoped vision component.
Strategic authority: the roadmap, accepted decisions and their linked evidence.
The vision record is a compact projection of those sources; it does not own
Theseus task/run status or supersede mathematical or visual acceptance records.

Show a north star, one recommended finite next outcome, a small map of project
areas, detailed finish conditions and evidence, and a revision history. Separate
the horizon from a committed execution plan. Label recommendations as proposals;
show completed local outcomes at their actual scope, without implying that a
whole area is finished. Avoid estimated percentage completion of the project.

Initial areas: architecture and retirement; authoring; semantic representations;
reader experience; personal practice; experimental learning and the workbench.
Not all areas are active. Cross-cutting architecture work must point to the
product outcome it enables. Future ideas stay visible without joining the queue.

Use native links and disclosure controls so the first view is useful without a
new interaction framework. Records are changed through reviewed repository edits
in this version. Do not imply that browser edits persist or that static sources
are a live agent monitor. Link the old dashboard as a historical/discovery
surface and flag its manually maintained work statuses.

## Discipline

- Define a milestone by a capability the user can exercise, an observable finish
  condition, evidence, and exclusions. A broad area such as architecture never
  becomes one endless task.
- Keep one primary delivery commitment at a time by default. Preserve other
  areas as horizons or parked work. Explicitly approved independent work can
  coexist; do not create parallel commitments merely because the UI has rows.
- A new idea is capture until selected. Changing the active commitment must
  record what happens to the displaced one: completed, paused, superseded, or
  dropped, with a reason and any retained result.
- Changes to a finish condition are revisions. Preserve the previous condition
  and why it changed. An expanded condition must not erase the completion of
  an earlier accepted milestone; create a successor instead.
- Distinguish source evidence, automated verification, human acceptance and
  product usefulness. Unknown or stale evidence must remain visible as such.
- At each delivery handoff, update the outcome evidence and next action. Review
  the whole map after a completed milestone or a change of direction; use a
  weekly review when actively working. No scheduled automation is created here.
- Theseus remains execution authority. Source-linked vision records describe
  direction and outcomes; never copy per-slice execution progress into a second
  manually maintained queue.

## Bounded delivery contract

Outcome: the user can open the existing dashboard, understand the long-term
direction and the next finite outcomes, inspect the supporting sources and see
what changed without reading the planning corpus.

One package: source-backed vision data, constrained model, scoped renderer/style,
integration, focused invariants and a desktop/phone visual smoke check. Stop for
review of this view. No broad dashboard migration, backend editing, scheduler,
universal object model, architecture campaign or lesson/animation changes.

Preserve the accepted fractional reader and existing dashboard discovery,
selection and editor return. The rollback unit is the vision view and its
integration; all existing rendering and semantic owners remain unchanged.

Use a 75-minute ceiling, with 15 reserved for verification, evidence and backup.
Inspect impact before verification. Use focused source/evidence/closure checks,
affected TypeScript checks, and `npm run visual:project-vision` for the canonical
view. Do not build a broad cross-browser certification matrix before acceptance.

Completion means the view is implemented, source/evidence invariants pass,
desktop and phone are inspectable, existing integration smoke checks pass, and
the work is committed and backed up. This establishes review readiness, not
universal visual acceptance or automatic future upkeep.

## First-view evidence

The existing dashboard now renders a scoped vision view before its historical
catalogue. Six areas have a destination, current evidence, a proposed finite
outcome, finish conditions and exclusions. One is recommended next. Two completed
local outcomes remain visible separately. Direction changes show previous and
new intent, rationale and source. All current implementation proposals remain
proposals; no architecture repair was started.

`vision-data.ts` is the source-linked snapshot, not a live task monitor. The
validator rejects missing finish conditions/exclusions, duplicate identities,
unsafe source paths, missing pivot rationale, invalid chronology, and zero or
multiple next recommendations. Tests verify that referenced evidence files
exist. A seven-day age notice requests review; it does not schedule or perform
one. These checks cannot establish that a rationale is sound or that recorded
acceptance is truthful. Those remain review responsibilities.

Repository instructions now require reconciling this view at direction changes
and milestone handoffs. The old dashboard completion rule was corrected to keep
execution in Theseus rather than updating a second manual task queue. Existing
catalogue content remains available with an explicit historical-status notice.

Verification:

- `npm run test:project-vision`: 67 tests passed, including existing dashboard
  rendering, search/discovery and contract checks.
- `npm run typecheck`: all application, Node, test, Svelte and domain checks
  passed. `npm run typecheck:tests` passed again after extending browser checks.
- `npm run visual:project-vision`: Chromium desktop 1280×900 and phone 390×844
  passed keyboard disclosure, evidence links, change history, reload, catalogue
  search and editor return. Both dark and light modes pass sampled realized
  text contrast checks and have inspectable captures.
- Initial screenshots revealed dark-on-dark headings despite passing interaction
  checks. The view now consumes the existing development theme tokens; realized
  contrast checks protect that observed failure class. No lesson theme changed.
- `npm run check:dependency-direction` passed. The generated equation graph was
  initially stale only because five new TypeScript files changed its scanned
  file count from 5,132 to 5,137. Regeneration changed that single count; all 68
  roots remained unchanged. `npm run check:equation-reachability` and its 12-test
  caller/reachability suite then passed.
- Theseus workspace validation and diff whitespace checks passed. The impact
  selector had no focused rule for this UI and suggested generic broad gates;
  this unpromoted view used the declared focused verification and full types.
  A production build and broad cross-browser release matrix were not run.

The four new runtime source/style files total 23,826 source bytes, not compressed
shipping size. They add no dependency, timer, geometry observer or animation
path. Vision styling loads with the existing lazy dashboard capability; the
reader stays unchanged. No runtime speedup or measured bundle delta is claimed.

Review `http://localhost:8000/?view=dashboard#project-vision`. Expand Architecture
to inspect its finish line and exclusions; open “What changed, and why”; then
look at the scoped completions. Judge whether the relationship between the long
vision, the next finite outcome and what is already finished is easy to grasp.
The first view is ready for that review; broad workbench expansion remains deferred.
