import {
  createKpFractionCompositionSalienceInventory
} from "../../semantic/fraction-composition-salience-inventory.ts";
import {
  resolveKpFractionCompositionArticleSemanticReference
} from "./fraction-composition-semantic-navigation.ts";

export type KpFractionCompositionInspectionLineageId =
  | "variable-term"
  | "constant-term";

export interface KpFractionCompositionInspectionLineage {
  readonly id: KpFractionCompositionInspectionLineageId;
  readonly label: string;
  readonly semanticAddress:
    | "solve/distributed-variable-term"
    | "solve/distributed-constant-term";
  readonly selectorPrefixes: readonly string[];
}

/**
 * These two pedagogical tracks select a bounded path through the canonical
 * correspondence graph. They do not replace the graph or infer identity from
 * rendered glyphs; they only name which verified lineage the reader may ask
 * to inspect in this exemplar.
 */
export const kpFractionCompositionInspectionLineages = Object.freeze([
  lineage({
    id: "variable-term",
    label: "variable term",
    semanticAddress: "solve/distributed-variable-term",
    selectorPrefixes: [
      "fraction-fan-out.source.addend.x",
      "fraction-fan-out.target.factor.x",
      "fraction-fan-out.target.addend.x",
      "fraction-fan-out.target.term.x",
      "fraction-normalization.target.x",
      "constant-product.left.variable",
      "constant-quotient.left.variable"
    ]
  }),
  lineage({
    id: "constant-term",
    label: "constant term",
    semanticAddress: "solve/distributed-constant-term",
    selectorPrefixes: [
      "fraction-fan-out.source.addend.6",
      "fraction-fan-out.target.factor.6",
      "fraction-fan-out.target.addend.6",
      "fraction-fan-out.target.term.6",
      "fraction-normalization.target.6",
      "constant-product.left.constant",
      "constant-product.left.12",
      "constant-quotient.left.4"
    ]
  })
]);

export function resolveKpFractionCompositionInspectionLineageByAddress(
  address: string | undefined
): KpFractionCompositionInspectionLineage | undefined {
  return kpFractionCompositionInspectionLineages.find(
    (lineage) => lineage.semanticAddress === address
  );
}

export function resolveKpFractionCompositionInspectionLineageBySelector(
  selectorId: string
): KpFractionCompositionInspectionLineage | undefined {
  const matches = kpFractionCompositionInspectionLineages.filter(
    ({ selectorPrefixes }) => selectorPrefixes.some((prefix) =>
      selectorId === prefix || selectorId.startsWith(`${prefix}.`)
    )
  );
  return matches.length === 1 ? matches[0] : undefined;
}

function lineage(
  input: KpFractionCompositionInspectionLineage
): KpFractionCompositionInspectionLineage {
  return Object.freeze({
    ...input,
    selectorPrefixes: Object.freeze([...input.selectorPrefixes])
  });
}

export function validateKpFractionCompositionInspectionLineages(): void {
  const inventory = createKpFractionCompositionSalienceInventory();
  const nativeSelectorIds = new Set(inventory.endpoints.flatMap((endpoint) => [
    ...endpoint.selectorIds,
    ...endpoint.structuralAnchorIds
  ]));
  for (const track of kpFractionCompositionInspectionLineages) {
    if (resolveKpFractionCompositionArticleSemanticReference(
      track.semanticAddress
    ) === undefined) {
      throw new Error(
        `Inspection lineage ${track.id} lacks Article address ${track.semanticAddress}.`
      );
    }
    for (const prefix of track.selectorPrefixes) {
      if (![...nativeSelectorIds].some((selectorId) =>
        selectorId === prefix || selectorId.startsWith(`${prefix}.`)
      )) {
        throw new Error(
          `Inspection lineage ${track.id} lacks native selector ${prefix}.`
        );
      }
    }
  }
}
