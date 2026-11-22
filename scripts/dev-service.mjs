import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, realpathSync, unlinkSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), ".."));

function xml(value) {
  return String(value).replace(/[<>&"']/g, (character) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;"
  })[character]);
}

export function servicePlan(checkout, node, home) {
  // Identity follows the checkout, so another lane cannot stop this server.
  const id = createHash("sha256").update(checkout).digest("hex").slice(0, 12);
  const logRoot = resolve(checkout, "logs/dev-service");
  return ["api", "web"].map((name) => {
    const label = `com.kineticpress.dev.${id}.${name}`;
    const port = name === "web" ? 8000 : 8001;
    const args = name === "web"
      ? [node, resolve(checkout, "node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--port", String(port), "--strictPort"]
      : [node, "--disable-warning=ExperimentalWarning", "--watch", resolve(checkout, "server/main.ts")];
    const env = {
      PATH: `${dirname(node)}:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`,
      HOST: "127.0.0.1", PORT: "8001", API_TARGET: "http://127.0.0.1:8001",
      KP_DEV_REVIEW: "1", KP_ARTICLE_SOURCE_WRITE: "1",
      KP_DEV_REVIEW_ROOT: resolve(checkout, ".kp/review-logs")
    };
    const log = resolve(logRoot, `${name}.log`);
    const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>${label}</string>
<key>ProgramArguments</key><array>${args.map((arg) => `<string>${xml(arg)}</string>`).join("")}</array>
<key>WorkingDirectory</key><string>${xml(checkout)}</string>
<key>EnvironmentVariables</key><dict>${Object.entries(env).map(([key, value]) => `<key>${key}</key><string>${xml(value)}</string>`).join("")}</dict>
<key>RunAtLoad</key><true/>
<key>KeepAlive</key><true/>
<key>ThrottleInterval</key><integer>5</integer>
<key>StandardOutPath</key><string>${xml(log)}</string>
<key>StandardErrorPath</key><string>${xml(log)}</string>
</dict></plist>
`;
    return { name, label, port, log, plist, filename: resolve(home, "Library/LaunchAgents", `${label}.plist`) };
  });
}

export async function assertPortFree(port) {
  await new Promise((done, reject) => {
    const server = createServer();
    server.once("error", (error) => reject(new Error(`Port ${port} unavailable; refusing to replace another server: ${error.message}`)));
    server.listen(port, "127.0.0.1", () => server.close(done));
  });
}

function launchctl(args, required = true) {
  const result = spawnSync("/bin/launchctl", args, { encoding: "utf8" });
  if (result.error) throw result.error;
  if (required && result.status !== 0) {
    throw new Error(`launchctl ${args.join(" ")}: ${result.stderr.trim() || result.stdout.trim()}`);
  }
  return result;
}

function loaded(target) {
  const result = launchctl(["print", target], false);
  if (result.status === 0) return result.stdout;
  if (/Could not find service/.test(result.stderr)) return null;
  throw new Error(`Cannot inspect ${target}: ${result.stderr.trim()}`);
}

export async function main(action) {
  if (!["start", "stop", "status"].includes(action)) throw new Error("Use dev:service:start, dev:service:stop, or dev:service:status.");
  if (process.platform !== "darwin") throw new Error("Persistent dev services use macOS launchd. Use npm run dev on other platforms.");
  const domain = `gui/${process.getuid()}`;
  const services = servicePlan(root, process.execPath, homedir());
  const states = services.map((service) => loaded(`${domain}/${service.label}`));

  if (action === "start") {
    // Preflight both jobs before installing either; never adopt occupied ports.
    for (const [index, service] of services.entries()) {
      if (states[index] === null) await assertPortFree(service.port);
      if (existsSync(service.filename) && readFileSync(service.filename, "utf8") !== service.plist) {
        throw new Error(`Saved service differs: ${service.filename}. Stop this checkout's services before reinstalling.`);
      }
    }
    for (const [index, service] of services.entries()) {
      mkdirSync(dirname(service.log), { recursive: true });
      mkdirSync(dirname(service.filename), { recursive: true });
      if (!existsSync(service.filename)) writeFileSync(service.filename, service.plist, { flag: "wx", mode: 0o600 });
      if (states[index] === null) launchctl(["bootstrap", domain, service.filename]);
    }
    console.log("Installed persistent localhost services; launchd restarts exits and starts them again at login.");
  } else if (action === "stop") {
    for (const [index, service] of services.entries()) {
      // Unload before removal: killing a PID alone would trigger KeepAlive.
      if (states[index] !== null) launchctl(["bootout", `${domain}/${service.label}`]);
      if (existsSync(service.filename)) unlinkSync(service.filename);
    }
    console.log("Stopped this checkout's services and removed automatic login startup.");
  }

  console.log(`Checkout: ${root}`);
  for (const service of services) {
    const state = loaded(`${domain}/${service.label}`);
    console.log(`${service.name}: ${state?.match(/\bstate = (.+)/)?.[1] ?? "stopped"}; PID ${state?.match(/\bpid = (\d+)/)?.[1] ?? "none"}; log ${service.log}`);
  }
  if (action !== "stop") console.log("URL: http://127.0.0.1:8000/ (status above is process state, not an HTTP health check)");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv[2]).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
