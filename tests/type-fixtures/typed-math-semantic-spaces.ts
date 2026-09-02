import {
  defineKpSemanticSpace,
  type KpSemanticSpace,
  type KpSemanticSpaceValue
} from "../../src/math/algebra/semantic-space.ts";

const quantity = defineKpSemanticSpace<number>()({
  id: "kp.space.quantity",
  dimension: 1
});
const price = defineKpSemanticSpace<number>()({
  id: "kp.space.price",
  dimension: 1
});

const quantitySpace: KpSemanticSpace<number, "kp.space.quantity"> = quantity;
const quantityValue: KpSemanticSpaceValue<typeof quantity> = 4;

function requireQuantity(
  _space: KpSemanticSpace<number, "kp.space.quantity">
): void {}

requireQuantity(quantity);
// @ts-expect-error Equal dimensions do not make price the quantity space.
requireQuantity(price);

void quantitySpace;
void quantityValue;
