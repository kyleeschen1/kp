import { spawn } from "node:child_process";

const url =
  "http://127.0.0.1:8000/glyph-reconciliation-experiment.html?hostParity=radical";
const command = process.platform === "darwin" ? "open" : "xdg-open";
const child = spawn(command, [url], {
  detached: true,
  stdio: "ignore"
});
child.unref();
console.log(`Opened canonical host parity review: ${url}`);
