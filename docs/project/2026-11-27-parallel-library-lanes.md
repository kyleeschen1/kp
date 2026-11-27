# Three independently runnable library lanes

Date: 2026-11-27
Authority: user approved the preceding three-lane recommendation with “go”.
Target: `task.kp.parallel-library-lanes-20261127`.
Execution: `run-contract.kp.parallel-library-lanes-20261127`.

## Outcome and preservation

An interface developer can run, test and change interaction primitives,
mathematical objects or an existing animation player without starting the KP
notebook. Three workers can own these paths concurrently. One integrator owns
shared boundaries and the combined product checkout.

This implements separation in the existing repository, not independent releases.
Preserve the accepted notebook/chat, original fraction scrolling, native semantic
and mathematical owners, saved documents and existing graph experiments. No
automatic LLM edits, broad Vim work, general persistence framework, renderer
replacement, new scrolling treatment or publication is included.

The earlier section-clipping run stays deferred for its named visual judgment.
Its result is not promoted by this work. The reusable-stage proposal is advanced
only as the narrow player lab below; wider article/card authoring remains separate.

## Boundaries and fixtures

| Lane | Canonical artifact and host | Semantic/rendering authority | Finish |
| --- | --- | --- | --- |
| Interaction | `apps/interaction-lab`, localhost:8011 | Existing command registry and row model/matcher; scoped DOM picker | Commands and resource rows run without notebook/chat imports; five visible results, selection, filters and lifecycle tested |
| Mathematics | `apps/mathematics-lab`, localhost:8012 | Existing typed matrix arithmetic and semantic-state derivation; native KaTeX/Graph2D projection | Persistent 2×2 matrix/vector objects, dependent result, recoverable drafts and local views work independently |
| Player | `apps/player-lab`, localhost:8013 | Existing saddle asset, domain evaluator, graph projection, retained GPU pipeline and playback clock | Same animation mounts at article/card sizes with independent progress, seek/reverse and disposal |

The labs are engineering fixtures. New fixture controls are reviewable; this
does not approve a new product visual language or catalogue-wide promotion.
The rollback unit is each lane's implementation/test commit, followed by the
integrator's shared wiring/ownership commit. Shared pipeline extraction must
retain the old experiment's exports and behavior.

## Worker packets and ownership

All workers start at `d81271189e449650a291eebf70a4bd9bfd94895f`.
Worktrees are under `/Users/kyleeschen/Code/kp/.worktrees/`:

| Owner | Worktree / branch | Owned paths |
| --- | --- | --- |
| interaction | `interaction-lane`; `feature/20261127-interaction-lane` | `src/interaction/`, `src/editor-commands/`, `src/editor-rows/`, `apps/interaction-lab/`, lane-specific tests/types |
| mathematics | `mathematics-lane`; `feature/20261127-mathematics-lane` | `src/math-resources/`, `apps/mathematics-lab/`, lane-specific tests/types |
| player | `player-lane`; `feature/20261127-player-lane` | `src/animation-player/`, `apps/player-lab/`, lane-specific tests/types; existing direct-WebGL renderer/model/shader extraction adapters only |
| integrator | `kp-product`; `feature/20261031-annotation-reader` | Root scripts/dependencies, architecture policy, shared browser checks, source-linked direction, Theseus, integration |

Each lane exposes `src/<lane>/public-api.ts`, a local README and application
package scripts `dev`, `build`, `test`, `typecheck`. No new dependency is planned.
Commands/resources retain their existing identities; workers do not invent a
cross-domain universal schema. Request shared changes from the integrator.

Each checkout has its own copied dependency installation, no writable shared
node_modules symlink. Preview ports are strict and distinct. Fixtures use their
own storage keys; ports supply separate browser origins. Workers never stop the
product service. No independent worker edits Theseus or strategic sources.

Workers hand off committed changes, checks, API and limitations to the integrator.
Integrate by cherry-pick onto the feature branch after diff review; do not later
merge the same worker commits. No main/dev merge, force push or branch deletion.
Normal same-name feature backups follow standing authorization.

## Delivery and checks

Five outcome slices: ownership/setup; interaction fixture; mathematical fixture;
player fixture; combined verification and handoff. The three fixture slices can
run concurrently after their scope packets. Theseus alone records live status.

Use scoped unit/type checks and each standalone production build. Add executable
import-closure checks that reject notebook/chat/experiment dependencies in new
library entrypoints. Repair the observed ownership/inversion failures through
responsible classifications, not broad exceptions. The existing portable-public
entrypoint gate must still pass. Inspect impact before choosing integration checks.

One stable `npm run visual:library-lanes` command verifies the three independent
hosts and representative interactions. Reuse original graph/browser checks if
the retained renderer moves. Recheck notebook types and existing commands/math
to preserve consumers. Record initial failures and precise reruns. Architecture
checks must pass before claiming enforced boundaries.

Ceiling: one bounded development session of up to four hours, reserving its final
45 minutes for integration/verification/backup. Checkpoint each coherent verified
lane and shared integration; back up at least hourly and before handoff. Stop for
completion, required new visual judgment, or a genuine external blocker. Do not
expand into another family/framework to fill time.

Completion means all three fixtures build/run/test independently, documented
entrypoints and ownership exist, forbidden imports are guarded, combined checks
pass, branches are backed up, and concrete review URLs/commands are supplied.
Human review of the lab interaction remains distinct from programmatic boundary
acceptance; no existing pending visual gate is waived.
