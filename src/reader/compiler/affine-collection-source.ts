import { deriveAffineCollection, defaultAffineCollection, AffineCollectionRepair, type AffineCollectionDerivation } from "../../semantic/affine-collection-source.ts";

/** Source is extracted before ordinary lesson parsing. A pinned animation in
 * prose alone still cannot replace mathematics; this explicit block can. */
export function readAffineCollectionLesson(markdown: string) {
  const blocks = [...markdown.matchAll(/^```kp-affine-collection\s*\n([\s\S]*?)^```\s*$/gm)];
  if (!blocks.length) {
    if (markdown.includes("```kp-affine-collection")) throw new AffineCollectionRepair("$", "Close the affine collection source fence.");
    return { derivation: defaultAffineCollection, markdown, authored: false };
  }
  if (blocks.length !== 1) throw new AffineCollectionRepair("$", "Use exactly one affine collection source block.");
  let source: unknown;
  try { source = JSON.parse(blocks[0]![1]!); }
  catch { throw new AffineCollectionRepair("$", "The affine collection block must contain valid JSON."); }
  const derivation = deriveAffineCollection(source);
  const prose = markdown.replace(blocks[0]![0], "");
  return { derivation, authored: true, markdown: prose.includes("```kp-animation-story") ? prose : prose + affineCollectionStory(derivation) };
}

function affineCollectionStory(d: AffineCollectionDerivation): string {
  const stops = ["factored", "distributed", "products-evaluated", "grouped", "coefficient-factored", "collected"];
  const progress = [0, 230, 460, 650, 825, 1000];
  const titles = ["Read the grouped products", "Distribute to each term", "Evaluate constant products", "Gather like terms", "Keep the common variable", "Evaluate the sums"];
  const notes = [
    `Both outside factors multiply their entire group. The second group contains the signed constant ${d.d}.`,
    `Each factor reaches both terms. Keep the constant products visible before evaluating them.`,
    `${d.a} times ${d.b} is ${d.p}; ${d.c} times ${d.d} is ${d.q}. The negative sign belongs to its constant.`,
    `Move the ${d.x} terms together and the signed constants together without changing their values.`,
    `Keep one common ${d.x}. Its coefficient is the unevaluated sum ${d.a} + ${d.c}.`,
    `The coefficient is ${d.coefficient}; the signed constants total ${d.constant}. Their signs remain part of the result.`
  ];
  return "\n```kp-animation-story\n" + JSON.stringify({ id: "story.foldable-distribution",
    asset: { id: "animation.foldable-distribution.collect-like-terms", version: "1" }, presentation: "scroll-scrub",
    beats: stops.map((checkpointId, i) => ({ id: `beat.${checkpointId}`, checkpointId, progressPermille: progress[i],
      title: titles[i], content: notes[i], focusRefs: [] })) }, null, 2) + "\n```\n";
}
