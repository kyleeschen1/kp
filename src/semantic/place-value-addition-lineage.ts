import {
  certifyKpCarryRemainderLineage
} from "../../domains/quantities/place-value-regrouping.ts";
import {
  kpPlaceValueAdditionDecompositions as decomposition
} from "./place-value-addition-decomposition.ts";
import {
  kpPlaceValueAdditionExchangeCertificates as exchange
} from "./place-value-addition-exchange.ts";

const ones = certifyKpCarryRemainderLineage(
  exchange.onesToTens,
  Object.freeze([
    decomposition.first.columns.ones,
    decomposition.second.columns.ones
  ]),
  decomposition.result.columns.ones
);

const tens = certifyKpCarryRemainderLineage(
  exchange.tensToHundreds,
  Object.freeze([
    ones.carry,
    decomposition.first.columns.tens,
    decomposition.second.columns.tens
  ]),
  decomposition.result.columns.tens
);

export const kpPlaceValueAdditionCarryLineages = Object.freeze({
  ones,
  tens
});
