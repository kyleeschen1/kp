import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const providerRoot = fileURLToPath(new URL("../providers/linear-problems", import.meta.url));

test("linear provider depends only on its local modules and the neutral protocol", () => {
  for (const name of readdirSync(providerRoot).filter((entry) => entry.endsWith(".ts"))) {
    const source = readFileSync(join(providerRoot, name), "utf8");
    assert.doesNotMatch(source, /(?:\.\.\/)+src\//, `${name} imports KP source`);
    assert.doesNotMatch(source, /(?:\.\.\/)+domains\//, `${name} imports a KP domain pack`);
    assert.doesNotMatch(source, /\b(?:window|document|HTMLElement|SVGElement)\b/, `${name} uses a presentation API`);
  }
});

