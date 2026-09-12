import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  canonicalVerificationCommands,
  verificationCommandAliases
} from "../src/architecture/verification-command-manifest.ts";

const scripts = (JSON.parse(readFileSync("package.json", "utf8")) as {
  readonly scripts: Readonly<Record<string, string>>;
}).scripts;

test("verification tiers and aliases stay executable and discoverable", () => {
  assert.deepEqual(
    canonicalVerificationCommands.slice(0, 4).map(({ tier }) => tier),
    ["inner", "boundary", "promotion", "release"]
  );
  for (const entry of canonicalVerificationCommands) {
    assert.ok(scripts[entry.command], entry.command);
  }
  for (const alias of verificationCommandAliases) {
    assert.equal(scripts[alias.command], `npm run ${alias.target}${alias.forwardArguments ? " --" : ""}`);
    assert.ok(scripts[alias.target], alias.target);
  }
  assert.ok(scripts["verify:commands"]?.includes("list-verification-commands.ts"));
});
