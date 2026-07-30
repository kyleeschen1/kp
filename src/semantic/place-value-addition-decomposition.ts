import {
  decomposeKpPlaceValueQuantity
} from "../../domains/quantities/place-value-decomposition.ts";
import {
  createKpPlaceValueQuantity
} from "../../domains/quantities/place-value.ts";

export const kpPlaceValueAdditionQuantities = Object.freeze({
  first: createKpPlaceValueQuantity("digit.first", "addend", 278n),
  second: createKpPlaceValueQuantity("digit.second", "addend", 156n),
  result: createKpPlaceValueQuantity("result", "result", 434n)
});

/**
 * These IDs intentionally coincide with the semantic cell IDs in the frozen
 * visual reference. A projection can look up paint by lineage without minting
 * a second identity namespace or encoding the example in geometry.
 */
export const kpPlaceValueAdditionDecompositions = Object.freeze({
  first: decomposeKpPlaceValueQuantity(kpPlaceValueAdditionQuantities.first),
  second: decomposeKpPlaceValueQuantity(kpPlaceValueAdditionQuantities.second),
  result: decomposeKpPlaceValueQuantity(kpPlaceValueAdditionQuantities.result)
});
