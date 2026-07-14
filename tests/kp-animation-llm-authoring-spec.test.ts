import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
import test from "node:test";

const specPath =
  "docs/project/authoring/kp-animation-asset-llm-authoring-spec.md";

test("KP animation asset LLM authoring spec records the required contract sections", () => {
  const spec = readFileSync(specPath, "utf8");

  [
    "# KP Animation Asset LLM Authoring Spec",
    "## Authoring Contract",
    "## Composition Rules",
    "## External Ports",
    "## Verification",
    "## Dashboard Exposure",
    "## Decomposition and Flashcards",
    "## Anti-Patterns"
  ].forEach((heading) => assert.match(spec, new RegExp(escapeRegExp(heading))));
});

test("KP animation asset LLM authoring spec points authors at the concrete APIs", () => {
  const spec = readFileSync(specPath, "utf8");

  [
    "KpAnimationAsset",
    "createKpAnimationAsset",
    "createKpAnimationAssetBuilder",
    "checkKpAnimationAssetReferenceClosure",
    "checkKpAnimationAssetSeekRewindLaw",
    "sampleKpAnimationFrameDescriptor",
    "createAnimationAssetAgendaRows",
    "component:<animation-id>"
  ].forEach((api) => assert.match(spec, new RegExp(escapeRegExp(api))));
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
