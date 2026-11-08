# Consolidation with limited human-review availability

Date: 2026-11-08
Status: scoped recommendation; implementation has not started
Baseline: `54a85708cd42520645fd39db6c0d769fea6943c4`

## Outcome and current direction

The user wants to use a day with little availability for human checks to improve
directory organization, consolidate ownership and eliminate redundancy, including
CSS. Recommend the already identified finite algebra style-ownership conversion
as the first maintenance outcome. The beneficiary is the next author: reuse an
algebra presentation without importing another explanation's private styles.
The broader explanation/joint-attention goal remains unchanged.

The integrated annotation reader retains its pending visual judgment and current
implementation. Maintenance can preserve that candidate without promoting it.
No new execution contract, new visual treatment, renderer migration, workbench
change, branch cleanup or broad file move is authorized by this discussion.

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
| Algebra style ownership | Removes demonstrated cross-example dependencies for existing callers. | Cascade, geometry and native paint can change accidentally; preserve and compare them automatically. | First bounded conversion. |
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
The user is choosing what this work should look like, not yet starting an
unattended implementation run.

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
