import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpCompiledLessonArtifact,
  createKpReaderArtifactRef
} from "../src/reader/document/public-api.ts";
import type { KpReaderRendererAdapter } from "../src/reader/renderers/public-api.ts";
import { createKpReaderSessionSnapshot } from "../src/reader/runtime/public-api.ts";

test("artifact refs retain inferred literal identity", () => {
  const ref = createKpReaderArtifactRef({
    kind: "animation-asset",
    id: "animation.linear-solve.solve-x",
    version: "1"
  });
  const exactKind: "animation-asset" = ref.kind;
  const exactId: "animation.linear-solve.solve-x" = ref.id;
  assert.equal(exactKind, "animation-asset");
  assert.equal(exactId, "animation.linear-solve.solve-x");
  assert.throws(
    () => createKpReaderArtifactRef({ kind: "lesson-document", id: " ", version: "1" }),
    /artifact id must not be empty/
  );
});

test("compiled lessons keep static output separate from hydration data", () => {
  const compiled = createKpCompiledLessonArtifact({
    id: "compiled.solve-x",
    version: "1",
    document: createKpReaderArtifactRef({
      kind: "lesson-document",
      id: "lesson.solve-x",
      version: "1"
    }),
    html: "<main>Readable first</main>",
    tocHtml: '<nav><a href="#solve">Solve</a></nav>',
    hydration: { schemaVersion: "kp.reader-hydration.v1" as const }
  });
  const exactSchema: "kp.reader-hydration.v1" = compiled.hydration.schemaVersion;
  assert.equal(exactSchema, "kp.reader-hydration.v1");
  assert.match(compiled.html, /Readable first/);
});

test("reader sessions validate bounded progress and copy focus identity", () => {
  const inputFocus = ["equation.x", "equation.x", "operation.subtract-three"];
  const session = createKpReaderSessionSnapshot({
    documentId: "lesson.solve-x",
    documentVersion: "1",
    checkpointId: "subtract-three",
    progressPermille: 333,
    focusRefs: inputFocus,
    reducedMotion: true
  });
  inputFocus.push("later-mutation");
  assert.deepEqual(session.location.focusRefs, [
    "equation.x",
    "operation.subtract-three"
  ]);
  assert.equal(session.location.progressPermille, 333);
  assert.equal(session.reducedMotion, true);
  assert.equal(session.motionPreference, "reduced");
  assert.throws(
    () => createKpReaderSessionSnapshot({
      documentId: "lesson.solve-x",
      documentVersion: "1",
      progressPermille: 1_001
    }),
    /integer from 0 through 1000/
  );
});

test("renderer adapter contract is host- and frame-generic", () => {
  const calls: string[] = [];
  const adapter = {
    id: "reader-renderer.test",
    mount(input) {
      calls.push(`mount:${input.host.name}:${input.asset.id}`);
      return {
        render(request) {
          calls.push(`render:${request.frame.progress}`);
        },
        refresh() {
          calls.push("refresh");
        },
        dispose() {
          calls.push("dispose");
        }
      };
    }
  } satisfies KpReaderRendererAdapter<{ readonly name: string }, { readonly progress: number }>;
  const session = createKpReaderSessionSnapshot({
    documentId: "lesson.solve-x",
    documentVersion: "1"
  });
  const asset = createKpReaderArtifactRef({
    kind: "animation-asset",
    id: "animation.linear-solve.solve-x",
    version: "1"
  });
  const controller = adapter.mount({
    host: { name: "stage" },
    blockId: "story",
    asset,
    session
  });
  controller.render({ blockId: "story", asset, session, frame: { progress: 0.5 } });
  controller.refresh();
  controller.dispose();
  assert.deepEqual(calls, [
    "mount:stage:animation.linear-solve.solve-x",
    "render:0.5",
    "refresh",
    "dispose"
  ]);
});
