import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

const governedMotionLiteralFiles = Object.freeze([
  "src/animation/witnessed-annihilation.ts",
  "src/animation/cancellation-pressure-animation.ts"
]);

const selfExplainingIntegerLiterals = new Set([0, 1, 2, 3]);
const namedAuthorityPattern =
  /(?:Profile(?:V\d+)?|Policy|Geometry|Thresholds|Checkpoints|Constants)$/;
const issues: string[] = [];

for (const relativePath of governedMotionLiteralFiles) {
  const path = resolve(process.cwd(), relativePath);
  const sourceText = readFileSync(path, "utf8");
  const sourceFile = ts.createSourceFile(
    path,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );
  visit(sourceFile, sourceFile, relativePath);
}

if (issues.length > 0) {
  throw new Error(
    "Unexplained motion literals must move into a named typed authority:\n" +
    issues.map((issue) => `- ${issue}`).join("\n")
  );
}

console.log(
  `motion literal ratchet passed for ${governedMotionLiteralFiles.length} files`
);

function visit(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  relativePath: string
): void {
  if (ts.isNumericLiteral(node)) {
    const numericValue = Number(node.text.replaceAll("_", ""));
    if (
      !selfExplainingIntegerLiterals.has(numericValue) &&
      !belongsToNamedAuthority(node)
    ) {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(
        node.getStart(sourceFile)
      );
      issues.push(
        `${relativePath}:${line + 1}:${character + 1} (${node.getText(sourceFile)})`
      );
    }
  }
  ts.forEachChild(node, (child) => visit(child, sourceFile, relativePath));
}

function belongsToNamedAuthority(node: ts.Node): boolean {
  let current: ts.Node | undefined = node.parent;
  while (current !== undefined) {
    if (ts.isVariableDeclaration(current)) {
      return ts.isIdentifier(current.name) &&
        namedAuthorityPattern.test(current.name.text);
    }
    current = current.parent;
  }
  return false;
}
