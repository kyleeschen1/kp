import type { KpCentroidExtractionState } from "../../semantic/centroid-extraction-model.ts";
import type { centroidClaims } from "./centroid-attention.ts";

type ClaimId = typeof centroidClaims[number]["id"];
interface CentroidReadingBeat {
  readonly id: string;
  readonly text: string;
  readonly checkpoint: KpCentroidExtractionState["id"];
  readonly claims: readonly ClaimId[];
  readonly phrase?: ClaimId;
  readonly because?: { readonly question: string; readonly text: string };
}

// A beat is one authored contribution, not one rendered line or a new motion step.
export const centroidBeats = [
  { id: "beat.want-average", text: "We want the average of these coordinates.", checkpoint: "original", claims: ["answer"] },
  { id: "beat.accumulate", text: "First, accumulate their sum.", checkpoint: "original", claims: ["accumulation"] },
  { id: "beat.divide", text: "Then divide by how many coordinates there are.", checkpoint: "original", claims: ["division"] },
  { id: "beat.whole", text: "The sum and loop belong with the division.", checkpoint: "original", claims: ["accumulation", "division"], phrase: "accumulation",
    because: { question: "Because…", text: "The division needs the completed sum and the length of the same input array. Extracting only the division would leave the repeated accumulation in each caller. The reusable procedure takes one array, visits its values, and produces its average." } },
  { id: "beat.name", text: "Give that whole procedure a name: `mean`.", checkpoint: "extracted", claims: ["accumulation", "division"] },
  { id: "beat.return", text: "Return the division's result to the caller.", checkpoint: "extracted", claims: ["division", "answer"], phrase: "division" },
  { id: "beat.locals", text: "Give the helper its own local names: `vs`, `s`, and `v`.", checkpoint: "generalized", claims: ["accumulation", "division"] },
  { id: "beat.meaning", text: "The caller still names its answer `cx`.", checkpoint: "generalized", claims: ["answer"], phrase: "answer" }
] as const satisfies readonly CentroidReadingBeat[];

export const centroidBeatReading: readonly CentroidReadingBeat[] = centroidBeats;
