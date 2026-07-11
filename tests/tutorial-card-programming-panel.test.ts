import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createSourceFileObject,
  createSourceRangeSelector
} from "../src/semantic/source-file.ts";
import {
  createKpTutorialProgrammingPanelContract
} from "../src/tutorial/programming-panel.ts";
import {
  createKpTutorialSourceFileFrameAdapter
} from "../src/tutorial/source-file-frame-adapter.ts";

test("programming panel contract binds SourceFile selectors to a code panel", () => {
  const sourceFile = createSourceFileObject({
    id: "source-file.add",
    label: "add.ts",
    language: "typescript",
    sourceText: "export function add(a: number, b: number) {\n  return a + b;\n}",
    path: "src/add.ts",
    revisionId: "rev-1"
  });
  const selectors = [
    createSourceRangeSelector({
      id: "selector.add.signature",
      sourceFileId: sourceFile.id,
      start: { line: 1, column: 1 },
      end: { line: 1, column: 44 },
      summary: "Function signature."
    }),
    createSourceRangeSelector({
      id: "selector.add.return",
      sourceFileId: sourceFile.id,
      start: { line: 2, column: 3 },
      end: { line: 2, column: 16 },
      summary: "Return expression."
    })
  ];

  const panel = createKpTutorialProgrammingPanelContract({
    panelId: "panel.add.code",
    sharedClockId: "clock.add-demo",
    sourceFile,
    selectors,
    summary: "Code panel for a small addition function."
  });

  selectors[0] = createSourceRangeSelector({
    id: "selector.mutated",
    sourceFileId: sourceFile.id,
    start: { line: 1, column: 1 },
    end: { line: 1, column: 7 }
  });

  assert.deepEqual(panel, {
    id: "panel.add.code.programming-panel",
    panelId: "panel.add.code",
    role: "code",
    sharedClockId: "clock.add-demo",
    target: {
      kind: "source-file",
      id: "source-file.add"
    },
    sourceFileId: "source-file.add",
    language: "typescript",
    lineCount: 3,
    selectorIds: ["selector.add.signature", "selector.add.return"],
    preserves: [
      "source-file identity",
      "source-range selector identity",
      "shared playhead"
    ],
    summary: "Code panel for a small addition function."
  });
});

test("programming panel contract rejects selectors from another SourceFile", () => {
  const sourceFile = createSourceFileObject({
    id: "source-file.add",
    label: "add.ts",
    language: "typescript",
    sourceText: "export const add = (a: number, b: number) => a + b;"
  });
  const selector = createSourceRangeSelector({
    id: "selector.other",
    sourceFileId: "source-file.other",
    start: { line: 1, column: 1 },
    end: { line: 1, column: 7 }
  });

  assert.throws(
    () =>
      createKpTutorialProgrammingPanelContract({
        panelId: "panel.add.code",
        sharedClockId: "clock.add-demo",
        sourceFile,
        selectors: [selector]
      }),
    /selector.other targets source-file.other/
  );
});

test("SourceFile frame adapter samples code lines and selector ranges", () => {
  const sourceFile = createSourceFileObject({
    id: "source-file.add",
    label: "add.ts",
    language: "typescript",
    sourceText: "export function add(a: number, b: number) {\n  return a + b;\n}",
    path: "src/add.ts",
    revisionId: "rev-1"
  });
  const selectors = [
    createSourceRangeSelector({
      id: "selector.add.signature",
      sourceFileId: sourceFile.id,
      start: { line: 1, column: 1 },
      end: { line: 1, column: 44 },
      summary: "Function signature."
    }),
    createSourceRangeSelector({
      id: "selector.add.return",
      sourceFileId: sourceFile.id,
      start: { line: 2, column: 3 },
      end: { line: 2, column: 16 },
      summary: "Return expression."
    })
  ];
  const panel = createKpTutorialProgrammingPanelContract({
    panelId: "panel.add.code",
    sharedClockId: "clock.add-demo",
    sourceFile,
    selectors
  });
  const adapter = createKpTutorialSourceFileFrameAdapter({
    panel,
    sourceFile,
    selectors
  });
  const frame = adapter.sample(0.5);

  assert.equal(adapter.panelId, "panel.add.code");
  assert.equal(adapter.sourceFileId, "source-file.add");
  assert.deepEqual(frame, adapter.sample(0.5));
  assert.deepEqual(frame, {
    panelId: "panel.add.code",
    sourceFileId: "source-file.add",
    sharedClockId: "clock.add-demo",
    language: "typescript",
    progress: 0.5,
    lineCount: 3,
    lines: [
      "export function add(a: number, b: number) {",
      "  return a + b;",
      "}"
    ],
    selectors: [
      {
        selectorId: "selector.add.signature",
        summary: "Function signature.",
        text: "export function add(a: number, b: number) {",
        startOffset: 0,
        endOffset: 43,
        start: { line: 1, column: 1 },
        end: { line: 1, column: 44 }
      },
      {
        selectorId: "selector.add.return",
        summary: "Return expression.",
        text: "return a + b;",
        startOffset: 46,
        endOffset: 59,
        start: { line: 2, column: 3 },
        end: { line: 2, column: 16 }
      }
    ]
  });
  assert.equal(adapter.sample(Number.NaN).progress, 0);
  assert.equal(adapter.sample(2).progress, 1);
});

test("SourceFile frame adapter requires panel selectors to be available", () => {
  const sourceFile = createSourceFileObject({
    id: "source-file.add",
    label: "add.ts",
    language: "typescript",
    sourceText: "export const add = (a: number, b: number) => a + b;"
  });
  const selector = createSourceRangeSelector({
    id: "selector.add.expression",
    sourceFileId: sourceFile.id,
    start: { line: 1, column: 21 },
    end: { line: 1, column: 53 }
  });
  const panel = createKpTutorialProgrammingPanelContract({
    panelId: "panel.add.code",
    sharedClockId: "clock.add-demo",
    sourceFile,
    selectors: [selector]
  });

  assert.throws(
    () =>
      createKpTutorialSourceFileFrameAdapter({
        panel,
        sourceFile,
        selectors: []
      }),
    /missing selector selector.add.expression/
  );
});
