import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createLinearSolveStaticHostFixtureRoot
} from "../src/tutorial/static-host-fixture-root.ts";

test("static-host fixture root exposes fallback readiness per artifact", () => {
  const root = createLinearSolveStaticHostFixtureRoot();

  assert.deepEqual(root.fallbackReadiness, [
    {
      artifactId: "artifact.linear-solve.iframe",
      strategy: "static-snapshot",
      preservesLayout: true,
      message:
        "Show static equation and graph snapshots when the interactive runtime is unavailable.",
      diagnostics: []
    },
    {
      artifactId: "artifact.linear-solve.steps",
      strategy: "static-snapshot",
      preservesLayout: true,
      message:
        "Show static equation and graph snapshots when the interactive runtime is unavailable.",
      diagnostics: []
    }
  ]);
});
