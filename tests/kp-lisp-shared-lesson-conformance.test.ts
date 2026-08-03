import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const lispRoot = new URL(
  "../src/tutorial/lisp-function-application/",
  import.meta.url
);

test("Lisp consumes every shared lesson seam without projection wrappers", async () => {
  const [host, document, publication, motion, navigation, scroll, staticShell] =
    await Promise.all([
      read("KpLispFunctionApplicationTutorial.svelte"),
      read("lisp-function-application-document.ts"),
      read("lisp-function-application-publication.ts"),
      read("lisp-function-application-motion-controller.ts"),
      read("lisp-function-application-navigation.ts"),
      read("lisp-function-application-scroll.ts"),
      read("lisp-function-application-static-publication.ts")
    ]);

  assert.match(host, /KpTutorialLessonShell/);
  assert.match(document, /createKpTutorialLessonPublicationDocument/);
  assert.match(publication, /compileKpTutorialPublicationControls/);
  assert.match(motion, /projectKpTutorialCumulativeMotion/);
  assert.match(navigation, /createKpTutorialNavigationController/);
  assert.match(scroll, /KpTutorialScrollCoordinator/);
  assert.match(scroll, /projectKpTutorialRebasedCorridor/);
  assert.doesNotMatch(
    scroll,
    /export (?:interface|function) KpLispScroll|export function projectKpLisp/
  );
  assert.match(staticShell, /data-kp-tutorial-shell/);
  assert.match(staticShell, /kp-tutorial-shell__layout/);
});

test("botanical semantics and paint remain explicit experimental-local seams", async () => {
  const [entry, motion, salience] = await Promise.all([
    read("lisp-function-application-tutorial-entry.ts"),
    read("lisp-function-application-motion-controller.ts"),
    read("lisp-function-application-salience.ts")
  ]);
  assert.match(entry, /createKpLispBotanicalPresentationPlan/);
  assert.match(motion, /sampleKpLispLambdaApplicationRuntimeFrame/);
  assert.match(motion, /renderKpLispBotanicalStageHtml/);
  assert.match(salience, /KpLispBotanicalPresentationPlan/);
  assert.doesNotMatch(salience, /economics|graph/i);
});

function read(path: string): Promise<string> {
  return readFile(new URL(path, lispRoot), "utf8");
}
