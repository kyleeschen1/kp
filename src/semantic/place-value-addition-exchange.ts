import {
  certifyKpAdjacentPlaceExchange
} from "../../domains/quantities/place-value-exchange.ts";
import {
  certifyKpAdjacentBaseTenPlaces,
  kpBaseTenPlaces
} from "../../domains/quantities/place-value.ts";

const onesToTens = certifyKpAdjacentBaseTenPlaces(
  kpBaseTenPlaces.ones,
  kpBaseTenPlaces.tens
);
const tensToHundreds = certifyKpAdjacentBaseTenPlaces(
  kpBaseTenPlaces.tens,
  kpBaseTenPlaces.hundreds
);

export const kpPlaceValueAdditionExchangeCertificates = Object.freeze({
  onesToTens: certifyKpAdjacentPlaceExchange(onesToTens, 10n, 1n),
  tensToHundreds: certifyKpAdjacentPlaceExchange(tensToHundreds, 10n, 1n)
});
