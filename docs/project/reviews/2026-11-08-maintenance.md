# Root tooling and CSS maintenance evidence

Approved scope: [maintenance proposal](2026-11-08-next-step-review.md).
Execution status and remaining work: `run-contract.kp.maintenance-20261108`.
This file records evidence, not a second execution queue.

## Playwright configuration ownership

Moved 64 specialized configs into `config/playwright/`; the conventional root
config remains. Updated package commands and impact-selection consumers.
Inherited paths and server working directories retain the repository as owner.
No editor checkout, URL, suite selection or browser coverage was changed.

The installed Playwright resolver and file collector captured all 65 configurations
and 152 projects before relocation. `npm run check:playwright-configs` matched
the resolved baseline after relocation. Its first comparison exposed property
insertion order in the measurement, not changed values: explicit `cwd` appeared
earlier in server objects. Normalizing that field restored the original hashes.
After the original baseline passed, canonical object-key ordering was introduced
and the encoding regenerated to prevent equivalent object ordering from causing
false failures. This is a measurement repair, not a behavior exception.

`npm run test:tooling-configs` passed two ownership/reference checks. Node tooling
typechecking and `git diff --check` passed. All 27 impact-selector tests passed.
`npm run visual:anchored-algebra -- --project=firefox` passed all eight tests
across Chromium and Firefox, including initial/reloaded paint, reversible
annotation handoff, missing-selector repair and old-link/static reading. The
optional dev-review API on port 8001 was unavailable; its proxy warnings did not
prevent the reader checks. No review-service availability is claimed.

## Vite configuration ownership

Moved 12 specialized configs into `config/vite/`, keeping `vite.config.ts` at
root. Updated package commands, capture tools, impact selection, application
entry ownership and compiler input references. Project-root derivation explicitly
accounts for the new config directory; output and route paths are unchanged.

`npm run check:vite-configs` passed all 13 configurations in serve and build
modes against the pre-move declaration/input baseline. This checks declarations
and existing input paths; it does not claim that serializing a plugin hook proves
its execution. The real `build:matrix-column` and `build:public-normal-matrices`
commands both passed, including the latter's generated reading and production
erasure plugin. The complete Playwright configuration comparison still passed.

The focused tooling/helper/entry-owner/impact suite initially found one remaining
test assertion tied to the old public-config prefix. Its ownership expectation
was migrated to `config/vite/vite.public-`; the full 42-test command then passed.
Node tooling typechecking and `git diff --check` passed. No application or
editor-interface implementation changed.

## TypeScript configuration ownership

Moved 11 specialized compiler configs into `config/typescript/`. Root
`tsconfig.json` remains the solution entrypoint and `tsconfig.base.json` remains
shared policy for protocols/domains/providers. Migrated package commands,
measurement tools, cohort metadata and active fixtures without changing any
cost ceiling or fixture membership. Custom TypeScript API callers now parse
relative to the selected configuration's directory instead of assuming the
current working directory owns every config.

The complete-input preflight caught an explicit eigenvector compiler reference
to a moved Playwright file that the first migration missed. It was corrected
before capturing the TypeScript baseline; the eigenvector typecheck passed.
The new configuration guard checks every explicit input/reference for existence,
so that consumer class cannot silently disappear from future moves.

All 13 config documents parsed successfully; the before/after comparison
matched complete no-emit options, compiler inputs and project references.
The full application/Node/test/Svelte/domain typecheck passed, with zero Svelte
errors or warnings. A cohort test initially exposed another CWD-based parser;
all remaining measurement/cohort callers were repaired and the full focused
44-test command passed. `check:inference` passed unchanged ceilings: core
116,885 types / 200,009 instantiations; combined 180,374 / 305,022.
Measurement JSON changes only rename project paths; measured costs are preserved.

## Repeated configuration setup and worktree discovery

Twenty-four configurations now use one typed desktop-device helper, retaining
explicit browser selections at every suite. The original resolved policy and
discovery hashes passed after this extraction, before the discovery repair.
Suite ports, trace settings, timeouts, server ownership and output paths remain
local; the existing Vite helpers already own their useful shared setup.

The baseline exposed a pre-existing bug: `**/.worktrees/**` ignored the current
checkout's ancestor as well as nested checkouts. Three declarations affected
41 inherited/standalone configurations; 122 of 152 project configurations had
zero discovered files here. Anchoring the exclusion to this checkout restores
those projects; the base discovers 258 browser-spec files. A before/after
comparison of complete resolved objects proved the only policy difference was
this exclusion. Every project now discovers files. No omitted test is counted
as an executed browser pass.

The durable guard exercises Playwright's real file matcher with current and
nested-worktree paths, including a simulated checkout with a `.worktrees`
ancestor. It rejects an empty project. The baseline now hashes configuration
policy only: ordinary test additions must not require approval or refresh.
Detailed discovery remains available for future migration comparisons. This
is an explicit correction of the initial migration-only snapshot, not a waiver
of missing coverage.

`check:playwright-configs`, all four tooling ownership tests and the eigenvector
compiler cohort passed. `visual:tooling-configs -- --project=firefox` passed
12 real route-mount tests across Chromium and Firefox. The maintenance work
has moved 87 specialized root configs and added the `config/` owner: 120 tracked
root entries become 34, with four conventional config entrypoints retained.
