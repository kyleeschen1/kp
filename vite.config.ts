import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

import {
  kpDevelopmentBuildEntries
} from "./src/dev-toolbar/development-page-build-entries.ts";
import { kpSchemeFactorialTimeline } from
  "./src/animation/scheme-factorial-canonical-timeline.ts";
import { kpSchemeFactorialChoreography } from
  "./src/animation/scheme-factorial-canonical-choreography.ts";
import { kpSchemeFactorialFirstExpansion } from
  "./src/animation/scheme-factorial-canonical-first-expansion.ts";
import { kpSchemeFactorialFullEvaluation } from
  "./src/animation/scheme-factorial-canonical-full-evaluation.ts";
import { kpSchemeFactorialCss } from
  "./src/rendering/scheme-factorial-html.ts";
import { kpSchemeFirstExpansionCss } from
  "./src/rendering/scheme-factorial-first-expansion-html.ts";
import { kpSchemeFactorialCheckpoints } from
  "./src/semantic/scheme-factorial-checkpoints.ts";
import {
  defineKpSchemeFactorialPublicationArtifact,
  renderKpSchemeFactorialFocusPublication,
  serializeKpSchemeFactorialPublicationArtifact
} from "./src/tutorial/scheme-factorial/scheme-factorial-publication.ts";

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
import {
  assertKpCompiledPublicationArtifact
} from "./src/tutorial/kp-compiled-publication-artifact.ts";
import type {
  KpEconomicsDemandShiftPublication
} from "./src/tutorial/economics-demand-shift/economics-demand-shift-publication.ts";
import {
  renderKpEconomicsDemandShiftStaticNarrative,
  renderKpEconomicsDemandShiftStaticNarrativeStyles
} from "./src/tutorial/economics-demand-shift/economics-demand-shift-static-publication.ts";
import type { KpArticleImportLock } from
  "./src/article/kp-article-import-lock.ts";
import {
  compileKpFractionCompositionArticle
} from "./src/tutorial/algebra-fraction-composition/fraction-composition-article-compiler.ts";
import {
  renderKpFractionCompositionStaticPublication
} from "./src/tutorial/algebra-fraction-composition/fraction-composition-static-publication.ts";
import {
  compileKpTypeScriptFreeShippingPublicLesson,
  renderKpTypeScriptFreeShippingPublicLesson
} from "./src/public-web/typescript-free-shipping-publication.ts";

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
const schemeFactorialTutorialFilename = resolve(
  projectRoot,
  "tutorials/programming/scheme-factorial/index.html"
);
const schemeFactorialPublicationArtifact =
  defineKpSchemeFactorialPublicationArtifact({
    checkpoints: kpSchemeFactorialCheckpoints,
    timeline: kpSchemeFactorialTimeline,
    choreography: kpSchemeFactorialChoreography,
    firstExpansion: kpSchemeFactorialFirstExpansion,
    fullEvaluation: kpSchemeFactorialFullEvaluation
  });
const schemeFactorialStaticFallback = compileSchemeFactorialStaticFallback();
const economicsTutorialFilename = resolve(
  projectRoot,
  "tutorials/economics/demand-shift/index.html"
);
const economicsArticleSourceFilename = resolve(
  projectRoot,
  "content/lessons/economics-demand-shift.kp.md"
);
const economicsPublicationFilename = resolve(
  projectRoot,
  "src/tutorial/economics-demand-shift/economics-demand-shift-publication.generated.json"
);
const economicsRetainedMathFilename = resolve(
  projectRoot,
  "src/rendering/economics-equilibrium-retained-math.generated.json"
);
const economicsAuthoringOutputFilenames = new Set([
  economicsArticleSourceFilename,
  economicsPublicationFilename,
  economicsRetainedMathFilename
]);
let economicsTutorialStaticNarrative =
  compileEconomicsTutorialStaticNarrative();
const algebraFractionCompositionTutorialFilename = resolve(
  projectRoot,
  "tutorials/algebra/fraction-composition/index.html"
);
const algebraFractionCompositionArticleSourceFilename = resolve(
  projectRoot,
  "content/lessons/algebra-fraction-composition.kp.md"
);
let algebraFractionCompositionStaticPublication =
  compileAlgebraFractionCompositionStaticPublication();
const typeScriptFreeShippingPublicFilename = resolve(
  projectRoot,
  "learn/code/free-shipping/index.html"
);
const typeScriptFreeShippingPublicPublication =
  compileTypeScriptFreeShippingPublicPublication();

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
      name: "kp-economics-authoring-save-boundary",
      configResolved(config) {
        if (config.command !== "serve") return;
        // The static fallback renderer imports retained build-time math. That
        // artifact is regenerated by an intentional editor save, not a config
        // change, so it must not make Vite restart the whole authoring page.
        for (let index = config.configFileDependencies.length - 1;
          index >= 0; index -= 1) {
          if (economicsAuthoringOutputFilenames.has(
            config.configFileDependencies[index]!
          )) config.configFileDependencies.splice(index, 1);
        }
      },
      handleHotUpdate(context) {
        if (!economicsAuthoringOutputFilenames.has(context.file)) return;
        // Saving already updates the mounted preview transactionally. Empty
        // HMR propagation preserves the document and scroll state while Vite's
        // module invalidation still makes a later navigation read fresh files.
        if (context.file === economicsPublicationFilename) {
          economicsTutorialStaticNarrative =
            compileEconomicsTutorialStaticNarrative();
        }
        return [];
      }
    },
    {
      name: "kp-algebra-authoring-save-boundary",
      configResolved(config) {
        if (config.command !== "serve") return;
        // The article editor replaces the live projection transactionally;
        // source writes must not let Vite discard scroll and editor state.
        for (let index = config.configFileDependencies.length - 1;
          index >= 0; index -= 1) {
          if (config.configFileDependencies[index] ===
              algebraFractionCompositionArticleSourceFilename) {
            config.configFileDependencies.splice(index, 1);
          }
        }
      },
      handleHotUpdate(context) {
        if (context.file !== algebraFractionCompositionArticleSourceFilename) {
          return;
        }
        algebraFractionCompositionStaticPublication =
          compileAlgebraFractionCompositionStaticPublication();
        return [];
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
    },
    {
      name: "kp-scheme-factorial-static-fallback",
      transformIndexHtml: {
        order: "pre",
        handler(html, context) {
          return context.filename === schemeFactorialTutorialFilename
            ? html.replace(
                "<!-- kp:scheme-factorial-static-fallback -->",
                schemeFactorialStaticFallback
              ).replace(
                "<!-- kp:scheme-factorial-publication-data -->",
                serializeKpSchemeFactorialPublicationArtifact(
                  schemeFactorialPublicationArtifact
                )
              )
            : html;
        }
      }
    },
    {
      name: "kp-economics-tutorial-static-narrative",
      transformIndexHtml: {
        order: "pre",
        handler(html, context) {
          return context.filename === economicsTutorialFilename
            ? html.replace(
                "<!-- kp:economics-static-narrative -->",
                economicsTutorialStaticNarrative
              )
            : html;
        }
      }
    },
    {
      name: "kp-algebra-fraction-composition-static-publication",
      transformIndexHtml: {
        order: "pre",
        handler(html, context) {
          return context.filename === algebraFractionCompositionTutorialFilename
            ? html.replace(
                "<!-- kp:algebra-fraction-composition-static-publication -->",
                algebraFractionCompositionStaticPublication
              )
            : html;
        }
      }
    },
    {
      name: "kp-typescript-free-shipping-publication",
      transformIndexHtml: {
        order: "pre",
        handler(html, context) {
          return context.filename === typeScriptFreeShippingPublicFilename
            ? html.replace(
                "<!-- kp:typescript-free-shipping-publication -->",
                typeScriptFreeShippingPublicPublication
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
        ...Object.fromEntries(kpDevelopmentBuildEntries.map((entry) => [
          entry.name,
          resolve(projectRoot, entry.htmlPath)
        ])),
        ...Object.fromEntries(readerBuildRoutes.map(({ descriptor, filename }) => [
          kpReaderRouteEntryName(descriptor.route),
          filename
        ]))
      },
      output: {
        manualChunks(id) {
          // Vite injects this helper into every entry that performs a dynamic
          // import. If Rollup adopts it into the tutorial chunk, unrelated
          // readers inherit the entire Svelte/tutorial closure just to preload
          // their own runtime capability.
          if (id.includes("vite/preload-helper")) return "kp-preload-helper";
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
              id.includes("/src/tutorial/lisp-function-application/lisp-function-application-route.ts") ||
              id.includes("/src/tutorial/scheme-factorial/scheme-factorial-route.ts")
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

function compileTypeScriptFreeShippingPublicPublication(): string {
  const source = readFileSync(resolve(
    projectRoot,
    "content/lessons/typescript-free-shipping.kp.md"
  ), "utf8");
  const lock = JSON.parse(readFileSync(resolve(
    projectRoot,
    "content/lessons/typescript-free-shipping.kp.lock.json"
  ), "utf8")) as KpArticleImportLock;
  return renderKpTypeScriptFreeShippingPublicLesson(
    compileKpTypeScriptFreeShippingPublicLesson({ text: source, lock })
  );
}

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

function compileEconomicsTutorialStaticNarrative(): string {
  const artifact: unknown = JSON.parse(
    readFileSync(economicsPublicationFilename, "utf8")
  );
  assertKpCompiledPublicationArtifact(artifact);
  if (artifact.artifactId !== "publication.economics.demand-shift") {
    throw new Error(`Unexpected economics publication: ${artifact.artifactId}.`);
  }
  const publication = artifact.payload as KpEconomicsDemandShiftPublication;
  return `${renderKpEconomicsDemandShiftStaticNarrativeStyles()}${renderKpEconomicsDemandShiftStaticNarrative(publication)}`;
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

function compileSchemeFactorialStaticFallback(): string {
  const publicationCss = readFileSync(resolve(
    projectRoot,
    "src/tutorial/scheme-factorial/scheme-factorial-tutorial.css"
  ), "utf8");
  const scrubCss = readFileSync(resolve(
    projectRoot,
    "src/tutorial/kp-tutorial-scrub-bar.css"
  ), "utf8");
  return `<style>${publicationCss}\n${scrubCss}\n${kpSchemeFactorialCss}\n${kpSchemeFirstExpansionCss}</style>${renderKpSchemeFactorialFocusPublication({
    artifact: schemeFactorialPublicationArtifact
  })}`;
}

function compileAlgebraFractionCompositionStaticPublication(): string {
  const text = readFileSync(resolve(
    projectRoot,
    "content/lessons/algebra-fraction-composition.kp.md"
  ), "utf8");
  const lock = JSON.parse(readFileSync(resolve(
    projectRoot,
    "content/lessons/algebra-fraction-composition.kp.lock.json"
  ), "utf8")) as KpArticleImportLock;
  return renderKpFractionCompositionStaticPublication(
    compileKpFractionCompositionArticle({ text, lock })
  );
}
