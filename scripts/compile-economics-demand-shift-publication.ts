import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  createKpCompiledPublicationArtifact,
  type KpCompiledPublicationArtifact
} from "../src/tutorial/kp-compiled-publication-artifact.ts";
import {
  compileKpEconomicsDemandShiftArticlePublication,
  type KpEconomicsDemandShiftPublication
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-publication.ts";
import type { KpArticleImportLock } from
  "../src/article/kp-article-import-lock.ts";
import {
  kpEconomicsDemandShiftMotionBridgeExemplar
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-motion-bridge-exemplar.ts";
import {
  sampleKpEconomicsEquilibriumRuntimeFrame
} from "../src/animation/economics-equilibrium-runtime-frame.ts";
import {
  sampleKpAnimationRuntimeFrame
} from "../src/animation/runtime-sampler.ts";
import {
  createKpEconomicsEquilibriumParameterState,
  createParameterizedEconomicsEquilibriumAnimation,
  kpEconomicsDemandInterceptParameter
} from "../src/editor/economics-equilibrium-parameters.ts";
import {
  createKpEditorGraphSvgViewportModel
} from "../src/editor/graph-svg-viewport-lifecycle.ts";
import { renderLatexToHtml } from "../src/rendering/katex-adapter.ts";
import {
  renderKpEconomicsEquilibriumRuntimeContent
} from "../src/rendering/economics-equilibrium-svg.ts";
const sourcePath = "content/lessons/economics-demand-shift.kp.md";
const importLockPath = "content/lessons/economics-demand-shift.kp.lock.json";
const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const sourceUrl = new URL(`../${sourcePath}`, import.meta.url);
const importLockUrl = new URL(`../${importLockPath}`, import.meta.url);
const outputUrl = new URL(
  "../src/tutorial/economics-demand-shift/economics-demand-shift-publication.generated.json",
  import.meta.url
);
const retainedMathOutputUrl = new URL(
  "../src/rendering/economics-equilibrium-retained-math.generated.json",
  import.meta.url
);
const katexPackageUrl = new URL("../node_modules/katex/package.json", import.meta.url);

export function compileKpEconomicsDemandShiftPublicationArtifact(input: {
  readonly articleText: string;
  readonly importLock: KpArticleImportLock;
  readonly katexVersion: string;
}): KpCompiledPublicationArtifact<KpEconomicsDemandShiftPublication> {
  const payload = compileKpEconomicsDemandShiftArticlePublication({
    articleText: input.articleText,
    importLock: input.importLock,
    proseMotion: [kpEconomicsDemandShiftMotionBridgeExemplar]
  });
  const mathSources = collectMathSources(payload);

  return createKpCompiledPublicationArtifact({
    artifactId: "publication.economics.demand-shift",
    source: {
      path: sourcePath,
      sha256: digest(input.articleText)
    },
    compiler: {
      id: "kp.economics-demand-shift-publication",
      version: "2"
    },
    math: {
      engine: "katex",
      engineVersion: input.katexVersion,
      rendering: "build-time",
      output: "htmlAndMathml",
      trust: false,
      fragmentCount: mathSources.length,
      sourceLatex: [...new Set(mathSources)].sort()
    },
    payloadSha256: digest(canonicalPayload(payload)),
    payload
  });
}

export function serializeKpCompiledPublicationArtifact(
  artifact: KpCompiledPublicationArtifact<KpEconomicsDemandShiftPublication>
): string {
  return `${JSON.stringify(artifact, null, 2)}\n`;
}

export function compileKpEconomicsRetainedMathArtifact(katexVersion: string) {
  const sources = new Set<string>();
  const collect = (latex: string): string => {
    sources.add(latex);
    return "";
  };
  const initialProgresses = [0, 0.1, 0.44, 0.72, 0.8, 1] as const;
  for (
    let value = kpEconomicsDemandInterceptParameter.minimum;
    value <= kpEconomicsDemandInterceptParameter.maximum;
    value += kpEconomicsDemandInterceptParameter.step
  ) {
    sources.add(String(value));
    const parameterized = createParameterizedEconomicsEquilibriumAnimation(
      createKpEconomicsEquilibriumParameterState(value)
    );
    const viewport = createKpEditorGraphSvgViewportModel(
      parameterized.animation
    );
    for (const progress of initialProgresses) {
      const frame = sampleKpEconomicsEquilibriumRuntimeFrame({
        animation: parameterized.animation,
        model: parameterized.model,
        runtimeFrame: sampleKpAnimationRuntimeFrame({
          animation: parameterized.animation,
          progress
        })
      });
      renderKpEconomicsEquilibriumRuntimeContent({
        frame,
        viewport,
        renderInlineLatex: collect
      });
    }
  }
  const sourceLatex = [...sources].sort();
  return Object.freeze({
    schemaVersion: "kp.economics-retained-math.v1" as const,
    engine: "katex" as const,
    engineVersion: katexVersion,
    output: "htmlAndMathml" as const,
    trust: false as const,
    sourceLatex,
    fragments: Object.fromEntries(sourceLatex.map((latex) => [
      latex,
      renderLatexToHtml(latex, {
        displayMode: false,
        output: "htmlAndMathml"
      })
    ]))
  });
}

function collectMathSources(value: unknown): string[] {
  if (typeof value === "string") {
    return [...value.matchAll(/data-kp-latex="([^"]*)"/g)].map((match) =>
      decodeHtmlAttribute(match[1] ?? "")
    );
  }
  if (Array.isArray(value)) return value.flatMap(collectMathSources);
  if (typeof value !== "object" || value === null) return [];
  return Object.values(value).flatMap(collectMathSources);
}

function decodeHtmlAttribute(value: string): string {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&#039;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

function digest(value: string): `sha256:${string}` {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function canonicalPayload(payload: KpEconomicsDemandShiftPublication): string {
  return JSON.stringify(payload);
}

function readKatexVersion(): string {
  const packageJson = JSON.parse(readFileSync(katexPackageUrl, "utf8")) as {
    readonly version?: unknown;
  };
  if (typeof packageJson.version !== "string" || packageJson.version === "") {
    throw new Error("Installed KaTeX package does not declare a version.");
  }
  return packageJson.version;
}

export function generateKpEconomicsDemandShiftPublicationArtifact(
  checkOnly: boolean
): void {
  const articleText = readFileSync(sourceUrl, "utf8");
  const importLock = JSON.parse(
    readFileSync(importLockUrl, "utf8")
  ) as KpArticleImportLock;
  const output = serializeKpCompiledPublicationArtifact(
    compileKpEconomicsDemandShiftPublicationArtifact({
      articleText,
      importLock,
      katexVersion: readKatexVersion(),
    })
  );
  const retainedMathOutput = `${JSON.stringify(
    compileKpEconomicsRetainedMathArtifact(readKatexVersion()),
    null,
    2
  )}\n`;

  if (checkOnly) {
    const existing = readFileSync(outputUrl, "utf8");
    const retainedMathExisting = readFileSync(retainedMathOutputUrl, "utf8");
    if (existing !== output || retainedMathExisting !== retainedMathOutput) {
      throw new Error(
        `Compiled publication is stale. Run npm run generate:economics-demand-shift-publication from ${projectRoot}.`
      );
    }
    return;
  }
  writeFileSync(outputUrl, output);
  writeFileSync(retainedMathOutputUrl, retainedMathOutput);
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  generateKpEconomicsDemandShiftPublicationArtifact(
    process.argv.includes("--check")
  );
}
