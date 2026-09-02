import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import ts from "typescript";

const fixturePath = resolve(
  "tests/static-contract-fixtures/typed-math-authoring-diagnostics.ts"
);
const expectation =
  "    // @ts-expect-error Misspelled parameters must fail at this authoring expression.\n";

test("parameter typos produce a local diagnostic with an autocomplete name", () => {
  const options: ts.CompilerOptions = {
    allowImportingTsExtensions: true,
    exactOptionalPropertyTypes: true,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    noEmit: true,
    noUncheckedIndexedAccess: true,
    skipLibCheck: false,
    strict: true,
    target: ts.ScriptTarget.ES2022,
    types: []
  };
  const defaultHost = ts.createCompilerHost(options, true);
  const getSourceFile = defaultHost.getSourceFile.bind(defaultHost);
  const host: ts.CompilerHost = {
    ...defaultHost,
    getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile) {
      if (resolve(fileName) !== fixturePath) {
        return getSourceFile(
          fileName,
          languageVersion,
          onError,
          shouldCreateNewSourceFile
        );
      }
      const source = readFileSync(fixturePath, "utf8");
      assert.ok(source.includes(expectation));
      return ts.createSourceFile(
        fixturePath,
        source.replace(expectation, ""),
        languageVersion,
        true
      );
    }
  };
  const program = ts.createProgram([fixturePath], options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program).filter(
    (diagnostic) => diagnostic.file?.fileName === fixturePath
  );

  assert.equal(diagnostics.length, 1);
  const diagnostic = diagnostics[0];
  assert.equal(diagnostic?.code, 2551);
  assert.equal(
    diagnostic?.file?.getLineAndCharacterOfPosition(diagnostic.start ?? 0).line,
    12
  );
  assert.match(
    ts.flattenDiagnosticMessageText(diagnostic?.messageText ?? "", "\n"),
    /Property 'quantit' does not exist.*Did you mean 'quantity'/
  );
});
