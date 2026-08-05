import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  createKpCompiledPublicationArtifact,
  type KpCompiledPublicationArtifact
} from "../src/tutorial/kp-compiled-publication-artifact.ts";
import {
  compileKpEconomicsDemandShiftPublication,
  type KpEconomicsDemandShiftPublication
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-publication.ts";

const sourcePath = "content/lessons/economics-demand-shift.md";
const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const sourceUrl = new URL(`../${sourcePath}`, import.meta.url);
const outputUrl = new URL(
  "../src/tutorial/economics-demand-shift/economics-demand-shift-publication.generated.json",
  import.meta.url
);
const katexPackageUrl = new URL("../node_modules/katex/package.json", import.meta.url);

export function compileKpEconomicsDemandShiftPublicationArtifact(input: {
  readonly markdown: string;
  readonly katexVersion: string;
}): KpCompiledPublicationArtifact<KpEconomicsDemandShiftPublication> {
  const payload = compileKpEconomicsDemandShiftPublication(input.markdown);
  const mathSources = collectMathSources(payload);

  return createKpCompiledPublicationArtifact({
    artifactId: "publication.economics.demand-shift",
    source: {
      path: sourcePath,
      sha256: digest(input.markdown)
    },
    compiler: {
      id: "kp.economics-demand-shift-publication",
      version: "1"
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
  const markdown = readFileSync(sourceUrl, "utf8");
  const output = serializeKpCompiledPublicationArtifact(
    compileKpEconomicsDemandShiftPublicationArtifact({
      markdown,
      katexVersion: readKatexVersion()
    })
  );

  if (checkOnly) {
    const existing = readFileSync(outputUrl, "utf8");
    if (existing !== output) {
      throw new Error(
        `Compiled publication is stale. Run npm run generate:economics-demand-shift-publication from ${projectRoot}.`
      );
    }
    return;
  }
  writeFileSync(outputUrl, output);
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  generateKpEconomicsDemandShiftPublicationArtifact(
    process.argv.includes("--check")
  );
}
