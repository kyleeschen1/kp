import { execFileSync } from "node:child_process";

export function architectureSourcePaths() {
  // Bound enumeration before buffering; durable event history is not source.
  return execFileSync("git", ["ls-files", "-z", "--", "src", "tests", "scripts", "domains"],
    { encoding: "utf8" }).split("\0").filter(Boolean);
}
