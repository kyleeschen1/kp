import assert from "node:assert/strict";
import test from "node:test";

import { projectKpLispLambdaSourceMaterial } from
  "../src/animation/lisp-s-expression-material-projection.ts";
import {
  kpLispSemanticDomCss,
  renderKpLispSemanticDomHtml,
  type KpLispSemanticDomRenderInput
} from "../src/rendering/lisp-s-expression-material-dom.ts";
import { createKpLispLambdaApplicationFixture } from
  "../src/semantic/lisp-lambda-application-fixture.ts";

const states = projectKpLispLambdaSourceMaterial(
  createKpLispLambdaApplicationFixture()
).canonicalStates;

function render(
  input: Partial<KpLispSemanticDomRenderInput> = {}
): string {
  return renderKpLispSemanticDomHtml({
    state: states[0]!,
    presentation: "canonical-endpoint",
    accessibleLabel: "Lambda application",
    ...input
  });
}

test("renders every canonical endpoint as one complete selectable code tree", () => {
  for (const state of states) {
    const html = render({ state });
    assert.equal(count(html, "data-kp-lisp-paint-owner="), 1);
    assert.equal(count(html, "data-kp-lisp-native-code="), 1);
    assert.equal(count(html, "data-kp-lisp-material-id="), state.tokens.length);
    assert.equal(codeText(html), state.nativeCode);
    assert.doesNotMatch(html, /<svg|aria-hidden=/u);
  }
  assert.match(kpLispSemanticDomCss, /user-select: text/u);
  assert.match(kpLispSemanticDomCss, /font: 400 20px/u);
});

test("preserves certified source order, spaces, roles, and provenance", () => {
  const state = states[0]!;
  const html = render();
  let cursor = -1;
  for (const token of state.tokens) {
    const next = html.indexOf(`data-kp-lisp-material-id="${token.id}"`);
    assert.ok(next > cursor, `${token.id} follows canonical reading order`);
    cursor = next;
  }
  assert.match(html, /data-kp-lisp-owner-expression="expr\.body"/u);
  assert.match(html, /data-kp-lisp-owner-role="executable-form"/u);
  assert.match(html, /data-kp-lisp-origin-ids="occurrence\.argument\.four"/u);
  assert.equal(codeText(html), "((lambda (x) (+ x 1)) 4)");
});

test("allows SVG only as a transient noninteractive guide overlay", () => {
  const html = render({
    presentation: "material-motion",
    transientGuides: {
      lifetime: "transient",
      widthEm: 24,
      heightEm: 12,
      paths: [{ id: "argument-arch", d: "M 20 9 C 20 2 4 2 4 7", opacity: 0.625 }]
    }
  });

  assert.equal(count(html, "data-kp-lisp-paint-owner="), 1);
  assert.match(html, /<svg[^>]+data-kp-lisp-guide-lifetime="transient"[^>]+aria-hidden="true"[^>]+focusable="false"/u);
  assert.match(html, /<path[^>]+data-kp-lisp-transient-guide="argument-arch"[^>]+opacity="0\.6250"/u);
  assert.doesNotMatch(html.match(/<svg[\s\S]*<\/svg>/u)?.[0] ?? "", /<text|<foreignObject|data-kp-lisp-native-code/u);
  assert.match(kpLispSemanticDomCss, /pointer-events: none/u);
});

test("rejects competing source order, false glyph identity, and persistent guides", () => {
  const application = states[0]!;
  assert.throws(() => render({
    state: { ...application, tokens: [...application.tokens].reverse() }
  }), /outside canonical reading order/u);
  assert.throws(() => render({
    state: {
      ...application,
      tokens: application.tokens.map((token, index) => index === 1
        ? { ...token, lexeme: "wrong" }
        : token)
    }
  }), /does not match canonical source/u);
  assert.throws(() => render({
    transientGuides: {
      lifetime: "persistent" as "transient",
      widthEm: 24,
      heightEm: 12,
      paths: []
    }
  }), /must be transient/u);
});

test("escapes labels and guide geometry without changing native code", () => {
  const html = render({
    accessibleLabel: "Read <x> & then \"apply\"",
    transientGuides: {
      lifetime: "transient",
      widthEm: 24,
      heightEm: 12,
      paths: [{ id: "guide'one", d: "M 0 0 L 1 1\"", opacity: 1 }]
    }
  });
  assert.match(html, /aria-label="Read &lt;x&gt; &amp; then &quot;apply&quot;"/u);
  assert.match(html, /data-kp-lisp-transient-guide="guide&#39;one"/u);
  assert.match(html, /d="M 0 0 L 1 1&quot;"/u);
  assert.equal(codeText(html), states[0]!.nativeCode);
});

function count(value: string, needle: string): number {
  return value.split(needle).length - 1;
}

function codeText(html: string): string {
  const contents = html.match(/<code[^>]*>([\s\S]*?)<\/code>/u)?.[1];
  if (contents === undefined) throw new Error("Rendered code element is absent.");
  return contents.replaceAll(/<[^>]+>/gu, "")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}
