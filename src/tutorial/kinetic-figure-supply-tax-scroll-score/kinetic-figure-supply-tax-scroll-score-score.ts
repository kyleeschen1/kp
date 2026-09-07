import type {
  KpArticleDocument,
  KpArticlePassageBlock
} from "../../article/kp-article-document.ts";
import type {
  KpSupplyTaxPedagogicalBeatV1,
  KpSupplyTaxPedagogicalScoreV1
} from
  "../kinetic-figure-supply-tax/kinetic-figure-supply-tax-score.ts";

export const kpSupplyTaxScrollScoreSchemaVersion =
  "kp.economics.supply-tax-scroll-score.v1" as const;

export type KpSupplyTaxScrollScoreAct = "attend" | "motion";

export interface KpSupplyTaxScrollScorePhraseV1 {
  readonly id: string;
  readonly passageId: string;
  readonly referenceAddress: string;
  readonly act: KpSupplyTaxScrollScoreAct;
  readonly beat: KpSupplyTaxPedagogicalBeatV1;
  readonly label: string;
  readonly wordUnits: number;
  readonly restUnits: 1;
  readonly startUnits: number;
  readonly motionEndUnits: number;
  readonly endUnits: number;
}

export interface KpSupplyTaxScrollScorePassageV1 {
  readonly id: string;
  readonly markdown: string;
  readonly initialBeat: KpSupplyTaxPedagogicalBeatV1;
  readonly phrases: readonly KpSupplyTaxScrollScorePhraseV1[];
  readonly offsetUnits: number;
  readonly totalUnits: number;
}

export interface KpSupplyTaxScrollScoreV1 {
  readonly schemaVersion: typeof kpSupplyTaxScrollScoreSchemaVersion;
  readonly id: "score.economics.supply-tax-scroll-score.v1";
  readonly passages: readonly KpSupplyTaxScrollScorePassageV1[];
  readonly phrases: readonly KpSupplyTaxScrollScorePhraseV1[];
  readonly totalUnits: number;
}

export interface KpSupplyTaxScrollScoreSampleV1 {
  readonly units: number;
  readonly progress: number;
  readonly passage: KpSupplyTaxScrollScorePassageV1;
  readonly phrase: KpSupplyTaxScrollScorePhraseV1;
  readonly fromBeat: KpSupplyTaxPedagogicalBeatV1;
  readonly toBeat: KpSupplyTaxPedagogicalBeatV1;
  readonly phraseProgress: number;
  readonly resting: boolean;
}

interface PhraseDeclaration {
  readonly id: string;
  readonly passageId: "market-adjustment" | "welfare-accounting";
  readonly referenceAddress: string;
  readonly beatSlug: KpSupplyTaxPedagogicalBeatV1["slug"];
  readonly act: KpSupplyTaxScrollScoreAct;
}

const declarations = Object.freeze([
  declaration("orient-market", "market-adjustment",
    "tax-market/untaxed-equilibrium", "baseline-market", "attend"),
  declaration("introduce-tax", "market-adjustment",
    "tax-market/tax", "tax-input", "attend"),
  declaration("shift-supply", "market-adjustment",
    "tax-market/taxed-supply", "supply-translation", "motion"),
  declaration("separate-prices", "market-adjustment",
    "tax-market/wedge", "price-wedge", "attend"),
  declaration("contract-quantity", "market-adjustment",
    "tax-market/taxed-equilibrium", "quantity-contraction", "attend"),
  declaration("compare-private-surplus", "welfare-accounting",
    "tax-market/consumer-surplus-taxed", "surplus-redistribution", "attend"),
  declaration("trace-revenue", "welfare-accounting",
    "tax-market/government-revenue", "government-revenue", "attend"),
  declaration("identify-loss", "welfare-accounting",
    "tax-market/deadweight-loss", "deadweight-loss", "attend")
] satisfies readonly PhraseDeclaration[]);

export function createKpSupplyTaxScrollScore(input: {
  readonly document: KpArticleDocument;
  readonly score: KpSupplyTaxPedagogicalScoreV1;
}): KpSupplyTaxScrollScoreV1 {
  const passagesById = new Map(input.document.blocks
    .filter((block): block is KpArticlePassageBlock => block.kind === "passage")
    .map((passage) => [passage.id, passage] as const));
  const referencesByAddress = new Map(input.document.references.map((reference) =>
    [reference.address, reference] as const));
  const beatsBySlug = new Map(input.score.beats.map((beat) =>
    [beat.slug, beat] as const));
  const passageOrder = ["market-adjustment", "welfare-accounting"] as const;
  let globalOffset = 0;
  const passages = passageOrder.map((passageId, passageIndex) => {
    const passage = passagesById.get(passageId);
    if (passage === undefined) {
      throw new Error(`Scroll score is missing Article passage ${passageId}.`);
    }
    const initialBeatSlug = passageIndex === 0
      ? "baseline-market"
      : "quantity-contraction";
    const initialBeat = beatsBySlug.get(initialBeatSlug);
    if (initialBeat === undefined) {
      throw new Error(`Scroll score is missing initial beat ${initialBeatSlug}.`);
    }
    let localOffset = 0;
    const phrases = declarations
      .filter((entry) => entry.passageId === passageId)
      .map((entry) => {
        const reference = referencesByAddress.get(entry.referenceAddress);
        const beat = beatsBySlug.get(entry.beatSlug);
        if (reference?.label === undefined || beat === undefined) {
          throw new Error(`Scroll score cannot bind phrase ${entry.id}.`);
        }
        if (!passage.referenceIds.includes(reference.id)) {
          throw new Error(`Phrase ${entry.id} must remain inside ${passageId}.`);
        }
        const wordUnits = countTextualUnits(reference.label);
        const phrase = Object.freeze({
          id: entry.id,
          passageId,
          referenceAddress: entry.referenceAddress,
          act: entry.act,
          beat,
          label: reference.label,
          wordUnits,
          restUnits: 1 as const,
          startUnits: localOffset,
          motionEndUnits: localOffset + wordUnits,
          endUnits: localOffset + wordUnits + 1
        });
        localOffset = phrase.endUnits;
        return phrase;
      });
    const compiled = Object.freeze({
      id: passageId,
      markdown: passage.markdown,
      initialBeat,
      phrases: Object.freeze(phrases),
      offsetUnits: globalOffset,
      totalUnits: localOffset
    });
    globalOffset += localOffset;
    return compiled;
  });
  if (passagesById.size !== passageOrder.length) {
    throw new Error("Scroll score Article must contain exactly two cue passages.");
  }
  const phrases = Object.freeze(passages.flatMap((passage) => passage.phrases));
  return Object.freeze({
    schemaVersion: kpSupplyTaxScrollScoreSchemaVersion,
    id: "score.economics.supply-tax-scroll-score.v1" as const,
    passages: Object.freeze(passages),
    phrases,
    totalUnits: globalOffset
  });
}

export function sampleKpSupplyTaxScrollScore(
  score: KpSupplyTaxScrollScoreV1,
  requestedUnits: number
): KpSupplyTaxScrollScoreSampleV1 {
  const units = boundedUnits(requestedUnits, score.totalUnits);
  const passage = score.passages.find((candidate) =>
    units <= candidate.offsetUnits + candidate.totalUnits) ??
    score.passages[score.passages.length - 1]!;
  const localUnits = Math.max(0, Math.min(passage.totalUnits,
    units - passage.offsetUnits));
  const phrase = passage.phrases.find((candidate) =>
    localUnits <= candidate.endUnits) ??
    passage.phrases[passage.phrases.length - 1]!;
  const phraseIndex = passage.phrases.indexOf(phrase);
  const fromBeat = phraseIndex === 0
    ? passage.initialBeat
    : passage.phrases[phraseIndex - 1]!.beat;
  const phraseProgress = Math.max(0, Math.min(1,
    (localUnits - phrase.startUnits) / phrase.wordUnits));
  return Object.freeze({
    units,
    progress: score.totalUnits === 0 ? 0 : units / score.totalUnits,
    passage,
    phrase,
    fromBeat,
    toBeat: phrase.beat,
    phraseProgress,
    resting: localUnits >= phrase.motionEndUnits
  });
}

export function kpSupplyTaxScrollScorePhraseHash(
  phrase: KpSupplyTaxScrollScorePhraseV1
): string {
  return `#phrase.${phrase.id}`;
}

export function readKpSupplyTaxScrollScorePhraseFromHash(
  score: KpSupplyTaxScrollScoreV1,
  hash: string
): KpSupplyTaxScrollScorePhraseV1 | undefined {
  const id = hash.startsWith("#phrase.") ? hash.slice("#phrase.".length) : "";
  return score.phrases.find((phrase) => phrase.id === id);
}

export function canonicalKpSupplyTaxScrollScorePhraseUnits(
  score: KpSupplyTaxScrollScoreV1,
  phrase: KpSupplyTaxScrollScorePhraseV1
): number {
  const passage = score.passages.find(({ id }) => id === phrase.passageId);
  if (passage === undefined) throw new Error(`Unknown phrase passage ${phrase.id}.`);
  return passage.offsetUnits + phrase.motionEndUnits;
}

function declaration(
  id: string,
  passageId: PhraseDeclaration["passageId"],
  referenceAddress: string,
  beatSlug: PhraseDeclaration["beatSlug"],
  act: KpSupplyTaxScrollScoreAct
): PhraseDeclaration {
  return Object.freeze({ id, passageId, referenceAddress, beatSlug, act });
}

function countTextualUnits(label: string): number {
  return Math.max(1, label.match(/[\p{L}\p{N}]+/gu)?.length ?? 0);
}

function boundedUnits(value: number, maximum: number): number {
  if (!Number.isFinite(value)) throw new Error("Scroll score units must be finite.");
  return Math.max(0, Math.min(maximum, value));
}
