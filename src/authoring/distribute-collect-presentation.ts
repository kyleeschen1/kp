import { readKpComposedAlgebraDataRecord, KpComposedAlgebraRepair } from "./composed-algebra-source.ts";
import { checkKpComposedAlgebraProof } from "./composed-algebra-proof.ts";
import { normalizeKpScalarSumProductEndpoint } from "./common-factor-normalizer.ts";
import { verifyKpDistributionBeforeCollection } from "../semantic/distribute-collect.ts";
import { resolveDistributionBeforeCollection, resolveKpFactoringOperationBinding, resolveKpEvaluationOperationBinding } from "./canonical-algebra-operation-binding.ts";
import { composeKpEquationOperationAssets } from "../animation/compose-equation-operation-assets.ts";
import { sha256 } from "../kernel/sha256.ts";

const issued = new WeakMap<object, string>();

/** A bounded content template, not a general algebra source language. Both
 * examples enter the existing proof owners before any presentation is issued. */
export function prepareDistributeCollect(value: unknown) {
  const data = readKpComposedAlgebraDataRecord(value, "$", ["coefficient", "symbol"]);
  const k = data["coefficient"], x = data["symbol"];
  if (typeof k !== "number" || !Number.isInteger(k) || k < 2 || k > 9)
    throw new KpComposedAlgebraRepair("unsupported-shape", "$.coefficient", "Use an integer coefficient from 2 through 9 for this trial.");
  if (typeof x !== "string" || !/^[A-Za-z]$/.test(x))
    throw new KpComposedAlgebraRepair("undeclared-symbol", "$.symbol", "Use one Latin-letter real scalar.");
  const source = Object.freeze({ coefficient: k, symbol: x });
  const revisionId = `sha256:${sha256(JSON.stringify(source))}`, id = `expression.distribute-collect.${revisionId.slice(7)}`;
  const initial = Object.freeze({ id: `${id}.initial`, latex: `${k}(${x}+${x})`,
    narration: `There are ${k} copies of a group containing two occurrences of ${x}. Distribute the coefficient to both.` });
  const collection = checkKpComposedAlgebraProof({ schemaVersion: "kp.composed-algebra-source.v1",
    id: `lesson.distribute-collect.${revisionId.slice(7)}`, domain: "real-scalars", symbols: [x],
    states: [
      { id: `${id}.distributed`, latex: `${k}${x}+${k}${x}`, narration: `Each occurrence received the coefficient ${k}. Both terms are multiples of the same ${x}, so their counts can be added.` },
      { id: `${id}.collected`, latex: `(${k}+${k})${x}`, narration: `Keep ${x} as the common factor. The coefficient records how many copies there are in total.` },
      { id: `${id}.evaluated`, latex: `${2 * k}${x}`, narration: `The coefficient sum is ${2 * k}. This expression has the same value for every real ${x}; no value for ${x} was chosen.` }
    ], editorial: { title: "Distribute, then collect", setup: "Watch what is copied, what is kept, and what is evaluated.",
      summary: "Distribution copies the coefficient. Collection keeps the common variable. Arithmetic evaluates only the count." } });
  try {
    const factoring = resolveKpFactoringOperationBinding(collection.chain.steps[0]);
    const evaluation = resolveKpEvaluationOperationBinding(collection.chain.steps[1]);
    const before = normalizeKpScalarSumProductEndpoint(initial, [x], "$.initial").structured;
    const proof = verifyKpDistributionBeforeCollection(before, collection.chain.steps[0]);
    const first = resolveDistributionBeforeCollection(proof);
    const composition = composeKpEquationOperationAssets(`animation.distribute-collect.${revisionId.slice(7)}`,
      collection.source.editorial.title, [first.animation, factoring.animation, evaluation.animation]);
    const draft = Object.freeze({ owner: "canonical-distribute-collect" as const, revisionId, source,
      checked: Object.freeze({ source: Object.freeze({ ...collection.source,
        states: Object.freeze([initial, ...collection.source.states]) }), distribution: proof, collection }),
      steps: Object.freeze([first, factoring, evaluation]), ...composition });
    issued.set(draft, JSON.stringify(draft));
    return draft;
  } catch (error) {
    if (error instanceof KpComposedAlgebraRepair) throw error;
    throw new KpComposedAlgebraRepair("unsupported-presentation", "$.states", error instanceof Error ? error.message : "Canonical composition failed.");
  }
}
export type DistributeCollectPresentation = ReturnType<typeof prepareDistributeCollect>;
export function assertDistributeCollect(value: unknown): asserts value is DistributeCollectPresentation {
  if (!value || typeof value !== "object" || !issued.has(value) || issued.get(value) !== JSON.stringify(value))
    throw new TypeError("Use an unchanged, issued distribute/collect presentation.");
}
