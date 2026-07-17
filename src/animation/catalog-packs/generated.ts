import type { KpAnimationAsset } from "../asset.ts";
import { createGeneratedProblemAnimationAsset } from "../generated-problem-import.ts";
import {
  createGeneratedCalculusProblemFixtures
} from "../../semantic/generated-calculus-problem-fixture.ts";
import {
  createGeneratedLinearAlgebraProblemFixtures
} from "../../semantic/generated-linear-algebra-problem-fixture.ts";

export function createKpGeneratedProblemAnimationPack():
  readonly KpAnimationAsset[] {
  return [
    ...createGeneratedCalculusProblemFixtures(),
    ...createGeneratedLinearAlgebraProblemFixtures()
  ].map(createGeneratedProblemAnimationAsset);
}
