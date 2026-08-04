import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateKpLispFunctionApplicationBundle,
  kpLispFunctionApplicationBundleBudgets
} from "./check-lisp-function-application-budgets.ts";

const rendererKey = "_lisp-material-stage-projector-example.js";
const manifest = Object.freeze({
  "src/tutorial/lisp-function-application/lisp-function-application-tutorial-entry.ts": {
    file: "assets/lisp-entry.js",
    imports: [rendererKey]
  },
  [rendererKey]: {
    file: "assets/lisp-material-stage-projector-example.js",
    name: "lisp-material-stage-projector"
  }
});

test("Lisp renderer budget accepts the exact raw-byte boundary", () => {
  const evidence = evaluateKpLispFunctionApplicationBundle({
    manifest,
    rendererBytes: new Uint8Array(
      kpLispFunctionApplicationBundleBudgets.rendererRawBytes
    )
  });
  assert.equal(
    evidence.rendererRawBytes,
    kpLispFunctionApplicationBundleBudgets.rendererRawBytes
  );
});

test("Lisp renderer budget rejects growth and an unowned renderer chunk", () => {
  assert.throws(() => evaluateKpLispFunctionApplicationBundle({
    manifest,
    rendererBytes: new Uint8Array(
      kpLispFunctionApplicationBundleBudgets.rendererRawBytes + 1
    ).fill(1)
  }), /renderer raw bytes/);
  assert.throws(() => evaluateKpLispFunctionApplicationBundle({
    manifest: {
      ...manifest,
      "src/tutorial/lisp-function-application/lisp-function-application-tutorial-entry.ts": {
        file: "assets/lisp-entry.js",
        imports: []
      }
    },
    rendererBytes: new Uint8Array(1)
  }), /must import the scoped material renderer chunk/);
});
