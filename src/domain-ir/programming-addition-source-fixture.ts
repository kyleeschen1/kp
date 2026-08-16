import {
  createSourceFileObject,
  createSourceRangeSelector,
  type SourceFileObject,
  type SourceRangeSelector
} from "../semantic/source-file.ts";

export interface AdditionProgrammingSourceFixture {
  readonly id: "fixture.programming.add.source";
  readonly sharedClockId: "clock.programming.add-demo";
  readonly sourceFile: SourceFileObject;
  readonly signatureSelector: SourceRangeSelector;
  readonly returnSelector: SourceRangeSelector;
  readonly selectors: readonly [SourceRangeSelector, SourceRangeSelector];
}

/**
 * Source identity belongs to the semantic fixture so traces and tutorial
 * projections cannot silently construct different revisions or selectors.
 */
export function createAdditionProgrammingSourceFixture(): AdditionProgrammingSourceFixture {
  const sourceFile = createSourceFileObject({
    id: "source-file.programming.add",
    label: "add.ts",
    language: "typescript",
    sourceText: "export function add(a: number, b: number) {\n  return a + b;\n}",
    path: "src/add.ts",
    revisionId: "rev-1"
  });
  const signatureSelector = createSourceRangeSelector({
    id: "selector.programming.add.signature",
    sourceFileId: sourceFile.id,
    start: { line: 1, column: 1 },
    end: { line: 1, column: 44 },
    summary: "Function signature."
  });
  const returnSelector = createSourceRangeSelector({
    id: "selector.programming.add.return",
    sourceFileId: sourceFile.id,
    start: { line: 2, column: 3 },
    end: { line: 2, column: 16 },
    summary: "Return expression."
  });

  return {
    id: "fixture.programming.add.source",
    sharedClockId: "clock.programming.add-demo",
    sourceFile,
    signatureSelector,
    returnSelector,
    selectors: [signatureSelector, returnSelector]
  };
}
