# Make experimentation, conversion and retirement explicit

Date: 2026-10-29
Status: accepted user goal; lifecycle design below is proposed, not enforced

## Direction

After setting the larger workbench discussion aside, the user questions the
architecture beyond CSS and asks for a good system of experimentation,
conversion and retirement, recalling the original goal of extreme decoupling.
The immediate focus is this architectural design. Co-creative personal practice
remains the product goal; the October 28 workbench proposal is deferred rather
than silently executed or discarded. No rewrite or deletion is authorized here.

Treat decoupling as demonstrated local replaceability and removability, including
data, state, styling, initialization, disposal and build dependencies. An acyclic
import graph alone does not establish it. Independence does not require each
exemplar to duplicate its own foundational components.

## Direct findings

- `src/editor/semantic-animation-workbench-lifecycle.ts` separates maturity,
  approval, execution and playability, but does not model support withdrawal.
- `src/architecture/semantic-animation-compatibility-ledger.ts` already records
  six scoped compatibility entries with owners, known consumers, replacements,
  evidence and retirement conditions. It also records actual retired paths.
- `tests/semantic-animation-compatibility-ledger.test.ts` checks listed evidence
  and scans TypeScript source for retired keys. Its four tests pass in this
  inspection. Listed-consumer evidence does not establish a complete dependency
  inventory across styles, routes, generated artifacts and saved source formats.
- `src/architecture/kp-module-ownership.ts` distinguishes experiments and
  production owners. The portable-entrypoint policy rejects experiment imports.
  This is useful existing infrastructure, not proof that every product host is
  isolated or that replacement completes across all supported consumers.

## Proposed minimum system

Extend existing ownership/compatibility records at the level of a capability or
component family; do not introduce a record for every helper or another task
database. Keep support status independent of visual approval and mathematical
validity. Four support states are sufficient to test first:

| State | Proposed consequence |
| --- | --- |
| Experimental | Explicit opt-in; no maintained consumer depends on its private implementation; question, owner and review checkpoint are visible. |
| Supported | A named contract and supported consumer scope exist; new work may depend on its public interface. |
| Deprecated | Existing named consumers remain supported temporarily; new dependencies are rejected; successor or removal strategy and exit condition are required. |
| Retired | Removed from current production dependency paths and default authoring discovery; evidence and deliberately preserved artifacts remain retrievable. |

Experiments may close without promotion. Age prompts review, not automatic
deletion. Distinct maintained variants are legitimate when they have different
responsibilities or contracts; one implementation for all purposes is not a goal.

An experiment needs a question, bounded surface/dependencies, disposable output,
and a decision checkpoint. Its findings may be retained even if its implementation
is discarded. Promotion requires an appropriate real caller and a replacement
decision when it overlaps an existing owner; global reuse needs the established
second-caller and visual gates where applicable.

A conversion is a finite change with source and target, actual consumer census,
preserved guarantees, explicit behavior changes, saved-data/route policy,
verification, rollback and a removal condition. Distinguish implementation
replacement from source-format migration and from intentional behavior redesign.
Unsupported or lossy saved-data conversions must be explicit, preserve originals
and never silently change mathematics or learner evidence. Historical appearance
requires a pinned artifact/runtime when necessary; a source hash alone is not enough.

The old path stops gaining consumers before migration. Switch consumers in
reviewable cohorts, with only a bounded compatibility adapter if needed. New
implementation readiness and completed replacement are different claims. Finish
by removing the old implementation/adapter from the maintained path and updating
examples, generation guidance and routing. Preserve valuable behavior tests
against the surviving implementation rather than deleting guarantees with code.

Enforcement should reuse import, stylesheet-closure and registry owners. Check
for forbidden new consumers, unexplained removals of consumer coverage, retired
entrypoints still reachable, and misleading authoring discovery. Static imports
alone cannot establish closure for dynamic registries or saved formats; inventory
those explicitly and test relevant runtime/persistence boundaries.

## Smallest useful proof

Trace one explanation from author source through checking, presentation, renderer
and host. Choose a genuinely duplicated responsibility with a known replacement;
do not invent a universal framework. Demonstrate one completed replacement,
including retirement, preservation and rollback. Record the actual coordination
cost and dependencies removed. This is a proposed next investigation/conversion,
not an approved implementation contract or a universal migration mandate.
