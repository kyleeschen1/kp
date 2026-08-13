import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

import {
  escapeKpTutorialHtmlAttribute,
  escapeKpTutorialHtmlText,
  escapeKpTutorialScriptJson
} from "../src/tutorial/generated-html-escaping.ts";

const consumers = [
  {
    path: "src/tutorial/card-html-shell.ts",
    contexts: ["text", "attribute"]
  },
  {
    path: "src/tutorial/frame-sequence-preview.ts",
    contexts: ["text", "attribute", "script-json"]
  },
  {
    path: "src/tutorial/iframe-export-document.ts",
    contexts: ["text", "attribute", "script-json"]
  },
  {
    path: "src/tutorial/place-value-addition-static-step-export.ts",
    contexts: ["text", "attribute"]
  },
  {
    path: "src/tutorial/programming-card-sample.ts",
    contexts: ["text", "attribute"]
  },
  {
    path: "src/tutorial/programming-execution-trace-card-sample.ts",
    contexts: ["text", "attribute"]
  },
  {
    path: "src/tutorial/programming-execution-trace-panel.ts",
    contexts: ["text", "attribute"]
  },
  {
    path: "src/tutorial/scheme-factorial/scheme-factorial-publication.ts",
    contexts: ["text", "attribute"]
  },
  {
    path: "src/tutorial/static-step-export-smoke-fixture.ts",
    contexts: ["text", "attribute", "script-json"]
  },
  {
    path: "src/tutorial/synchronized-comparison-card.ts",
    contexts: ["text", "attribute"]
  }
] as const;

const contextSymbols = {
  text: "escapeKpTutorialHtmlText",
  attribute: "escapeKpTutorialHtmlAttribute",
  "script-json": "escapeKpTutorialScriptJson"
} as const;

test("generated tutorial text and attributes escape their exact HTML contexts", () => {
  const adversarial = `&<>"'=/\u2028\u2029`;

  assert.equal(
    escapeKpTutorialHtmlText(adversarial),
    `&amp;&lt;&gt;"'=/\u2028\u2029`
  );
  assert.equal(
    escapeKpTutorialHtmlAttribute(adversarial),
    `&amp;&lt;&gt;&quot;'=/\u2028\u2029`
  );
  assert.equal(
    `<p>${escapeKpTutorialHtmlText("</p><script>bad()</script>")}</p>`,
    "<p>&lt;/p&gt;&lt;script&gt;bad()&lt;/script&gt;</p>"
  );
  assert.equal(
    `<p data-value="${escapeKpTutorialHtmlAttribute(`"><img src=x>`)}"></p>`,
    `<p data-value="&quot;&gt;&lt;img src=x&gt;"></p>`
  );
});

test("script JSON remains parseable while HTML terminators and separators are inert", () => {
  const value = {
    title: "</script><script>bad()</script>",
    separators: "\u2028\u2029",
    ampersand: "&"
  };
  const escaped = escapeKpTutorialScriptJson(JSON.stringify(value));

  assert.equal(escaped.includes("<"), false);
  assert.equal(escaped.includes("\u2028"), false);
  assert.equal(escaped.includes("\u2029"), false);
  assert.equal(escaped.includes("&"), true);
  assert.deepEqual(JSON.parse(escaped), value);
});

test("only generated tutorial document consumers share the utility", async () => {
  const tutorialSources = await sourceFiles("src/tutorial");
  const actualConsumers = (await Promise.all(tutorialSources.map(
    async (path) => ({ path, source: await readFile(path, "utf8") })
  )))
    .filter(({ source }) => /generated-html-escaping\.ts/.test(source))
    .map(({ path }) => path)
    .sort();
  assert.deepEqual(
    actualConsumers,
    consumers.map(({ path }) => path).slice().sort()
  );

  for (const { path, contexts } of consumers) {
    const source = await readFile(path, "utf8");
    assert.match(source, /generated-html-escaping\.ts/, path);
    assert.doesNotMatch(
      source,
      /function (?:escapeHtml|escapeAttr|escapeScriptJson)/,
      path
    );
    for (const [context, symbol] of Object.entries(contextSymbols)) {
      const expected = (contexts as readonly string[]).includes(context);
      assert.equal(source.includes(symbol), expected, `${path}: ${context}`);
    }
  }
});

async function sourceFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => {
    const child = `${root}/${entry.name}`;
    if (entry.isDirectory()) return sourceFiles(child);
    return /\.(?:mjs|ts|tsx)$/.test(entry.name) ? [child] : [];
  }))).flat();
}
