import assert from "node:assert/strict";
import test from "node:test";

import { readFile } from "node:fs/promises";

import { compileKpPythonRefactorSemantics } from
  "../scripts/python-refactor-semantic-compiler.ts";
import { compileKpTypeScriptRefactorSemantics } from
  "../scripts/typescript-refactor-semantic-compiler.ts";
import { createKpAnimationCapabilityReadiness } from
  "../src/architecture/animation-capability-readiness.ts";
import { createKpAnimationDomainFrontendEvidence } from
  "../src/architecture/animation-domain-frontend-evidence.ts";
import { kpAnimationCapabilityPlan } from
  "../src/architecture/cross-domain-animation-capability-plan.ts";
import {
  readKpAnimationCatalogueRoute,
  writeKpAnimationCatalogueRoute
} from "../src/editor/animation-catalogue-route.ts";
import { kpPythonFreeShippingRefactorContract } from
  "../src/semantic/python-free-shipping-refactor-contract.ts";
import { createKpPythonRefactorOperationSet } from
  "../src/semantic/python-refactor-operations.ts";
import { kpTypeScriptFreeShippingRefactorContract } from
  "../src/semantic/typescript-free-shipping-refactor-contract.ts";
import { createKpTypeScriptRefactorOperationSet } from
  "../src/semantic/typescript-refactor-operations.ts";
import { codeRefactorGenerationPreflight } from
  "./fixtures/code-refactor-generation-preflight.ts";

const typescriptBaseline = codeRefactorGenerationPreflight.capabilities[0]!;
const pythonBaseline = codeRefactorGenerationPreflight.capabilities[1]!;

test("preflight freezes canonical contracts, semantics, and operation identity", () => {
  const typescriptSemantics = compileKpTypeScriptRefactorSemantics();
  const pythonSemantics = compileKpPythonRefactorSemantics();
  const typescriptOperations = createKpTypeScriptRefactorOperationSet(
    typescriptSemantics
  );
  const pythonOperations = createKpPythonRefactorOperationSet(pythonSemantics);

  assertLanguageBaseline({
    baseline: typescriptBaseline,
    contract: kpTypeScriptFreeShippingRefactorContract,
    semantics: typescriptSemantics,
    operationSet: typescriptOperations
  });
  assertLanguageBaseline({
    baseline: pythonBaseline,
    contract: kpPythonFreeShippingRefactorContract,
    semantics: pythonSemantics,
    operationSet: pythonOperations
  });
});

test("preflight freezes exact Direct readiness and matched frontends", () => {
  const readiness = createKpAnimationCapabilityReadiness();
  const frontendEvidence = createKpAnimationDomainFrontendEvidence();

  for (const baseline of codeRefactorGenerationPreflight.capabilities) {
    const capability = kpAnimationCapabilityPlan.entries.find(
      ({ id }) => id === baseline.capabilityId
    );
    assert.equal(
      capability?.requirements.find(({ kind }) => kind === "domain-frontend")
        ?.authorityId,
      baseline.frontendAuthorityId
    );
    assert.deepEqual(
      capability?.requirements.map(({ authorityId }) => authorityId),
      [
        baseline.frontendAuthorityId,
        baseline.operationAuthorityId,
        baseline.recipeAuthorityId,
        baseline.animationId,
        baseline.corpusAuthorityId
      ]
    );
    assert.equal(
      readiness.entries.find(
        ({ capabilityId }) => capabilityId === baseline.capabilityId
      )?.status,
      codeRefactorGenerationPreflight.expectedReadiness
    );
    assert.equal(
      frontendEvidence.requirements.find(
        ({ capabilityId }) => capabilityId === baseline.capabilityId
      )?.status,
      codeRefactorGenerationPreflight.expectedFrontendStatus
    );
  }
});

test("preflight freezes stable artifact routes", () => {
  for (const baseline of codeRefactorGenerationPreflight.capabilities) {
    const search = writeKpAnimationCatalogueRoute("", {
      artifactId: baseline.animationId,
      playhead: codeRefactorGenerationPreflight.stableRoute.playhead
    });
    assert.deepEqual(readKpAnimationCatalogueRoute(search), {
      active: true,
      source: "default",
      artifactId: baseline.animationId,
      playhead: codeRefactorGenerationPreflight.stableRoute.playhead
    });
  }
});

test("preflight keeps compiler/runtime imports in build-time frontends", async () => {
  for (const baseline of codeRefactorGenerationPreflight.capabilities) {
    const source = await readFile(baseline.buildTimeFrontendPath, "utf8");
    assert.ok(source.length > 0);
    assert.ok(
      baseline.prohibitedBrowserImports.some((specifier) =>
        source.includes(specifier)
      ),
      `${baseline.language} build-time frontend must retain its parser owner`
    );
  }
  assert.equal(
    codeRefactorGenerationPreflight.browserClosureGate,
    "npm run check:animation-library-bundle-boundary"
  );
});

function assertLanguageBaseline(input: {
  readonly baseline:
    (typeof codeRefactorGenerationPreflight.capabilities)[number];
  readonly contract: {
    readonly schemaVersion: string;
    readonly id: string;
    readonly entities: readonly { readonly id: string }[];
    readonly stages: readonly { readonly id: string }[];
    readonly before: { readonly source: string };
    readonly after: { readonly source: string };
  };
  readonly semantics: {
    readonly schemaVersion: string;
    readonly contractId: string;
    readonly revisions: readonly {
      readonly revision: "before" | "after";
      readonly sourceText: string;
      readonly entities: readonly { readonly id: string }[];
    }[];
  };
  readonly operationSet: {
    readonly id: string;
    readonly transformations: readonly { readonly id: string }[];
    readonly lineage: { readonly id: string };
  };
}): void {
  const { baseline, contract, semantics, operationSet } = input;
  assert.equal(contract.schemaVersion, baseline.contractSchemaVersion);
  assert.equal(contract.id, baseline.contractId);
  assert.equal(semantics.schemaVersion, baseline.semanticSchemaVersion);
  assert.equal(semantics.contractId, baseline.contractId);
  assert.deepEqual(contract.entities.map(({ id }) => id), baseline.entityIds);
  assert.deepEqual(
    semantics.revisions.flatMap(({ entities }) => entities.map(({ id }) => id)),
    baseline.entityIds
  );
  assert.deepEqual(contract.stages.map(({ id }) => id), baseline.stageIds);
  assert.equal(
    semantics.revisions.find(({ revision }) => revision === "before")
      ?.sourceText,
    contract.before.source
  );
  assert.equal(
    semantics.revisions.find(({ revision }) => revision === "after")
      ?.sourceText,
    contract.after.source
  );
  assert.equal(operationSet.id, baseline.operationSetId);
  assert.deepEqual(
    operationSet.transformations.map(({ id }) => id),
    baseline.transformationIds
  );
  assert.equal(operationSet.lineage.id, baseline.lineageId);
}
