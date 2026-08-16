import { readFileSync } from "node:fs";
import {
  canonicalVerificationCommands,
  verificationCommandAliases
} from "../src/architecture/verification-command-manifest.ts";

const scripts = (JSON.parse(readFileSync("package.json", "utf8")) as {
  readonly scripts: Readonly<Record<string, string>>;
}).scripts;

console.log("Canonical verification commands\n");
for (const entry of canonicalVerificationCommands) {
  requireScript(entry.command);
  console.log(`${entry.tier.padEnd(9)} npm run ${entry.command}`);
  console.log(`${"".padEnd(9)} ${entry.purpose}`);
}

console.log("\nConvenience aliases\n");
for (const alias of verificationCommandAliases) {
  requireScript(alias.command);
  console.log(`npm run ${alias.command} -> npm run ${alias.target}`);
}

function requireScript(command: string): void {
  if (scripts[command] === undefined) {
    throw new Error(`package.json is missing verification command ${command}.`);
  }
}

