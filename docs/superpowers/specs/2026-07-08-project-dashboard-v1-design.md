# Project Dashboard V1 Write Protocol

## Purpose

The project dashboard is the shared project-state surface for the user and
Codex. V1 is intentionally local and source-backed: it should make priorities,
blockers, object galleries, report-card themes, and completion status visible
without adding a persistence system before the data shape is understood.

## Source Of Truth

The canonical V1 data source is `src/project-dashboard/data.ts`.

Codex updates that typed seed data when work completes, priorities change,
blockers appear or clear, report-card evidence is added, or gallery entries gain
new interfaces. The browser view reads this data and can filter it, but browser
edits are not persisted in V1.

## Update Cadence

Codex should update dashboard data at the same checkpoint where it commits a
phase:

1. Mark the completed work card or child card `done`.
2. Refresh the parent card status if the aggregate state changed.
3. Add or clear blockers based on the new project state.
4. Add report-card evidence, risks, or next actions when the work changes a
   theme assessment.
5. Add gallery entries or interface notes when a new object, visual, animation,
   or protocol surface becomes inspectable.
6. Run the dashboard tests before committing the phase.

If the user reprioritizes work, Codex should update priorities, tags, statuses,
and blockers in the same source file before continuing.

## Browser Behavior

The dashboard view may expose controls for search, filtering, previewing, and
testing object cards. In V1 these controls are read-only with respect to the
repository. Any browser-side draft or interaction state should be treated as
temporary until a later persistent writer exists.

## Deferred Persistent Editing

The migration path is:

1. Keep typed seed data as the source of truth while the schema is changing.
2. Move the shared records into structured docs or JSON once the schema is
   stable enough to be authored by humans and tools.
3. Add a repository write protocol that validates edits, updates structured
   records, and produces reviewable diffs.
4. Add browser editing only after writeback can preserve provenance, validation,
   and commit boundaries.

V1 should not silently write from the browser to the filesystem.
