import {
  deriveKpArticleDeck,
  type KpArticleDeck,
  type KpArticleDeckScene
} from "../../article/kp-article-deck.ts";
import {
  compileKpArticleDocument,
  type KpArticleDocument,
  type KpCompiledArticleDocument
} from "../../article/kp-article-document.ts";
import type { KpArticleImportLock } from
  "../../article/kp-article-import-lock.ts";
import { createKpArticleSource } from "../../article/kp-article-source.ts";
import { kpEconomicsSupplyTaxVignetteRegistry } from
  "../../article/vignettes/economics-supply-tax-vignette.ts";
import {
  createKpSupplyTaxPedagogicalScore,
  type KpSupplyTaxPedagogicalBeatV1,
  type KpSupplyTaxPedagogicalScoreV1
} from "../../tutorial/kinetic-figure-supply-tax/kinetic-figure-supply-tax-score.ts";

export const kpEconomicsSupplyTaxArticleSourceId =
  "content/lessons/economics-supply-tax.kp.md" as const;

export interface KpSupplyTaxArticleDeckSceneV1 {
  readonly beat: KpSupplyTaxPedagogicalBeatV1;
  readonly articleScene: KpArticleDeckScene;
}

export interface KpSupplyTaxArticleDeckV1 {
  readonly id: "deck.economics.supply-tax-focus.v1";
  readonly documentId: "lesson.economics.supply-tax";
  readonly sourceDeck: KpArticleDeck;
  readonly scenes: readonly KpSupplyTaxArticleDeckSceneV1[];
}

export interface KpCompiledSupplyTaxArticleV1 {
  readonly article: KpCompiledArticleDocument;
  readonly score: KpSupplyTaxPedagogicalScoreV1;
  readonly deck: KpSupplyTaxArticleDeckV1;
}

export function compileKpSupplyTaxArticle(input: {
  readonly text: string;
  readonly lock: KpArticleImportLock;
  readonly sourceId?: string;
}): KpCompiledSupplyTaxArticleV1 {
  const article = compileKpArticleDocument({
    source: createKpArticleSource(
      input.sourceId ?? kpEconomicsSupplyTaxArticleSourceId,
      input.text
    ),
    registry: kpEconomicsSupplyTaxVignetteRegistry,
    lock: input.lock
  });
  const score = createKpSupplyTaxPedagogicalScore();
  const deck = deriveKpSupplyTaxArticleDeck(article.document, score);
  return Object.freeze({ article, score, deck });
}

export function deriveKpSupplyTaxArticleDeck(
  document: KpArticleDocument,
  score: KpSupplyTaxPedagogicalScoreV1 = createKpSupplyTaxPedagogicalScore()
): KpSupplyTaxArticleDeckV1 {
  if (document.id !== "lesson.economics.supply-tax") {
    throw new Error(`Supply-tax deck cannot derive from ${document.id}.`);
  }
  const sourceDeck = deriveKpArticleDeck(document);
  const scenes = score.beats.map((beat) => {
    const candidates = sourceDeck.scenes.filter(({ sourceBlockKeys }) =>
      sourceBlockKeys.includes(beat.slug)
    );
    if (candidates.length !== 1) {
      throw new Error(
        `Beat ${beat.id} must resolve to exactly one Article scene; found ${candidates.length}.`
      );
    }
    return Object.freeze({ beat, articleScene: candidates[0]! });
  });
  const selected = new Set(scenes.map(({ articleScene }) => articleScene.id));
  if (selected.size !== sourceDeck.scenes.length) {
    const unmatched = sourceDeck.scenes
      .filter(({ id }) => !selected.has(id))
      .map(({ id }) => id)
      .join(", ");
    throw new Error(
      `Every Article deck scene must belong to exactly one supply-tax beat; unmatched: ${unmatched}.`
    );
  }
  return Object.freeze({
    id: "deck.economics.supply-tax-focus.v1" as const,
    documentId: "lesson.economics.supply-tax" as const,
    sourceDeck,
    scenes: Object.freeze(scenes)
  });
}
