import type { KpArticleDocument } from "../../article/kp-article-document.ts";
import { createKpSupplyTaxScrollScore } from "../kinetic-figure-supply-tax-scroll-score/kinetic-figure-supply-tax-scroll-score-score.ts";
import { createKpSupplyTaxPedagogicalScore } from "../kinetic-figure-supply-tax/kinetic-figure-supply-tax-score.ts";
import { projectKpSupplyTaxScene } from "../kinetic-figure-supply-tax/kinetic-figure-supply-tax-scene.ts";
import type { createKpAuthoredMarketSource } from "../typed-linear-supply-demand/authoring-market-source.ts";
import { projectKpAuthoringMarketClockAddress } from "./authoring-market-clock-address.ts";
import type { KpAuthoredMarketSourceData } from "./authoring-market-source-data.ts";
import type { createKpAuthoringMarketFacts } from "./authoring-market-facts.ts";

export class KpAuthoringMarketCompanionError extends Error {
  readonly code = "kp.authoring.market-companion-gap";
  readonly path: string;
  constructor(path: string, message: string, cause?: unknown) {
    super(message, { cause }); this.name = "KpAuthoringMarketCompanionError"; this.path = path;
  }
}

/** Bind the current Article/score contract, without another authored beat list. */
export function restoreKpAuthoringMarketCompanion(input: {
  readonly authored: ReturnType<typeof createKpAuthoredMarketSource>;
  readonly text: string;
  readonly compiled: { readonly document: KpArticleDocument };
  readonly boundArticle?: KpAuthoredMarketSourceData["article"] & { readonly facts: ReturnType<typeof createKpAuthoringMarketFacts> };
}) {
  const authority = input.authored.source.canonical;
  const compiled = input.compiled;
  let scrollScore: ReturnType<typeof createKpSupplyTaxScrollScore>;
  const bound = input.boundArticle;
  if (bound !== undefined && (bound.modelRevisionId !== input.authored.source.authority.revisionId || bound.text !== input.text)) {
    throw new KpAuthoringMarketCompanionError("boundArticle", "Facts, Article text and model must share one explicit revision.");
  }
  const originalScore = createKpSupplyTaxPedagogicalScore(authority);
  const score = bound === undefined ? originalScore : Object.freeze({ ...originalScore,
    beats: Object.freeze(originalScore.beats.map(beat => {
      const claim = bound.claims[beat.slug as keyof typeof bound.claims];
      if (claim === undefined) throw new KpAuthoringMarketCompanionError(beat.slug, "Missing explicit claim binding.");
      return Object.freeze({ ...beat, claim });
    })) });
  try {
    scrollScore = createKpSupplyTaxScrollScore({ document: compiled.document, score });
  } catch (cause) {
    throw new KpAuthoringMarketCompanionError("article", "Repair the current Article references and import lock.", cause);
  }
  const references = compiled.document.references;
  if (references.length !== scrollScore.phrases.length || references.some((reference, index) =>
    reference.address !== scrollScore.phrases[index]!.referenceAddress)) {
    throw new KpAuthoringMarketCompanionError("article.references", "Article reference order must agree with the supported Scroll Score; a different order needs an explicit supported score.");
  }
  const stops = Object.freeze(scrollScore.phrases.map((phrase, index) => Object.freeze({
    phrase, reference: references[index]!,
    address: projectKpAuthoringMarketClockAddress({ packet: input.authored.packet, member: "tax",
      progress: phrase.beat.settledFrame === "untaxed" ? 0 : 1 }).address,
    scene: projectKpSupplyTaxScene({ authority, beat: phrase.beat })
  })));
  const forBeat = (beatId: string) => {
    const stop = stops.find(item => item.phrase.beat.id === beatId);
    if (!stop) throw new KpAuthoringMarketCompanionError("beatId", `No authored companion binding for ${beatId}.`);
    return stop;
  };
  return Object.freeze({ authority, compiled, score, scrollScore, stops,
    ...(bound === undefined ? {} : { stageFacts: bound.facts.stageFacts }),
    modelRevisionId: input.authored.source.authority.revisionId,
    forBeat, sceneForBeat: (beatId: string) => forBeat(beatId).scene });
}
