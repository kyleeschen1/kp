import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectLocalStylesheetClosure, StylesheetClosureError } from "../scripts/local-stylesheet-closure.ts";
import { writeKpImmutableLocalEdition } from "../scripts/immutable-local-edition.ts";

function fixture(run: (root: string, put: (name: string, text: string) => void) => void) {
  const scratch = fileURLToPath(new URL("../tmp/codex/", import.meta.url)); mkdirSync(scratch, { recursive: true });
  const root = mkdtempSync(join(scratch, "css-closure-"));
  try { run(root, (name, text) => { const path = join(root, name); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, text); }); }
  finally { rmSync(root, { recursive: true, force: true }); }
}
const entry = (root: string, path = "main.css") => ({ root, path, output: `styles/${path}` });
const fails = (code: StylesheetClosureError["code"]) => (error: unknown) => error instanceof StylesheetClosureError && error.code === code;

test("a transitive style repair changes edition identity without rewriting old bytes or semantic revision", () => fixture((root, put) => {
  put("main.css", '@import "type.css";'); put("type.css", ".text{font-size:1rem}");
  const build = () => writeKpImmutableLocalEdition({ repo: root, editionRoot: join(root, "editions"), schemaVersion: "test.v1", revisionId: "same-semantic-source",
    files: collectLocalStylesheetClosure({ entries: [entry(root)] }), check: false });
  const first = build(); put("type.css", ".text{font-size:1.1rem}"); const second = build();
  assert.notEqual(first, second);
  assert.equal(readFileSync(join(first, "styles/type.css"), "utf8"), ".text{font-size:1rem}");
  assert.equal(JSON.parse(readFileSync(join(first, "edition.json"), "utf8")).revisionId,
    JSON.parse(readFileSync(join(second, "edition.json"), "utf8")).revisionId);
}));

test("real authored card closure contains transitive typography and every KaTeX font dependency", () => {
  const repo = fileURLToPath(new URL("..", import.meta.url));
  const files = collectLocalStylesheetClosure({
    entries: [{ root: join(repo, "src"), path: "experiments/authored-focus-card.css", output: "styles/experiments/authored-focus-card.css" }],
    aliases: { "katex/dist/katex.min.css": { root: join(repo, "node_modules/katex/dist"), path: "katex.min.css", output: "katex.min.css" } }
  });
  assert.ok(files.has("styles/tutorial/focus-deck-typography.css"));
  assert.ok(files.has("fonts/KaTeX_Main-Regular.woff2"));
  assert.match(files.get("styles/reader/app/exemplar.css")!.toString(), /@import "\.\.\/\.\.\/\.\.\/katex.min.css"/);
});

test("closure follows nested imports and fonts, preserves bytes and deduplicates deterministically", () => fixture((root, put) => {
  put("main.css", '@import "nested/card.css" screen;\n@import url("nested/type.css");\n.x{content:"url(missing.png)";background:url(data:image/png;base64,AA==)}');
  put("nested/card.css", '@import "type.css" layer(fonts);');
  put("nested/type.css", '@font-face{src:url(../fonts/font.woff2?v=1#font)}'); put("fonts/font.woff2", "font");
  const files = collectLocalStylesheetClosure({ entries: [entry(root), entry(root, "nested/card.css")] });
  assert.deepEqual([...files.keys()], ["styles/fonts/font.woff2", "styles/main.css", "styles/nested/card.css", "styles/nested/type.css"]);
  assert.equal(files.get("styles/fonts/font.woff2")!.toString(), "font");
  assert.equal(files.get("styles/nested/card.css")!.toString(), '@import "type.css" layer(fonts);');
  assert.deepEqual([...files], [...collectLocalStylesheetClosure({ entries: [entry(root, "nested/card.css"), entry(root)] })]);
}));

test("explicit package aliases rewrite imports and collect their own bounded dependencies", () => fixture((root, put) => {
  put("source/main.css", '@import "vendor/style.css" print;');
  put("vendor/style.css", '.x{background:url(image.svg)}'); put("vendor/image.svg", "<svg/>");
  const files = collectLocalStylesheetClosure({ entries: [entry(join(root, "source"))], aliases: {
    "vendor/style.css": { root: join(root, "vendor"), path: "style.css", output: "vendor/style.css" }
  } });
  assert.equal(files.get("styles/main.css")!.toString(), '@import "../vendor/style.css" print;');
  assert.ok(files.has("vendor/image.svg"));
}));

test("missing nested files, cycles, escapes, symlinks and collisions fail explicitly", () => fixture((root, put) => {
  const collect = () => collectLocalStylesheetClosure({ entries: [entry(root)] });
  put("main.css", '@import "nested.css";'); assert.throws(collect, fails("missing"));
  put("nested.css", '@import "main.css";'); assert.throws(collect, fails("cycle"));
  put("main.css", '@import "../outside.css";'); assert.throws(collect, fails("unsafe-path"));
  put("main.css", '@import "linked.css";'); symlinkSync(join(root, "nested.css"), join(root, "linked.css"));
  assert.throws(collect, fails("unsafe-path"));
  put("main.css", ".x{}"); put("other.css", ".y{}");
  assert.throws(() => collectLocalStylesheetClosure({ entries: [entry(root), { ...entry(root, "other.css"), output: "styles/main.css" }] }), fails("collision"));
}));

test("a file first encountered as a URL asset still traverses dependencies when later imported as CSS", () => fixture((root, put) => {
  put("main.css", '.x{background:url(shared.css)}'); put("next.css", '@import "shared.css";');
  put("shared.css", '@import "missing.css";');
  assert.throws(() => collectLocalStylesheetClosure({ entries: [entry(root), entry(root, "next.css")] }), fails("missing"));
}));

test("unsupported external or escaped URLs cannot silently enter a local edition", () => fixture((root, put) => {
  for (const css of ['@import "https://example.com/a.css";', '.x{background:url(/outside.png)}', '.x{background:url(escaped%20file.png)}', '@import var(--dynamic);']) {
    put("main.css", css);
    assert.throws(() => collectLocalStylesheetClosure({ entries: [entry(root)] }), fails("unsupported"));
  }
}));
