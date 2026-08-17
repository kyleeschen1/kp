import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import type { Plugin, UserConfig } from "vite";

type KpViteBuild = NonNullable<UserConfig["build"]>;
type KpViteRollupOptions = NonNullable<KpViteBuild["rollupOptions"]>;

export interface KpReviewBuildIdentity {
  readonly commit: string;
  readonly fingerprint: string;
  readonly dirty: boolean;
}

export function kpViteProjectRoot(configUrl: string): string {
  return fileURLToPath(new URL(".", configUrl));
}

export function kpViteProductionBuild(input: {
  readonly entries: NonNullable<KpViteRollupOptions["input"]>;
  readonly outDir?: string | undefined;
  readonly output?: KpViteRollupOptions["output"] | undefined;
}): KpViteBuild {
  return {
    ...(input.outDir === undefined
      ? {}
      : { outDir: input.outDir, emptyOutDir: true }),
    manifest: true,
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: input.entries,
      ...(input.output === undefined ? {} : { output: input.output })
    }
  };
}

export function kpViteDevelopmentServer(input: {
  readonly port: number;
  readonly apiTarget?: string | undefined;
}): NonNullable<UserConfig["server"]> {
  return {
    host: "127.0.0.1",
    port: input.port,
    strictPort: true,
    watch: { ignored: ["**/tmp/codex/**"] },
    ...(input.apiTarget === undefined
      ? {}
      : {
          proxy: {
            "/api": { changeOrigin: true, target: input.apiTarget }
          }
        })
  };
}

export function kpViteScopedRootRedirectPlugin(input: {
  readonly name: string;
  readonly pathname: string;
}): Plugin {
  return {
    name: input.name,
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url === undefined ||
            new URL(request.url, "http://127.0.0.1").pathname !== "/") {
          next();
          return;
        }
        response.statusCode = 307;
        response.setHeader("location", input.pathname);
        response.end();
      });
    }
  };
}

export function kpViteLiveReviewBuildPlugin(input: {
  readonly name: string;
  readonly projectRoot: string;
}): Plugin {
  return {
    name: input.name,
    configureServer(server) {
      server.middlewares.use("/__kp/dev-review/build", (_request, response) => {
        response.setHeader("content-type", "application/json");
        response.setHeader("cache-control", "no-store");
        response.end(JSON.stringify(
          readKpReviewBuildIdentity(input.projectRoot)
        ));
      });
    }
  };
}

export function readKpReviewBuildIdentity(
  projectRoot: string
): KpReviewBuildIdentity {
  try {
    const commit = execFileSync("git", ["rev-parse", "--short=12", "HEAD"], {
      cwd: projectRoot,
      encoding: "utf8"
    }).trim();
    const dirty = execFileSync(
      "git",
      ["status", "--porcelain", "--untracked-files=no"],
      { cwd: projectRoot, encoding: "utf8" }
    ).trim().length > 0;
    return Object.freeze({
      commit,
      fingerprint: dirty ? `${commit}-dirty` : commit,
      dirty
    });
  } catch {
    return Object.freeze({
      commit: "unknown",
      fingerprint: "dev-unknown",
      dirty: true
    });
  }
}
