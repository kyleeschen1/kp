# Root tooling and CSS maintenance evidence

Approved scope: [maintenance proposal](2026-11-08-next-step-review.md).
Execution status and remaining work: `run-contract.kp.maintenance-20261108`.
This file records evidence, not a second execution queue.

Delivery result: the approved root/config and selected algebra style conversion
is complete in the KP product worktree, on `feature/20261031-annotation-reader`.
The root checkout and separate editor checkout were not modified by this run.
The integrated annotation reader remains a separate pending human judgment.

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

## Full CSS inventory

`npm run audit:css` inventories every working-tree stylesheet and literal
source/HTML/build consumer, retaining CSS import edges and conditional context.
The baseline is 124 files, 691,424 source bytes and 142 repeated multi-declaration
candidates. The [inventory review](2026-11-08-css-ownership.md) records complete
owner totals, selected consumers, limits and follow-up candidates. Editor files
were inspected read-only. No unused-file or shipped-payload claim is inferred.

The first audit invocation exceeded Node's default Git-output buffer because it
enumerated historical event files. The enumeration now requests active source
roots plus every CSS path directly, keeping the complete stylesheet cohort
without loading the historical corpus. The audit, parser boundary tests and
Node tooling typecheck passed.

## Algebra style ownership conversion

Canonical preservation reference: the existing distribute/collect lesson at
`/experiments/reusable-reasoning/?example=distribute-collect`, authored by
`src/authoring/examples/distribute-collect.json` and projected through the current
composed-card/native-equation pipeline. Seven existing callers, their previews
and static/interactive editions participate. No source, clock, semantic contract,
renderer, typography or layout treatment is replaced. Rollback unit: this owner
extraction, every consumer migration and its preservation guards together.

Retired all four private `style.css` paths. Native equation-card projection now
belongs to `src/rendering/authored-algebra-card.css`; reasoning presentation and
common-factor/composed reading styles belong to `src/reader/presentation/`.
The existing authored page/scaffold CSS is loaded explicitly before them.
`scripts/algebra-styles.ts` owns the ordered preview/edition lists; tests compare
all seven browser entries with those lists and reject retired-path consumers.

Common-factor and composed reading files remain separate because their initial
preview and standalone edition consumers differ. Combining their seven similar
rules would broaden the CSS loaded before enhancement or in static exports.
The composed text-first treatment stays scoped to its existing opt-in. Four
repeated gesture declarations in the reasoning/card-code owner were combined,
preserving each selector's specificity and complete declaration order.

`visual:algebra-styles -- --update-snapshots=all` captured the unchanged baseline;
`visual:algebra-styles` then compared 112 states: seven pages, two browsers, two
widths and four direct/reverse seeks. All 14 tests matched computed styles and
native geometry exactly. Captures are disposable, not reviewed pixel goldens.
The new explicit maintenance config adds one suite; the other 65 configuration
policy hashes remain unchanged. Its first harness attempts exposed a selection
intersection and the runner's default update mode; explicit scoped selection and
`=all` corrected the harness before any stylesheet edit.

`visual:algebra-mount -- --project=firefox` passed 18 existing checks across both
browsers, including reverse/interruption, native endpoints, remount, Apply/practice
and collapsed-layout recovery. Twenty focused ownership, packaging, CLI and
publication tests passed; Node/test typechecking passed. The edition cost test
also passed, including a new negative assertion for oversized manifest metadata.

### Costs and explicit budget amendment

| Measured cost | Before | After |
| --- | ---: | ---: |
| CSS source files | 124 | 124 |
| Selected CSS declarations | 112 | 108 |
| Complete CSS source bytes | 691,424 | 691,544 |
| Static edition CSS raw / per-file gzip | 58,371 / 13,878 | 58,371 / 13,878 |
| Interactive edition CSS raw / per-file gzip | 62,721 / 15,629 | 62,841 / 15,655 |
| Edition JS gzip, complete lazy closure | 374,346 | 374,346 |
| Authoring JS gzip, complete lazy closure | 406,568 | 406,568 |
| Interactive edition manifest bytes | 14,001 | 13,999 |

`npm run audit:css` and `npm run measure:algebra-editions` reproduce these cohorts.
Gzip sums are estimates, not measured network transfer. The host-ownership
comment and selector grouping add 120 source/CSS bytes; this is an
ownership repair, not a performance optimization. The static and interactive
editions retain respectively 72 and 116 files, including every font and asset.
The editor bundle's source-module count changes 459→460 because the existing
authored base is now an explicit CSS import; emitted JS bytes are identical.

The **pre-conversion** cost run failed because a 14,001-byte manifest exceeded
the 14,000-byte ceiling. Relocation brought it to 13,999, leaving only one byte
of headroom. Under standing engineering-budget repair authority, only
`manifestRaw` is amended **14,000→14,500**: 501 bytes of current headroom, about
3.6%. All JS and complete-edition payload ceilings stay unchanged. Removing
assets, shortening meaningful owner paths or changing immutable manifest format
solely to fit this metadata limit would hide cost or widen the change. Both
complete source variants and both edition modes remain measured; oversized
manifest rejection remains executable. This is a policy amendment, not savings.

### Existing diagnostic retained for follow-up

Firefox emitted `Reader timeline clock is disposed` during page teardown both
before and after this conversion. The stack points to the `visibilitychange`
callback in `src/experiments/composed-algebra/card.ts`. Assertions for the sampled
states and existing lifecycle checks passed; that does not clear this late
teardown error. Runtime lifecycle repair is outside this style/config conversion
and remains a source-linked follow-up, with an ordering regression needed before
claiming it fixed. No exception was hidden or converted into a passing assertion.

## Integration and handoff

The full `npm run build` passed application, Node, test, Svelte and domain type
checks, source-publication checks and the production bundle. Svelte reported
zero errors/warnings. Vite retained its existing large-chunk advisories; this
maintenance does not claim to reduce those chunks. `check:architecture` passed
every dependency, semantic/renderer and compiler-authority gate plus eight
cross-domain registration tests. `check:tooling-configs` passed every ownership,
configuration and discovery guard. The final cohort is 66 Playwright configs /
155 projects, 13 Vite configs in both modes and 13 compiler config documents.

`visual:algebra-editions -- --project=chromium --project=firefox` initially found
two failures in the existing preview-route test: it bypassed configuration and
hardcoded unavailable port 8000. The config now explicitly owns the isolated
algebra verification server on 8013, and the test uses its configured base URL.
This intentional test-host repair changes only that config's policy hash; no
product URL or browser selection changes. The complete suite then passed 17
checks, with its existing Firefox-only performance-probe skip retained. Real
static/no-script, production asset closure, reload, reverse and lifecycle checks
all ran. Every font/style remains in the edition closure.

`visual:anchored-algebra -- --project=firefox` passed all eight retained-reader
checks after integration. The optional review API on 8001 remains unavailable;
the preview reader itself responds on 8011. The roadmap, active thread and
source-linked vision map record finite maintenance closure and propose the
separate teardown repair; all 67 project-vision/dashboard tests passed.

To inspect the result, open `config/README.md` and run
`npm run check:tooling-configs`; use `npm run audit:css` for the complete current
inventory. Open `http://localhost:8011/?view=dashboard#project-vision` to see the
completed scope and proposed successor. The lesson at
`http://localhost:8011/experiments/reusable-reasoning/?example=distribute-collect`
should retain its existing prose, math, controls and reversible motion. These
are verification instructions, not a new aesthetic approval request.
