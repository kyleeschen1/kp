# Consolidation with limited human-review availability

Date: 2026-11-08
Status: approved maintenance delivery; execution belongs to Theseus
Baseline: `54a85708cd42520645fd39db6c0d769fea6943c4`

## Outcome and current direction

The user wants to use a day with little availability for human checks to improve
directory organization, consolidate ownership and eliminate redundancy, including
CSS. The subsequent clarification names the project root itself and the earlier
discussion of 96 CSS files, and confirms a parallel editor-interface session.
This refines the initial CSS-first recommendation: first consolidate the root's
tooling configuration, then use a complete CSS inventory to guide bounded owner
conversions, beginning with the demonstrated algebra dependency problem. The
broader explanation/joint-attention goal remains unchanged.

The integrated annotation reader retains its pending visual judgment and current
implementation. Maintenance can preserve that candidate without promoting it.
The subsequent user direction, "excellent. go as long as possible", approves
the described maintenance scope. Preserve the independent annotation-reader
contract and its visual checkpoint. No new visual treatment, renderer migration,
workbench change, branch cleanup or merge is included.

## Approved execution boundary

Execute in the existing product worktree from `d619aecff7bcdac7f8e9449830427dcb88d401c2`.
Use a six-hour ceiling with the final 45 minutes reserved for verification,
repairs and closeout; finish earlier when the approved outcomes are complete.
The required outcomes are root-config relocation (one reversible family per
checkpoint), evidence-backed setup consolidation, a full CSS ownership/duplication
inventory, and the bounded algebra style conversion below. No optional reserve
projects are admitted. Theseus contract `run-contract.kp.maintenance-20261108`
owns slice order, status, verification and stop state.

Objective acceptance is unchanged test/config discovery, commands, output paths,
reader URLs, domain truth and visual behavior. Capture baselines before moving
configuration or styles. Use focused tests routinely and full type/build plus
representative Chromium/Firefox preservation at the integration boundary. Add
guards at the responsible boundaries so root configs and cross-example CSS do
not silently accumulate again. Do not disable or weaken existing checks.

Do not wait for routine nonvisual approvals. If a proposed repair requires a
new visual/semantic decision, retain the previous behavior and continue only
independent approved work. Stop for completion, the ceiling, exhausted eligible
scope, or a genuine authority/external blocker. Preserve partial work as an
explicit checkpoint; never label unexecuted checks or deferred outcomes complete.

## Root clarification and proposed first outcome

At `492c114b42f576f9bdfe2f42c49d8a73c8bcfe83`, the product checkout has 120
tracked root entries. Of these, 65 are Playwright configurations, 13 are Vite
configurations and 13 are TypeScript configurations: 91 configuration files.
Counts exclude dependency installations, generated builds and ignored files.

Propose keeping the conventional root entrypoints and placing specialized
configurations under `config/playwright/`, `config/vite/` and
`config/typescript/`. Preserve command names and their behavior. Choose which
base configurations must remain at root from actual consumers/tool discovery;
do not retain a forwarding file for every moved config. Depending on those
exceptions, this should bring the tracked root entry count into roughly the
30–40 range without changing source-domain organization.

The move must repair imports, configuration-relative test paths, output paths,
TypeScript includes/references/cache paths, and Vite project-root calculation.
For example, `tsconfig.app.json` currently includes `src` relative to the root,
and scoped Vite configs derive the project root from their module URL. A raw
file move is not a correct migration. Update executable consumers and current
guidance; historical verification commands remain provenance at their commits.
After relocation is checked, consolidate genuinely repeated setup through the
existing base configs and helpers in a separate change. Retain suite-specific
test selection, browser coverage, ports and lifecycle behavior; fewer config
files alone is not evidence that those distinctions were redundant.

Finish when specialized config families have a discoverable home, all active
references resolve, equivalent tests and TypeScript inputs are discovered,
representative builds and browser checks pass, and normal dev commands still
serve the same URLs. Compare discovery and resolved configuration before/after;
do not run every visual suite merely to verify file relocation. Add a focused
placement guard to prevent new specialized root configs from accumulating.
Rollback unit: one config-family move with its complete consumer changes and
preservation evidence. Commit families independently.

Several similarly named top-level directories have a distinct purpose:
`experiments/`, `reader/`, `tutorials/`, `learn/` and `studio/` contain HTML
entrypoints (51 tracked files collectively), while `src/` contains the code.
`examples/` contains authored examples. Their names alone do not prove redundant
implementations. Preserve their routes in the first cleanup; broader page-entry
consolidation can follow a separate consumer inventory.

## CSS scope and counting rule

`git ls-files '*.css'` lists **124 tracked CSS files**, all under `src/`, in the
product checkout: tutorial 47, experiments 34, editor 16, reader 13, rendering 4,
and other owners 10. The original KP checkout at `87d3122d2cc2` has 123; these
are different revisions. The scope/baseline behind the earlier count of 96 has
not been recovered, so this is not a demonstrated increase of 28 equivalent
files. Generated/vendor files are not included in these tracked-source counts.

Inventory the complete set for owner, consumers, cascade dependencies and
duplicate declaration groups. This establishes the wider scope the user meant;
the algebra family remains the first demonstrated conversion, not the whole
CSS cleanup. Editor-owned styles remain outside this session's mutation scope.
Reduce accidental coupling and redundant implementations; file count alone is
not a completion metric or evidence of shipped CSS savings.

## Parallel ownership and handoff

The existing host record and current editor worktree list place the editor work
in `/Users/kyleeschen/Code/.worktrees/editor-workbench-20261030`, on
`feature/20261030-workbench-live-conversation`, in the separate `editor` repo.
That identifies the recorded lane, not an assertion that the other session
has acknowledged a new ownership agreement.

Proposed division:

- This session owns KP root-config organization and the selected non-editor CSS
  conversions, from `/Users/kyleeschen/Code/kp/.worktrees/kp-product` on
  `feature/20261031-annotation-reader`. It is the integration owner for its KP
  package scripts, configs and strategic-record changes.
- The parallel session owns editor/workbench interface behavior in its own
  checkout. Do not edit its repository or assume KP's `src/editor/` is available
  merely because the recorded application host is separate.
- Preserve the KP preview URL/port (`http://localhost:8011/`), route behavior,
  renderer/semantic contracts and normal command names. Any direct config-path
  consumer needs the migration map before the path is retired.
- Shared KP contracts/config edits requested by the editor session must be
  handed to the KP integration owner; this session likewise requests any editor
  integration change from that owner. A worktree is isolation, not an agreement
  about shared APIs or permission to merge.

Self-contained handoff for the other session:

> KP maintenance is being scoped in `.worktrees/kp-product`, branch
> `feature/20261031-annotation-reader`. Proposed ownership is root tooling-config
> relocation and non-editor CSS consolidation, preserving normal npm commands,
> the preview on port 8011 and existing reader/semantic behavior. Keep editor
> interface work in your checkout. Flag any KP root/config/shared-contract edits
> or direct config-path dependencies so one owner can integrate them. No changes
> to your checkout or automatic merge are planned.

No cross-session message was sent and no acknowledgement is claimed. The
proposal can be shared as the ownership handoff before implementation.

## Observed evidence

- `src/experiments/composed-algebra-intuition/entry.ts` and
  `src/experiments/distribute-collect/entry.ts` each import CSS from four other
  example directories: authoring-distribution-focus-card, reusable-reasoning,
  common-factor and composed-algebra.
- Common-factor and composed-algebra styles repeat reading typography, heading,
  hidden-panel, revision-code and working-textarea declarations under their own
  selectors. This is a consolidation candidate, not proof that all rules with
  the same value should share an owner.
- Consumers include `scripts/algebra-interactive-edition.ts`,
  `scripts/vite-authoring-structural-preview.ts`,
  `scripts/build-composed-algebra-edition.ts` and
  `scripts/build-common-factor-edition.ts`, as well as the originating examples.
  Preview HTML and edition assets must participate in a conversion.
- Existing reader/compiler/runtime/renderer boundaries already have a typed
  ownership model and import gate. The inspected
  `scripts/check-semantic-reader-boundaries.ts` collects TypeScript files; that
  gate alone does not establish stylesheet ownership. Economics already has
  focused stylesheet/cascade checks that provide a local precedent.
- At this baseline, `docs/project/roadmap.md` is 2,332 lines and `package.json`
  is 760 lines. Size alone does not establish redundancy. The roadmap mixes a
  current entrypoint with extensive historical direction; the command surface
  merits a discoverability review, not blind command removal.

This is a targeted source inspection, not a repository-wide duplication audit,
fresh visual comparison or measured bundle/performance improvement.

## Candidate priorities

| Candidate | Benefit | Risk / review need | Recommendation |
| --- | --- | --- | --- |
| Root tooling configuration | Removes the largest measured source of top-level clutter while preserving existing commands. | Relative paths and discovery must be preserved; coordinate shared configuration ownership. | First bounded outcome after root clarification. |
| Algebra style ownership | Removes demonstrated cross-example dependencies for existing callers. | Cascade, geometry and native paint can change accidentally; preserve and compare them automatically. | First CSS conversion after the complete CSS inventory. |
| Directory ownership | Makes shared machinery distinguishable from example composition. | Moving names without fixing imports creates churn. | Move only proven shared responsibilities needed by the conversion; migrate all callers and remove the old path. |
| Planning and command navigation | Reduces repeated context loading and makes the next task discoverable. | Historical references and tool entrypoints must remain usable. | Independent follow-up: a short roadmap entrypoint, retained linked history, and a compact guide to existing command families. |
| Global CSS or source-tree redesign | Could improve consistency eventually. | Broad cascade changes, unproved abstractions and large review surface. | Defer; use evidence from the first complete conversion. |

## First conversion and finish line

Inventory the full import and generated-asset consumer set before moving styles.
Separate shared presentation rules from local lesson adjustments using existing
responsible owners in the reader/rendering/tutorial boundaries. Preserve selector
specificity, source order, scoping, custom properties, font metrics and asset URLs
first. Consolidate actual duplicate rules only when their ownership and behavior
are shown to match. Do not introduce a global catch-all stylesheet or a new CSS
framework as part of this conversion.

Convert the complete caller set, including originating examples, previews and
edition builders. Retire superseded paths after import and generated-output
checks pass. Compatibility surfaces that must remain need a named consumer and
explicit reason; adding a new path while leaving the old implementation active
does not finish the conversion. Reuse or extend the responsible architecture
checks to prevent the selected cross-example dependencies from returning.

Done means the selected algebra family obtains shared styles from their owner,
local rules remain local, old cross-example imports are gone, emitted assets
resolve, and existing appearance and behavior are preserved. Keep the original
style-ownership finish line from the October 30 review; this adds consumer
evidence rather than expanding it into a repository-wide campaign.

Verification should compare before/after behavior at existing representative
checkpoints: native math geometry, prose/annotation layout, focus/hit targeting,
responsive layout and the previously observed Firefox restoration behavior.
Use stable scoped browser commands and focused import/build/type checks. Record
source duplication, dependencies and shipped CSS separately; fewer source files
or imports do not by themselves prove fewer shipped bytes or faster generation.

Rollback unit: the coherent style-owner extraction, all consumer migrations and
its guard together. Keep a separate recoverable commit for any subsequent
navigation cleanup. New typography, timing, layout defaults, salience treatment,
domain semantics and public authoring schemas stay outside this work.

## Human-review cadence

Behavior-preserving maintenance does not require a new aesthetic approval at
each checkpoint. Repair unexpected diffs against the baseline. If a discovery
requires choosing a different visible behavior or changing semantics, retain
the existing behavior and park that decision for later review; independently
approved maintenance can continue. Existing subjective checkpoints remain open.
The subsequent go authorizes this maintenance run; it does not accept the
integrated reader candidate's aesthetic treatment or expand editor ownership.

## Server recovery

The previous preview was launched as a tool-managed terminal process. On this
visit no process listened on port 8011; no retained exit log establishes its
exact termination cause. A shell-background restart did not remain running.
The successful restart launched Vite in a new process session with disconnected
input and log output retained under the product worktree's ignored `tmp/codex/`.
Inspection showed parent PID 1 and no terminal, and the reader returned HTTP 200.
This improves terminal independence, but does not provide automatic restart
after a crash or reboot. A stable start/status/stop interface and optional OS
supervision are separate operational improvements; no OS service was installed.

The live log is `tmp/codex/kp-product-dev-2026-11-08.log`; process/checkout metadata
is `tmp/codex/kp-product-dev.json`. Those are operational records for the current
process, not durable certification evidence. The temporary launcher was removed.

## Verification of this proposal update

`npm run test:project-vision` passed all 67 vision/dashboard checks, and
`git diff --check` passed. These validate the planning/vision update; the proposed
CSS conversion and its before/after preservation checks have not been executed.
