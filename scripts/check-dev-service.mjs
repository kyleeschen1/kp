import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { assertPortFree, servicePlan } from "./dev-service.mjs";

// Explicit opt-in integration check: briefly restarts only this checkout's jobs.
const root = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), ".."));
const services = servicePlan(root, process.execPath, homedir());
const domain = `gui/${process.getuid()}`;
function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8", cwd: root });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout;
}
function control(action) {
  return run(process.execPath, ["scripts/dev-service.mjs", action]);
}
function pid(service) {
  return run("/bin/launchctl", ["print", `${domain}/${service.label}`]).match(/\bpid = (\d+)/)?.[1];
}
async function eventually(check) {
  const deadline = Date.now() + 45_000;
  let lastError;
  while (Date.now() < deadline) {
    try { await check(); return; } catch (error) { lastError = error; }
    await delay(300);
  }
  throw lastError;
}
async function health() {
  for (const url of ["http://127.0.0.1:8000/reader/solve-fractional-linear/?reading=reasoning", "http://127.0.0.1:8000/api/health"]) {
    const response = await fetch(url, { signal: AbortSignal.timeout(2500) });
    assert.equal(response.status, 200, url);
    await response.arrayBuffer();
  }
}

try {
  control("start");
  await eventually(health);
  const original = services.map(pid);
  control("start");
  assert.deepEqual(services.map(pid), original, "repeated start must not restart healthy jobs");
  for (const service of services) {
    const before = pid(service);
    run("/bin/launchctl", ["kill", "SIGKILL", `${domain}/${service.label}`]);
    await eventually(async () => {
      assert.ok(pid(service));
      assert.notEqual(pid(service), before);
      await health();
    });
    console.log(`${service.name}: recovered after forced process exit; reader and API healthy`);
  }
  control("stop");
  await delay(6500); // Exceed the service restart throttle to detect accidental respawn.
  assert.match(control("status"), /api: stopped/);
  assert.match(control("status"), /web: stopped/);
  for (const service of services) {
    assert.equal(existsSync(service.filename), false, "stop removes login startup");
    await assertPortFree(service.port);
  }
  control("stop");
  console.log("Explicit stop stayed stopped, freed both ports, removed login startup; repeated stop succeeded");
} finally {
  control("start");
  await eventually(health);
  console.log("Left both services running; reader and proxied API return HTTP 200");
}
