# Generated Math Registry Seam Audit

Date: 2026-07-12
Run contract: `run-contract.kp.generated-math-family-expansion-v0`
Slice: `slice.kp.generated-math.registry-audit`

## Scope

This audit maps the generated linear-solve path before adding fraction,
exponent, radical, wrapping, distribution, and factoring families. The goal is
to extend the existing Asset Calculus path without creating a parallel
generator, dashboard, export, or law system.

## Current Linear-Solve Path

```text
src/semantic/generated-algebra-fixture-registry.ts
  -> GeneratedLinearSolveTutorialFixtureSpec[]
  -> createGeneratedLinearSolveTutorialFixture(...)
  -> GeneratedLinearSolveTutorialFixture
  -> tutorial card sample
  -> export samples and dependency manifests
  -> dashboard fixture rows and maturity row
  -> laws, trace diagnostics, flashcards, drill-down hooks, browser smoke
```

The current path is coherent and well-tested, but every public seam names
`LinearSolve`. New families should therefore first widen the generated algebra
contract, then keep compatibility aliases for linear-solve fixtures.

## Seams To Generalize

1. **Registry**
   `generated-algebra-fixture-registry.ts` currently stores only
   `GeneratedLinearSolveTutorialFixtureSpec`. The next family needs a
   generated-algebra spec union with a stable `familyId`, `id`, `title`,
   `kind`, and family-specific payload.

2. **Fixture Builder**
   `generated-algebra-tutorial-fixture.ts` returns
   `GeneratedLinearSolveTutorialFixture`. The common output shape is already
   family-independent: `bundle`, `transformations`, `diagram`, `trace`,
   `drillDownHooks`, and `flashcards`. The next step should extract that
   shared shape as `GeneratedAlgebraTutorialFixture`.

3. **Card Sample Adapter**
   `generated-linear-solve-card-sample.ts` adapts generated fixtures through
   `generatedFixtureAsLinearSolveAsset`, which reuses the linear-solve card
   runtime and interpreter. New KaTeX-only families can initially use the same
   equation-frame sample path, but the adapter name and sample target should
   become generated-algebra-aware.

4. **Export Samples**
   `generated-linear-solve-export-sample.ts` and
   `generated-linear-solve-dependency-manifest.ts` assume a linear-solve sample
   id and dependency manifest type. The dependency manifest is structurally
   generic and should become `GeneratedAlgebraDependencyManifest`.

5. **Dashboard Rows**
   `generated-algebra-catalog.ts` already owns generated algebra rows but
   builds them from `createGeneratedLinearSolveTutorialFixtures()`. Rows should
   group by `familyId` and produce maturity rows per generated family.

6. **Sample Targets**
   `generated-fixture-sample-targets.ts` has one live-card target helper. It
   should accept the shared generated fixture shape plus a family/sample
   routing descriptor so non-linear-solve fixtures can open the correct sample.

7. **Laws**
   `checkKpAssetFixtureReferenceClosure` already accepts the shared fixture
   pieces. Family expansion should reuse this law directly. New law work should
   add family-level consistency checks, not duplicate per-family closure logic.

8. **Trace Diagnostics**
   `algebra-trace-port-fixture.ts` already has generic mismatch diagnostics
   around transformations and rules. New families should emit trace steps with
   real `transformationId` and `rule` values so diagnostics remain shared.

## Recommended First Extension Shape

Before adding the first new family, introduce a small shared layer:

```ts
type GeneratedAlgebraFixtureFamilyId =
  | "generated.linear-solve"
  | "generated.fraction-expression"
  | "generated.exponent"
  | "generated.radical"
  | "generated.function-wrap"
  | "generated.distribution";

interface GeneratedAlgebraTutorialFixture {
  id: string;
  familyId: GeneratedAlgebraFixtureFamilyId;
  title: string;
  bundle: KpAssetBundle;
  transformations: readonly KpSemanticTransformation[];
  diagram: KpSemanticDiagramSequence;
  trace: AlgebraTraceFixture;
  drillDownHooks: readonly KpTransformationDrillDownHook[];
  flashcards: readonly KpFlashcardSpec[];
}
```

Keep the existing linear-solve exports as compatibility wrappers while adding
family-aware helpers:

- `listGeneratedAlgebraTutorialFixtureSpecs()`
- `getGeneratedAlgebraTutorialFixtureSpec(id)`
- `createGeneratedAlgebraTutorialFixture(specOrId)`
- `createGeneratedAlgebraTutorialFixtures()`

## Verification Baseline

Focused baseline commands for the next implementation slices:

- `npm test -- tests/kp-generated-algebra-fixture-registry.test.ts`
- `npm test -- tests/kp-generated-algebra-tutorial-fixture.test.ts`
- `npm test -- tests/generated-linear-solve-tutorial-card-sample.test.ts`
- `npm test -- tests/generated-linear-solve-export-sample.test.ts`
- `npm test -- tests/project-dashboard-generated-algebra-catalog.test.ts`
- `npm test -- tests/kp-asset-laws.test.ts`
- `npm test -- tests/kp-algebra-trace-port-fixture.test.ts`

Standard checks should add:

- `npm run typecheck`
- `npm run theseus -- validate`

Browser-impacting family slices should add:

- `npx playwright test tests/generated-linear-solve-smoke.browser.spec.ts --project=chromium`

## Slice Guidance

The next slice should not start by adding fraction-specific UI. It should first
make the registry and fixture output family-aware while preserving all existing
linear-solve behavior. After that, fraction fixtures can be added as data plus
one family builder and reused by card, export, dashboard, law, trace, and smoke
paths.
