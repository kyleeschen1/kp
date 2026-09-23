import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { SupportedAuthorTask } from "../src/authoring/supported-author-tasks.ts";

export const repeatabilityCases = [
  {
    "id": "fraction-add-reduce",
    "task": "equation.fraction-chain",
    "expected": "checked",
    "intent": "Align fifths and tenths, combine without skipping the raw numerator, then reduce.",
    "sha256": "c296088f78c6fdc10a4cbea4ac7935aa635280db7668d5f7af5a6abbde0f1bb4"
  },
  {
    "id": "fraction-subtract",
    "task": "equation.fraction-chain",
    "expected": "checked",
    "intent": "Align both operands, preserve subtraction order and stop at the unreduced result.",
    "sha256": "e5e70296274e6cc2aea23485780ad5027d9b0695252f7ef0d99f250bf644b9d5"
  },
  {
    "id": "fraction-false-count",
    "task": "equation.fraction-chain",
    "expected": "repair-gap",
    "intent": "Reject a false numerator sum without applying a fallback.",
    "sha256": "9cc8e6186874f7a2b6948a849b20b2719a21f7176186db82d7bbca34e66dc287"
  },
  {
    "id": "algebra-single-digit",
    "task": "equation.common-factor",
    "expected": "checked",
    "intent": "Reuse native factoring with renamed symbols and a single-digit factor.",
    "sha256": "3483aa640b7b8e6f68b26314a741fc527f2aed71ef290ba308d96fb9e1d0e993"
  },
  {
    "id": "algebra-composite-factor",
    "task": "equation.common-factor",
    "expected": "repair-gap",
    "intent": "Retain the valid distributive identity but report unsupported composite-factor paint.",
    "sha256": "9b2b99ac32f14498d3a9ed6d1b59051762f9826802732824b7c744b4f06db7ba"
  },
  {
    "id": "mechanics-declared",
    "task": "mechanics.momentum-energy",
    "expected": "checked",
    "intent": "Check the existing declared assumptions without claiming editable or applied mechanics source.",
    "sha256": "c7ca69fe0812b4d07fdd06ba89f4450cc0fd423b84366e61eb797cb20fa64e22"
  },
  {
    "id": "mechanics-zero-mass",
    "task": "mechanics.momentum-energy",
    "expected": "repair-gap",
    "intent": "Reject zero mass, which does not license division by mass.",
    "sha256": "2792cc9602dc5892c57d7334494fabfd58587f845daf95d426813bb64217f142"
  },
  {
    "id": "code-purpose",
    "task": "reasoning.code",
    "expected": "checked",
    "intent": "Change instructional purpose while preserving both programs and all stage pins.",
    "sha256": "0907477bb086112289c8846f0c77d5909991e494a6ec58d984be38c71501f825"
  },
  {
    "id": "code-boundaries",
    "task": "reasoning.code",
    "expected": "checked",
    "intent": "Emphasize the declared behavior cases without asserting universal program equivalence.",
    "sha256": "6329b8209723d03a7927536ed3296c6d1adc35a260229c448fd721a973a93c08"
  },
  {
    "id": "code-changed-source",
    "task": "reasoning.code",
    "expected": "repair-gap",
    "intent": "Reject a foreign source revision rather than borrowing reference evidence.",
    "sha256": "4f3aa3f03f34b967e9830ed432423a49d1c4030e2c33ddbd8eade34d4da6e30b"
  }
] as const satisfies readonly {
  readonly id: string; readonly task: SupportedAuthorTask; readonly expected: "checked" | "repair-gap";
  readonly intent: string; readonly sha256: string;
}[];
export type RepeatabilityCase = typeof repeatabilityCases[number];

export function readFrozenInput(item: RepeatabilityCase): string {
  const input = readFileSync(new URL(`../content/authoring/repeatability/${item.id}.json`, import.meta.url), "utf8");
  return verifyFrozenInput(item, input);
}

export function verifyFrozenInput(item: RepeatabilityCase, input: string): string {
  if (createHash("sha256").update(input).digest("hex") !== item.sha256)
    throw new Error(`Frozen input changed: ${item.id}. Retain the original case; do not refresh its hash.`);
  return input;
}
