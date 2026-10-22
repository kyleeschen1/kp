import { InputComparisonGap, type InputComparison } from "../../math/matrix-input-comparison.ts";

type Beat = Readonly<{ id: string; text: string; targets: readonly string[] }>;
export type ComparisonSource = Readonly<{
  relation: InputComparison;
  title: string;
  introduction: string;
  // Fixed semantic order: compare, subtract, difference, weight, evaluate, sum.
  // Names and prose may vary; this is not an arbitrary choreography score.
  beats: readonly [Beat, Beat, Beat, Beat, Beat, Beat];
  conclusion: string;
  question: string;
  answer: string;
}>;

/** Check references before installing a player, rather than failing halfway
 * through playback. Prose remains an editorial claim, not a verified theorem. */
export function defineComparison(source: ComparisonSource): ComparisonSource {
  const { relation, beats } = source;
  const groups = [relation.inputs.before, relation.inputs.after, relation.outputs.before, relation.outputs.after,
    ...relation.combination.terms.map(term => term.vector)];
  const known = new Set([
    ...groups.flatMap(group => [group.id, ...group.entries.map(entry => entry.id)]),
    relation.inputDifference.id, relation.image.result.id,
    ...relation.product.left.rows.flat().map(entry => entry.id),
    ...relation.inputDifference.rows.flat().map(entry => entry.id),
    ...relation.combination.terms.flatMap(term => [term.coefficient.id, ...term.entries.map(entry => entry.id)]),
    ...relation.combination.result.entries.map(entry => entry.id)
  ]);
  if (beats.length !== 6) throw new InputComparisonGap("Comparison requires six ordered beats: compare, subtract, difference, weight, evaluate, sum.");
  const ids = new Set<string>();
  for (const beat of beats) {
    if (!/^[a-z][a-z0-9-]*$/.test(beat.id) || ids.has(beat.id)) throw new InputComparisonGap(`Unique URL-safe comparison beat required: ${beat.id}.`);
    ids.add(beat.id);
    if (!beat.text.trim() || !beat.targets.length) throw new InputComparisonGap(`Comparison beat needs prose and semantic targets: ${beat.id}.`);
    for (const target of beat.targets) if (!known.has(target)) throw new InputComparisonGap(`Unknown semantic comparison target: ${target}.`);
  }
  for (const key of ["title", "introduction", "conclusion", "question", "answer"] as const)
    if (!source[key].trim()) throw new InputComparisonGap(`Comparison needs ${key}.`);
  const freeze = (beat: Beat): Beat => Object.freeze({ ...beat, targets: Object.freeze([...beat.targets]) });
  const frozen: ComparisonSource["beats"] = [
    freeze(beats[0]), freeze(beats[1]), freeze(beats[2]), freeze(beats[3]), freeze(beats[4]), freeze(beats[5])
  ];
  return Object.freeze({ ...source, beats: Object.freeze(frozen) });
}

export type ComparisonCase = "lost" | "distinguished";
export function readComparisonCase(params: URLSearchParams): ComparisonCase {
  const values = params.getAll("case");
  if (values.length === 0) return "lost";
  if (values.length !== 1 || (values[0] !== "lost" && values[0] !== "distinguished"))
    throw new InputComparisonGap("Choose one comparison case: lost or distinguished.");
  return values[0];
}

export async function loadComparison(id: ComparisonCase): Promise<ComparisonSource> {
  switch (id) {
    case "lost": return (await import("../../../content/authoring/linear-algebra/dependent-columns-comparison.ts")).comparison;
    case "distinguished": return (await import("../../../content/authoring/linear-algebra/distinguished-inputs-comparison.ts")).comparison;
  }
}
