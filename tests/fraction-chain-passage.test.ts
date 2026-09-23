import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fractionIntervalAt, fractionPositionAtY, fractionSceneAt } from "../src/tutorial/fraction-chain/position.ts";
import { compileFractionChainPublication } from "../src/tutorial/fraction-chain/publication.ts";
import { renderLatexToHtml } from "../src/rendering/katex-adapter.ts";

test("measured fraction rail round trips coarse and expanded positions at different font geometries", () => {
  for (const scale of [.75, 1, 2]) for (const stops of [[0, 1, 2], [0, 1, 1.5, 2], [0, 1, 2, 3], [0, 1, 1.5, 2, 3]]) {
    const points = stops.map((position, index) => ({ position, y: scale * (40 + index * index * 100) }));
    for (let index = 0; index <= stops.at(-1)! * 100; index++) {
      const position = index / 100, interval = fractionIntervalAt(position, points);
      assert.ok(Math.abs(fractionPositionAtY(interval.y, points) - position) < 1e-10);
      const scene = fractionSceneAt(position);
      assert.ok(scene.progress >= 0 && scene.progress <= 1);
    }
    assert.equal(fractionPositionAtY(-100, points), 0);
    assert.equal(fractionPositionAtY(10000, points), stops.at(-1));
  }
});
test("invalid and collapsed rail geometry cannot enter the playhead", () => {
  for (const points of [[], [{position: 0, y: 0}], [{position: 0, y: 0}, {position: 3, y: 0}], [{position: 0, y: 0}, {position: 4, y: 10}]])
    assert.throws(() => fractionPositionAtY(5, points), /measurements/);
  for (const position of [NaN, Infinity, -1, 4]) assert.throws(() => fractionSceneAt(position), /position/);
});
test("fraction Article publishes source equations, prose and static detail before enhancement", () => {
  const markdown = readFileSync("examples/algebra/fraction-chain.article.md", "utf8");
  const source = JSON.parse(readFileSync("examples/algebra/fraction-chain.json", "utf8"));
  const html = compileFractionChainPublication(markdown, source);
  assert.equal((html.match(/data-fraction-row/g) ?? []).length, 5);
  assert.match(html, /data-source-revision=/);
  assert.match(html, /data-fraction-static-detail/);
  assert.match(html, /data-fraction-disclosure[^>]*hidden/);
  assert.match(html, /A third is two sixths/);
  assert.throws(() => compileFractionChainPublication(markdown, { ...source, states: source.states.slice(0, 2), moves: source.moves.slice(0, 1) }), /requires alignment/);
});

test("fraction host cannot silently fork the accepted reader styling", () => {
  const host = readFileSync("experiments/fraction-chain/index.html", "utf8");
  const entry = readFileSync("src/tutorial/fraction-chain/entry.ts", "utf8");
  for (const source of [host, entry]) {
    assert.match(source, /reader\/presentation\/reasoning-document\.css/);
    assert.match(source, /reader\/presentation\/equation-passage\.css/);
    assert.doesNotMatch(source, /app\/exemplar\.css|mechanics-relations\/momentum-energy-reader\.css/);
  }
  assert.match(host, /class="kp-reasoning-document"/);
  const local = readFileSync("src/tutorial/fraction-chain/style.css", "utf8");
  assert.doesNotMatch(local, /font-family|--derivation-inspection-accent|text-shadow|#[\da-f]{3,8}\b/i);
});

test("every fraction publication exposes native MathML without changing its visual glyph markup", () => {
  for (const name of ["fraction-chain", "fraction-chain-numeric", "fraction-chain-two-sided", "fraction-chain-subtraction"]) {
    const source = JSON.parse(readFileSync(`examples/algebra/${name}.json`, "utf8"));
    const html = compileFractionChainPublication(readFileSync(`examples/algebra/${name}.article.md`, "utf8"), source);
    const annotations = [...html.matchAll(/<annotation encoding="application\/x-tex">([\s\S]*?)<\/annotation>/g)].map(match => match[1]);
    // Two additional expressions are the static detail and its expandable row.
    assert.equal(annotations.length, source.states.length + 2, name);
    for (const state of source.states) {
      assert.ok(annotations.includes(state.latex), `${name}: ${state.latex}`);
      const visual = renderLatexToHtml(state.latex);
      const accessible = renderLatexToHtml(state.latex, { output: "htmlAndMathml" });
      const suffix = (value: string) => value.slice(value.indexOf('<span class="katex-html"'));
      assert.equal(suffix(accessible), suffix(visual));
      assert.ok(html.includes(accessible), "Publication must use the complete native projection");
    }
  }
});
