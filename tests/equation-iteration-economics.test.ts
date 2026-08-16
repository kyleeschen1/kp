import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpEquationIterationEconomics
} from "../src/architecture/equation-iteration-economics.ts";

const compatibility = Object.freeze({
  equationSurfaceCount: 2,
  familyCount: 1,
  genericCompatibilityRows: 1,
  specializedAdapterRows: 1,
  rowsWithNonSemanticTransitions: 0,
  nonSemanticTransitionCount: 0,
  wholeEquationFallbackRows: 1,
  privateClockRows: 0,
  cssAnimationAuthorityRows: 0,
  uniqueLocalSamplerNodes: 1
});

test("iteration economics measures removable taxes without making them policy", () => {
  const report = compileKpEquationIterationEconomics({
    equationAuthorityFiles: [
      { path: "src/a.ts", source: "switch (kind) { default: break; }\n" },
      { path: "src/b.ts", source: "export const stable = true;\n" }
    ],
    allSourceFiles: [
      { path: "src/a.ts", source: 'import "./function-wrap-motion-profile";' },
      { path: "src/b.ts", source: 'import "./function-wrap-reception";' }
    ],
    testFiles: [
      {
        path: "tests/catalog-source.test.ts",
        source: 'readFileSync("../src/a.ts"); assert.equal(rows.length, 45);\n'
      },
      { path: "tests/runtime.test.ts", source: "assert.equal(actual, expected);\n" }
    ],
    verificationScriptNames: ["test:a", "check:a"],
    compatibility
  });

  assert.deepEqual(report.equationAuthority, {
    sourceFileCount: 2,
    sourceLineCount: 4,
    closedSwitchSiteCount: 1,
    closedSwitchFiles: ["src/a.ts"]
  });
  assert.deepEqual(report.motifAuthority, {
    functionWrapProfileConsumers: ["src/a.ts"],
    functionWrapReceptionConsumers: ["src/b.ts"]
  });
  assert.deepEqual(report.tests.sourceInspectionFiles, ["tests/catalog-source.test.ts"]);
  assert.deepEqual(report.tests.aggregateCountRatchetFiles, ["tests/catalog-source.test.ts"]);
  assert.equal(report.verificationScriptCount, 2);
  assert.deepEqual(report.compatibility, compatibility);
});
