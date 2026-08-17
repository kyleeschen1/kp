import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  kpDevelopmentBuildEntries
} from "../src/dev-toolbar/development-page-build-entries.ts";
import {
  isKpLispFunctionApplicationTutorialRoute,
  kpLispFunctionApplicationTutorialPath
} from "../src/tutorial/lisp-function-application/lisp-function-application-route.ts";

test("Lisp tutorial owns one canonical trailing-slash URL", () => {
  assert.equal(
    kpLispFunctionApplicationTutorialPath,
    "/tutorials/programming/lisp-function-application/"
  );
  assert.equal(isKpLispFunctionApplicationTutorialRoute(
    "/tutorials/programming/lisp-function-application/"
  ), true);
  assert.equal(isKpLispFunctionApplicationTutorialRoute(
    "/tutorials/programming/lisp-function-application"
  ), true);
  assert.equal(isKpLispFunctionApplicationTutorialRoute("/"), false);
});

test("bootstrap lazy-loads the Lisp Svelte host", async () => {
  const [bootstrap, routeSelection] = await Promise.all([
    readFile(new URL("../src/bootstrap.ts", import.meta.url), "utf8"),
    readFile(new URL(
      "../src/compatibility/legacy-root-route.ts",
      import.meta.url
    ), "utf8")
  ]);
  assert.match(routeSelection, /isKpLispFunctionApplicationTutorialRoute/);
  assert.match(bootstrap, /lisp-function-application-tutorial-entry\.ts/);
});

test("the Lisp route owns a build entry with a static fallback", async () => {
  const [html, vite] = await Promise.all([
    readFile(new URL(
      "../tutorials/programming/lisp-function-application/index.html",
      import.meta.url
    ), "utf8"),
    readFile(new URL("../vite.config.ts", import.meta.url), "utf8")
  ]);
  assert.match(html, /data-kp-lisp-static-fallback/);
  assert.match(html, /kp:lisp-static-fallback/);
  assert.deepEqual(
    kpDevelopmentBuildEntries.find(({ name }) =>
      name === "lispFunctionApplicationTutorial"
    ),
    {
      name: "lispFunctionApplicationTutorial",
      htmlPath: "tutorials/programming/lisp-function-application/index.html"
    }
  );
  // The directory-owned entry table is now the one Vite input authority.
  assert.match(vite, /kpDevelopmentBuildEntries\.map/);
  assert.match(vite, /compileLispTutorialStaticFallback/);
});

test("Svelte host composes framework-neutral publication and stage payloads", async () => {
  const source = await readFile(
    new URL(
      "../src/tutorial/lisp-function-application/KpLispFunctionApplicationTutorial.svelte",
      import.meta.url
    ),
    "utf8"
  );
  assert.match(source, /data-kp-lisp-function-application-tutorial/);
  assert.match(source, /<h3 id=/);
  assert.match(source, /\{@html stageHtml\}/);
  assert.doesNotMatch(source, /createKpLispLambdaApplicationAsset|sampleKpLispLambdaApplicationRuntimeFrame/);
});
