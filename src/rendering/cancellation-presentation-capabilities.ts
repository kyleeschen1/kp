import type { KpCancellationPresentationIntent } from "../semantic/cancellation-presentation-intent.ts";
import type { KpEquationCancellationPresentationRecipe } from "./equation-presentation-policy.ts";

export interface KpCancellationMeasuredTopology {
  readonly sourceCount: number;
  readonly sourceBaselines: "shared" | "distinct";
}

export interface KpCancellationPresentationCapabilities {
  readonly recipe: KpEquationCancellationPresentationRecipe;
  readonly contact: "none" | KpCancellationPresentationIntent["contact"];
  readonly approaches: readonly KpCancellationPresentationIntent["approach"][];
  readonly identityBeats: readonly KpCancellationPresentationIntent["identityBeat"][];
  readonly sourceBaselines: "shared-only" | "shared-or-distinct";
  readonly contactDimensions: "none" | "horizontal" | "horizontal-and-vertical";
  readonly retirement: KpCancellationPresentationIntent["retirement"] | "native";
  readonly readability: KpCancellationPresentationIntent["readability"] | "native";
  readonly minimumSourceCount: 2;
}

function values<const TValue extends string>(...items: readonly TValue[]) {
  return Object.freeze(items);
}

function capabilities(
  value: KpCancellationPresentationCapabilities
): KpCancellationPresentationCapabilities {
  return Object.freeze(value);
}

/** Renderer facts, not authoring choices. The resolver is the sole bridge. */
export const kpCancellationPresentationCapabilities = Object.freeze({
  "native-handoff-v1": capabilities({
    recipe: "native-handoff-v1",
    contact: "none",
    approaches: values(),
    identityBeats: values("implicit"),
    sourceBaselines: "shared-or-distinct",
    contactDimensions: "none",
    retirement: "native",
    readability: "native",
    minimumSourceCount: 2
  }),
  "witnessed-annihilation-v1": capabilities({
    recipe: "witnessed-annihilation-v1",
    contact: "shared-center",
    approaches: values("direct-convergence"),
    identityBeats: values("implicit", "explicit"),
    sourceBaselines: "shared-only",
    contactDimensions: "horizontal",
    retirement: "after-contact",
    readability: "through-contact",
    minimumSourceCount: 2
  }),
  "counter-orbit-v1": capabilities({
    recipe: "counter-orbit-v1",
    contact: "shared-center",
    approaches: values("opposing-arcs"),
    identityBeats: values("implicit", "explicit"),
    sourceBaselines: "shared-or-distinct",
    contactDimensions: "horizontal-and-vertical",
    retirement: "after-contact",
    readability: "through-contact",
    minimumSourceCount: 2
  })
} satisfies Record<
  KpEquationCancellationPresentationRecipe,
  KpCancellationPresentationCapabilities
>);
