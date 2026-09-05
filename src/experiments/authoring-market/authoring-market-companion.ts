import type { KpArticleImportLock } from "../../article/kp-article-import-lock.ts";
import { compileKpSupplyTaxScrollScoreArticle } from "../kinetic-figure-supply-tax-scroll-score/kinetic-figure-supply-tax-scroll-score-article.ts";
import { createKpSupplyTaxScrollScore } from "../kinetic-figure-supply-tax-scroll-score/kinetic-figure-supply-tax-scroll-score-score.ts";
import { createKpSupplyTaxPedagogicalScore } from "../kinetic-figure-supply-tax/kinetic-figure-supply-tax-score.ts";
import { projectKpSupplyTaxScene } from "../kinetic-figure-supply-tax/kinetic-figure-supply-tax-scene.ts";
import type { createKpAuthoredMarketSource } from "../typed-linear-supply-demand/authoring-market-source.ts";
import { projectKpAuthoringMarketClockAddress } from "./authoring-market-clock-address.ts";

export class KpAuthoringMarketCompanionError extends Error {
  readonly code = "kp.authoring.market-companion-gap";
  readonly path: string;
  constructor(path: string, message: string, cause?: unknown) {
    super(message, { cause }); this.name = "KpAuthoringMarketCompanionError"; this.path = path;
  }
}

/** Bind the current Article/score contract, without another authored beat list. */
export function createKpAuthoringMarketCompanion(input: {
  readonly authored: ReturnType<typeof createKpAuthoredMarketSource>;
  readonly text: string;
  readonly lock: KpArticleImportLock;
}) {
  const authority = input.authored.source.canonical;
  let compiled: ReturnType<typeof compileKpSupplyTaxScrollScoreArticle>;
  let scrollScore: ReturnType<typeof createKpSupplyTaxScrollScore>;
  const score = createKpSupplyTaxPedagogicalScore(authority);
  try {
    compiled = compileKpSupplyTaxScrollScoreArticle(input);
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
    modelRevisionId: input.authored.source.authority.revisionId,
    forBeat, sceneForBeat: (beatId: string) => forBeat(beatId).scene });
}
