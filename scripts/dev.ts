import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { resolve } from "node:path";

interface DevProcess {
  name: string;
  command: string;
  args: readonly string[];
  env?: NodeJS.ProcessEnv;
}

const processes: readonly DevProcess[] = [
  {
    name: "api",
    command: process.execPath,
    args: ["--disable-warning=ExperimentalWarning", "--watch", "server/main.ts"],
    env: {
      ...process.env,
      KP_DEV_REVIEW: "1",
      KP_DEV_REVIEW_ROOT: resolve(process.cwd(), ".kp/review-logs")
    }
  },
  {
    name: "web",
    command: resolveBin("vite"),
    args: []
  }
];

const children: ChildProcess[] = [];
let shuttingDown = false;

for (const devProcess of processes) {
  const child = spawn(devProcess.command, devProcess.args, {
    env: devProcess.env ?? process.env,
    shell: process.platform === "win32",
    stdio: "inherit"
  });

  children.push(child);

  child.once("error", (error) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    console.error(`[dev] ${devProcess.name} failed to start:`, error);
    stopChildren();
    process.exit(1);
  });

  child.once("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    const reason = signal ?? `code ${code ?? 1}`;
    console.error(`[dev] ${devProcess.name} exited with ${reason}`);
    stopChildren();
    process.exit(code ?? 1);
  });
}

process.once("SIGINT", () => {
  shutdown("SIGINT");
});

process.once("SIGTERM", () => {
  shutdown("SIGTERM");
});

function resolveBin(name: string): string {
  return process.platform === "win32" ? `${name}.cmd` : name;
}

function shutdown(signal: NodeJS.Signals): void {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log(`[dev] received ${signal}; stopping servers`);
  stopChildren();
}

function stopChildren(): void {
  for (const child of children) {
    if (child.killed) {
      continue;
    }

    child.kill();
  }
}
