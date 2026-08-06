import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

import {
  kpReaderRouteEntryName,
  kpReaderRouteHtmlPath
} from "./src/reader/compiler/reader-route-descriptor.ts";
import { kpReaderRouteManifest } from "./src/reader/compiler/reader-route-manifest.ts";
import {
  compactKpCompiledReaderHtml
} from "./src/reader/compiler/compiled-reader-html.ts";
import { createKpLispBotanicalPresentationPlan } from
  "./src/animation/lisp-botanical-presentation-plan.ts";
import { sampleKpLispLambdaApplicationRuntimeFrame } from
  "./src/animation/lisp-lambda-application-runtime-frame.ts";
import { createKpLispLambdaApplicationAsset } from
  "./src/semantic/lisp-lambda-application-asset.ts";
import { compileKpLispFunctionApplicationPublication } from
  "./src/tutorial/lisp-function-application/lisp-function-application-publication.ts";
import { renderKpLispFunctionApplicationStaticPublication } from
  "./src/tutorial/lisp-function-application/lisp-function-application-static-publication.ts";
import { createKpLispLessonStageProjector } from
  "./src/tutorial/lisp-function-application/lisp-function-application-stage-projector.ts";

const apiTarget = process.env["API_TARGET"] ?? "http://127.0.0.1:8001";
const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const readerBuildRoutes = kpReaderRouteManifest.map((descriptor) => ({
  descriptor,
  filename: resolve(projectRoot, kpReaderRouteHtmlPath(descriptor.route)),
  markdown: readFileSync(resolve(projectRoot, descriptor.sourcePath), "utf8")
}));
const readerBuildRouteByFilename = new Map(
  readerBuildRoutes.map((route) => [route.filename, route] as const)
);
const reviewBuildIdentity = readReviewBuildIdentity();
const lispTutorialFilename = resolve(
  projectRoot,
  "tutorials/programming/lisp-function-application/index.html"
);
const lispTutorialStaticFallback = compileLispTutorialStaticFallback();

export default defineConfig({
  define: {
    __KP_DEV_REVIEW_BUILD__: JSON.stringify(reviewBuildIdentity)
  },
  plugins: [
    // Svelte owns only catalogue application composition; animation assets,
    // clocks, sampled frames, and renderer ports remain plain TypeScript.
    svelte(),
    {
      name: "kp-live-dev-review-build",
      configureServer(server) {
        server.middlewares.use(
          "/__kp/dev-review/build",
          (_request, response) => {
            // The config-time define becomes stale across commits while the
            // dev server stays open. Review evidence asks this read-only
            // endpoint for the current worktree identity at capture time.
            response.setHeader("content-type", "application/json");
            response.setHeader("cache-control", "no-store");
            response.end(JSON.stringify(readReviewBuildIdentity()));
          }
        );
      }
    },
    {
      name: "kp-semantic-reader-route",
      transformIndexHtml: {
        order: "pre",
        handler(html, context) {
          const route = readerBuildRouteByFilename.get(context.filename);
          return route === undefined
            ? html
            : route.descriptor.compile(route.markdown).html;
        }
      }
    },
    {
      name: "kp-reader-html-compaction",
      transformIndexHtml: {
        order: "post",
        handler(html, context) {
          return readerBuildRouteByFilename.has(context.filename)
            ? compactKpCompiledReaderHtml(html)
            : html;
        }
      }
    },
    {
      name: "kp-lisp-tutorial-static-fallback",
      transformIndexHtml: {
        order: "pre",
        handler(html, context) {
          return context.filename === lispTutorialFilename
            ? html.replace(
                "<!-- kp:lisp-static-fallback -->",
                lispTutorialStaticFallback
              )
            : html;
        }
      }
    }
  ],
  build: {
    manifest: true,
    // All supported publication targets implement modulepreload. Shipping the
    // legacy polyfill would add a startup request to every route.
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: {
        main: resolve(projectRoot, "index.html"),
        glyphReconciliationExperiment: resolve(projectRoot, "glyph-reconciliation-experiment.html"),
        canonicalAnimationReview: resolve(projectRoot, "canonical-animation-review.html"),
        economicsDemandShiftTutorial: resolve(
          projectRoot,
          "tutorials/economics/demand-shift/index.html"
        ),
        lispFunctionApplicationTutorial: lispTutorialFilename,
        ...Object.fromEntries(readerBuildRoutes.map(({ descriptor, filename }) => [
          kpReaderRouteEntryName(descriptor.route),
          filename
        ]))
      },
      output: {
        manualChunks(id) {
          // Both tutorial routes should pay for one lazy platform seam, not a
          // request per extracted primitive. Domain assets remain separately
          // lazy and the catalogue entry does not eagerly import this chunk.
          if (
            !id.includes(".css") &&
            (id.includes("/src/tutorial/kp-tutorial-") ||
              id.includes("/src/tutorial/KpTutorialLessonShell.svelte") ||
              id.includes("/src/editor/animation-catalogue-review-host.ts"))
          ) return "kp-tutorial-core";
          // These pure pathname matchers are synchronously read together by
          // bootstrap. Keeping one tiny route table avoids three startup
          // requests without pulling either tutorial implementation forward.
          if (
            id.includes("/src/editor/animation-catalogue-route.ts") ||
            id.includes("/src/tutorial/economics-demand-shift/economics-demand-shift-route.ts") ||
            id.includes("/src/tutorial/lisp-function-application/lisp-function-application-route.ts")
          ) return "kp-route-table";
          // These dependency-free IDs travel together in the display catalog;
          // one metadata leaf avoids request overhead without creating a large
          // startup evaluation task or coupling their render implementations.
          if (
            id.includes("/src/rendering/dimensional-continuity-graph-language.ts") ||
            id.includes("/src/tutorial/verified-generated-linear-solve-identity.ts")
          ) return "kp-route-table";
          return undefined;
        }
      }
    }
  },
  server: {
    host: "127.0.0.1",
    port: 8000,
    watch: {
      // Browser checks write traces and screenshots here. Watching that
      // scratch tree used to broadcast unrelated full-page reloads into the
      // long-lived review webview and could strand its shared iframe host.
      ignored: ["**/tmp/codex/**"]
    },
    proxy: {
      "/api": {
        changeOrigin: true,
        target: apiTarget
      }
    },
    strictPort: true
  }
});

function readReviewBuildIdentity(): { commit: string; fingerprint: string; dirty: boolean } {
  try {
    const commit = execFileSync("git", ["rev-parse", "--short=12", "HEAD"], {
      cwd: projectRoot,
      encoding: "utf8"
    }).trim();
    const dirty = execFileSync("git", ["status", "--porcelain", "--untracked-files=no"], {
      cwd: projectRoot,
      encoding: "utf8"
    }).trim().length > 0;
    return {
      commit,
      fingerprint: dirty ? `${commit}-dirty` : commit,
      dirty
    };
  } catch {
    return { commit: "unknown", fingerprint: "dev-unknown", dirty: true };
  }
}

function compileLispTutorialStaticFallback(): string {
  const source = createKpLispLambdaApplicationAsset();
  const stage = createKpLispLessonStageProjector({
    source,
    botanicalPlan: createKpLispBotanicalPresentationPlan(source)
  });
  const runtimeFrame = sampleKpLispLambdaApplicationRuntimeFrame({
    asset: source,
    progress: 0
  });
  const publication = compileKpLispFunctionApplicationPublication(
    readFileSync(resolve(
      projectRoot,
      "content/lessons/programming-lisp-function-application.md"
    ), "utf8")
  );
  const sharedCss = readFileSync(resolve(
    projectRoot,
    "src/tutorial/kp-tutorial-lesson-shell.css"
  ), "utf8");
  const scrubCss = readFileSync(resolve(
    projectRoot,
    "src/tutorial/kp-tutorial-scrub-bar.css"
  ), "utf8");
  const lessonCss = readFileSync(resolve(
    projectRoot,
    "src/tutorial/lisp-function-application/lisp-function-application-tutorial.css"
  ), "utf8").replace(/^@import[^;]+;\s*/, "");
  const publicationHtml = renderKpLispFunctionApplicationStaticPublication({
    publication,
    animationId: source.id,
    stageHtml: stage.render({
      runtimeFrame,
      activeBlockId: "structure",
      localProgress: 0,
      availableWidthPx: 720,
      reducedMotion: true
    })
  });
  return `<style>${sharedCss}\n${scrubCss}\n${lessonCss}\n${stage.css}</style>${publicationHtml}`;
}
