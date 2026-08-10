# Repository Agent Instructions

## Collaboration tone experiment

Use a candid, welcoming, and encouraging tone when discussing this project.
Name genuine progress and the next tractable direction so unresolved design
work does not read as project failure. Be equally direct about uncertainty,
cost, limitations, and blockers; do not hype the project, flatter the user,
minimize risks, or manufacture certainty. Distinguish a hard or unfinished
design problem from evidence against the project thesis. This is a reviewable
collaboration experiment, not a learner-facing editorial voice standard.

## Repo-local scratch tooling

- Put throwaway scripts, screenshots, reports, and other investigation artifacts under `tmp/codex/` instead of an OS-level temporary directory.
- Keep `tmp/codex/` gitignored, and delete scratch artifacts when the investigation or work slice ends.
- Promote a scratch script into `scripts/` or `tests/` when it becomes repeatable validation, is used by more than one slice, or documents behavior worth preserving.
- Use an OS-level temporary directory only when a tool technically requires it; filesystem escalation must not be introduced merely to store disposable tooling.
- Durable Theseus evidence should cite committed commands or tests, not ephemeral scratch paths.

## Visual check commands

- Put browser-driving visual checks in a repo-owned `scripts/` or `tests/` entrypoint and expose them through a stable, scope-specific `npm run visual:<scope>` command.
- Do not execute changing `tmp/codex/` Node scripts for visual checks that require browser or filesystem approval. `tmp/codex/` may hold their disposable screenshots and reports.
- Reuse the approved scoped npm command throughout a long loop. Extend its committed entrypoint when later slices need new captures instead of requesting approval for each scratch filename.
- Keep visual outputs disposable unless the repository explicitly adopts them as reviewed goldens; durable evidence should cite the stable npm command and its observable checkpoints.

## Codex execution reliability

- Prefer direct commands that can match audited execution rules. Do not add `zsh -lc`, environment assignments, pipes, redirection, substitutions, or wrapper scripts when the same check has a direct invocation.
- Do not request or accumulate blanket approval for `node`, shell interpreters, changing `tmp/codex/` filenames, destructive Git commands, or deletion commands. Promote recurring checks into a committed `scripts/` or `tests/` entrypoint and expose them through a stable `npm run` command.
- During an active Theseus run, derive the progress counter with `npm run --silent loop:status` when available and emit it at slice starts, completions, commit boundaries, and before a stop or final response.
- Before finalizing an approved run, check durable progress again. Continue while an approved slice remains unless a named contract stop condition fired; otherwise report one explicit outcome: `COMPLETE`, `HUMAN_CHECKPOINT`, `STOP_CONDITION`, `BLOCKED`, `USER_PAUSED`, `CONTRACT_EXHAUSTED`, or `SESSION_INTERRUPTED`.

## Exemplar-first collaboration

Apply this protocol to subjective visual, motion, interaction, and LLM-generated-output work. Do not add its review ceremony to objective maintenance or exact bug fixes with deterministic acceptance tests.

- Respect the requested mode boundary. A request to diagnose, compare, explain, or plan does not authorize implementation.
- Before broad implementation, name the canonical reference, observable acceptance criteria, preservation boundary, and smallest independently reversible rollback unit.
- Perfect one representative exemplar and stop for visual review before generalizing across families, unless the user explicitly approves the generalization in advance or waives the checkpoint.
- Compare the current behavior, canonical behavior, and proposed behavior phase by phase when diagnosing a visual regression.
- Preserve semantic models and authoring contracts when the defect is limited to presentation; do not broaden a visual rollback into an architectural rollback without evidence.
- Treat “formalize this” and “enforce this globally” as separate decisions. Record a principle without making it universal unless global enforcement is explicitly approved.
- In grill-me sessions, batch low-impact decisions behind recommended defaults and interrupt only for choices that materially affect architecture, product behavior, or aesthetics.
- Visual run contracts must identify their exemplar checkpoint, promotion criteria, preservation boundary, rollback unit, and post-approval generalization slices.

## Visual discovery and test timing

Use a hybrid verification cadence for subjective visual work. Do not build a
full certification matrix for an aesthetic treatment that has not passed its
canonical human checkpoint.

- Test durable truth first: semantic correctness, typed authority, lifecycle
  and paint ownership, deterministic clocks, native endpoints, accessibility,
  and previously observed regressions.
- During visual discovery, build one reversible exemplar with only the
  smallest smoke and preservation checks needed to keep the spike inside the
  existing architecture.
- Let human review select choreography, timing, shape, emphasis, and visual
  language before encoding those choices as reusable contracts.
- After approval, add motif-specific regression checks, pressure the motif
  with one structurally different caller, then run the expensive responsive
  and cross-browser release matrix.
- A visual spike does not authorize a shared type family, general renderer
  seam, catalog-wide rollout, or compatibility migration. Promote those only
  when the approved exemplar and second caller demonstrate the boundary.
- Prefer cheap unit and single-exemplar checks during discovery. Reserve dense
  sampling, complete browser matrices, and broad product regression for
  promotion and release boundaries.

## Semantic visual salience

Use `.agents/skills/kp-visual-salience/SKILL.md` for salience, focus,
highlighting, ghosting, cross-view attention, renderer adapters, or promotion
of an attention motif.

- Author instructional intent against stable semantic entity, group, beat, and
  correspondence IDs before choosing a visual treatment.
- Reuse the semantic scene, salience-plan, reader-focus, attention-projector,
  and cross-view seams already responsible for the behavior; do not create a
  parallel global salience store.
- Keep identity, salience, presence, and historical or prospective trace role
  separate. Absence is a presence decision, not a low-salience style.
- Project state deterministically from the semantic playhead so replay,
  reverse, interruption, URL restoration, and TOC jumps reach the same state
  without replaying intermediate motion.
- Resolve target and context together at scene level, then let DOM, KaTeX, SVG,
  Canvas, and WebGL adapters express that hierarchy in medium-specific ways.
- Keep required instructional information legible and accessible when it is
  contextual. Prefer paint-only focus changes and avoid layout-affecting
  emphasis.
- Treat exact colors, fonts, opacity thresholds, stroke ratios, durations, and
  material curves as provisional until a canonical exemplar passes human
  review. Pressure-test one structurally different caller before promotion.
- Preserve semantic and authoring contracts when correcting presentation; a
  visual fix does not authorize a catalogue-wide abstraction or migration.

## Plan and execution ownership

- Keep one human-readable plan and one executable control record. For a
  Theseus-backed long loop, the reviewed proposal in `docs/project/` owns the
  rationale and approved scope; the Theseus run contract owns slice order,
  live status, verification evidence, and stop state.
- Do not copy a Theseus-backed plan into `docs/superpowers/plans/` or another
  manually maintained phase-plan tree unless the user explicitly requests a
  separate artifact. The reviewed proposal should be the run contract's source
  reference.
- Roadmaps, threads, and next-action summaries may link to and summarize the
  plan, but must not duplicate its full slice table or track per-slice status.
- After approval, update execution progress only through Theseus. Update
  project memory when direction, priority, or durable conclusions change, not
  after every slice.
