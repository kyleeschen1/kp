import {
  isKpPlaceValueComponent,
  type KpPlaceValueComponent
} from "./place-value-decomposition.ts";
import {
  isKpPlaceValueSourceContributor,
  type KpPlaceValueSourceContributor
} from "./place-value-regrouping.ts";
import {
  isKpBaseTenPlace,
  type KpBaseTenPlace,
  type KpBaseTenPlaceId
} from "./place-value.ts";

declare const kpSettledColumnEvaluationBrand: unique symbol;

const sealedSettledColumnEvaluations = new WeakSet<object>();

export interface KpSettledColumnEvaluationCertificate<
  Place extends KpBaseTenPlaceId = KpBaseTenPlaceId
> {
  readonly schemaVersion: "kp.settled-column-evaluation-certificate.v1";
  readonly id: `evaluation.${Place}.settled`;
  readonly lawId: "law.place-value.evaluate-without-exchange";
  readonly place: KpBaseTenPlace<Place>;
  readonly contributors: readonly [
    KpPlaceValueSourceContributor<Place>,
    KpPlaceValueSourceContributor<Place>,
    ...KpPlaceValueSourceContributor<Place>[]
  ];
  readonly result: KpPlaceValueComponent<string, Place, "result">;
  readonly digitTotal: number;
  readonly exactTotal: bigint;
  readonly [kpSettledColumnEvaluationBrand]: Place;
}

export function certifyKpSettledColumnEvaluation<
  const Place extends KpBaseTenPlaceId
>(
  place: KpBaseTenPlace<Place>,
  contributors: readonly [
    KpPlaceValueSourceContributor<NoInfer<Place>>,
    KpPlaceValueSourceContributor<NoInfer<Place>>,
    ...KpPlaceValueSourceContributor<NoInfer<Place>>[]
  ],
  result: KpPlaceValueComponent<string, NoInfer<Place>, "result">
): KpSettledColumnEvaluationCertificate<Place> {
  if (!isKpBaseTenPlace(place)) {
    throw new Error(
      "Settled column evaluation requires a compiler-owned place."
    );
  }
  if (
    contributors.length < 2 ||
    !contributors.every((candidate) =>
      isKpPlaceValueSourceContributor(candidate, place.id)
    )
  ) {
    throw new Error(
      `Settled column contributors must be compiler-owned ${place.id} inputs.`
    );
  }
  if (new Set(contributors.map(({ id }) => id)).size !== contributors.length) {
    throw new Error(
      "Settled column contributors must have unique lineage identities."
    );
  }
  if (
    !isKpPlaceValueComponent(result) ||
    result.quantityRole !== "result" ||
    result.place.id !== place.id
  ) {
    throw new Error(
      `Settled column output must be a compiler-owned result in ${place.id}.`
    );
  }

  const digitTotal = contributors.reduce(
    (total, contributor) => total + contributor.digit.value,
    0
  );
  if (digitTotal > 9) {
    throw new Error(
      "A settled column evaluation cannot hide a required place exchange."
    );
  }
  if (result.digit.value !== digitTotal) {
    throw new Error(
      `Settled result ${result.digit.value} does not match contributor total ${digitTotal}.`
    );
  }
  const exactTotal = BigInt(digitTotal) * place.unitValue;
  if (result.exactValue !== exactTotal) {
    throw new Error("Settled column evaluation does not conserve exact value.");
  }

  const certificate = Object.freeze({
    schemaVersion: "kp.settled-column-evaluation-certificate.v1" as const,
    id: `evaluation.${place.id}.settled` as const,
    lawId: "law.place-value.evaluate-without-exchange" as const,
    place,
    contributors: Object.freeze([...contributors]),
    result,
    digitTotal,
    exactTotal
  });
  sealedSettledColumnEvaluations.add(certificate);
  return certificate as unknown as KpSettledColumnEvaluationCertificate<Place>;
}

export function isKpSettledColumnEvaluationCertificate(
  value: unknown
): value is KpSettledColumnEvaluationCertificate {
  return typeof value === "object" &&
    value !== null &&
    sealedSettledColumnEvaluations.has(value);
}
