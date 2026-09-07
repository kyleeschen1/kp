import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { KpArticleImportLock } from "../src/article/kp-article-import-lock.ts";
import { createKpAuthoredMarketSource } from "../src/tutorial/typed-linear-supply-demand/authoring-market-source.ts";
import { createKpAuthoringMarketCompanion, KpAuthoringMarketCompanionError } from "../src/tutorial/authoring-market/authoring-market-companion.ts";
import { createKpSupplyTaxPedagogicalScore } from "../src/tutorial/kinetic-figure-supply-tax/kinetic-figure-supply-tax-score.ts";
import { projectKpSupplyTaxScene, projectKpSupplyTaxSceneTransition } from "../src/tutorial/kinetic-figure-supply-tax/kinetic-figure-supply-tax-scene.ts";
import { createKpSemanticStateQuerySession } from "../src/semantic-state/authoring-query-session.ts";

const text = readFileSync(new URL("../content/lessons/economics-supply-tax-scroll-score.kp.md", import.meta.url), "utf8");
const lock = JSON.parse(readFileSync(new URL("../content/lessons/economics-supply-tax-scroll-score.kp.lock.json", import.meta.url), "utf8")) as KpArticleImportLock;

test("Article companion binds the existing eight beats, references and exact state boundaries", () => {
  const authored = createKpAuthoredMarketSource({ kind: "impose-per-unit-tax" });
  const companion = createKpAuthoringMarketCompanion({ authored, text, lock });
  const query = createKpSemanticStateQuerySession(authored.packet.explanation);
  assert.equal(companion.stops.length, 8);
  assert.deepEqual(companion.score, createKpSupplyTaxPedagogicalScore(authored.source.canonical));
  for (const stop of companion.stops) {
    assert.equal(stop.reference.address, stop.phrase.referenceAddress);
    assert.equal(stop.reference.timelineAuthority, "none");
    assert.equal(stop.address.kind, "settled");
    assert.deepEqual(stop.scene, projectKpSupplyTaxScene({ authority: authored.source.canonical, beat: stop.phrase.beat }));
    const evaluated = query.evaluate(stop.address, authored.packet.stateHandles.refs.outcomes.evaluation);
    assert.equal(evaluated.market.phase, stop.phrase.beat.settledFrame);
    assert.equal(companion.sceneForBeat(stop.phrase.beat.id), stop.scene);
  }
  const [from, to] = companion.stops.slice(1, 3);
  const at = (progress: number) => projectKpSupplyTaxSceneTransition({ from: from!.scene, to: to!.scene, progress, profile: "scrub" });
  const expected = at(0.37);
  at(1); at(0); at(0.8);
  assert.deepEqual(at(0.37), expected);
  assert.throws(() => companion.forBeat("unknown"), KpAuthoringMarketCompanionError);
  query.dispose();
});

test("missing and reordered Article bindings return explicit companion repair gaps", () => {
  const authored = createKpAuthoredMarketSource({ kind: "impose-per-unit-tax" });
  assert.throws(() => createKpAuthoringMarketCompanion({ authored, lock,
    text: text.replace("kp-ref:tax-market/tax", "kp-ref:tax-market/unknown") }), KpAuthoringMarketCompanionError);
  const lines = text.split("\n");
  const first = lines.findIndex(line => line.startsWith("[Before the tax, demand"));
  [lines[first], lines[first + 1]] = [lines[first + 1]!, lines[first]!];
  assert.throws(() => createKpAuthoringMarketCompanion({ authored, lock, text: lines.join("\n") }),
    error => error instanceof KpAuthoringMarketCompanionError && error.path === "article.references");
});

test("ordinary prose edits retain semantic bindings while using the edited Article text", () => {
  const authored = createKpAuthoredMarketSource({ kind: "impose-per-unit-tax" });
  const original = createKpAuthoringMarketCompanion({ authored, text, lock });
  const edited = createKpAuthoringMarketCompanion({ authored, lock,
    text: text.replace("Before the tax, demand and supply meet", "Before imposing the tax, these two curves meet") });
  assert.equal(edited.modelRevisionId, original.modelRevisionId);
  assert.notEqual(edited.stops[0]!.phrase.label, original.stops[0]!.phrase.label);
  assert.deepEqual(edited.stops.map(stop => stop.address), original.stops.map(stop => stop.address));
  assert.deepEqual(edited.stops.map(stop => stop.scene), original.stops.map(stop => stop.scene));
});
