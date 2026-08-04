import { readFile, stat } from "node:fs/promises";
import { gzipSync } from "node:zlib";

const manifestPath = "dist/.vite/manifest.json";
const entrySource =
  "src/tutorial/lisp-function-application/lisp-function-application-tutorial-entry.ts";
const rendererName = "lisp-material-stage-projector";

export const kpLispFunctionApplicationBundleBudgets = Object.freeze({
  rendererRawBytes: 72_000,
  rendererGzipBytes: 18_000
});

interface ManifestEntry {
  readonly file: string;
  readonly name?: string | undefined;
  readonly imports?: readonly string[] | undefined;
}

type Manifest = Readonly<Record<string, ManifestEntry>>;

export interface KpLispFunctionApplicationBundleEvidence {
  readonly rendererFile: string;
  readonly rendererRawBytes: number;
  readonly rendererGzipBytes: number;
}

export function evaluateKpLispFunctionApplicationBundle(input: {
  readonly manifest: Manifest;
  readonly rendererBytes: Uint8Array;
}): KpLispFunctionApplicationBundleEvidence {
  const entry = input.manifest[entrySource];
  if (entry === undefined) {
    throw new Error(`Missing Lisp tutorial build entry: ${entrySource}`);
  }
  const matches = Object.entries(input.manifest).filter(([, candidate]) =>
    candidate.name === rendererName
  );
  if (matches.length !== 1) {
    throw new Error(`Expected one ${rendererName} chunk; received ${matches.length}.`);
  }
  const [rendererKey, renderer] = matches[0]!;
  if (!entry.imports?.includes(rendererKey)) {
    throw new Error("Lisp tutorial entry must import the scoped material renderer chunk.");
  }
  const raw = input.rendererBytes.byteLength;
  const gzip = gzipSync(input.rendererBytes).byteLength;
  const evidence = Object.freeze({
    rendererFile: renderer.file,
    rendererRawBytes: raw,
    rendererGzipBytes: gzip
  });
  const issues = [
    raw > kpLispFunctionApplicationBundleBudgets.rendererRawBytes
      ? `renderer raw bytes ${raw} > ${kpLispFunctionApplicationBundleBudgets.rendererRawBytes}`
      : undefined,
    gzip > kpLispFunctionApplicationBundleBudgets.rendererGzipBytes
      ? `renderer gzip bytes ${gzip} > ${kpLispFunctionApplicationBundleBudgets.rendererGzipBytes}`
      : undefined
  ].filter((issue): issue is string => issue !== undefined);
  if (issues.length > 0) {
    throw new Error(`Lisp tutorial bundle budget failed: ${issues.join(", ")}.`);
  }
  return evidence;
}

async function main(): Promise<void> {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Manifest;
  const renderer = Object.values(manifest).find(({ name }) =>
    name === rendererName
  );
  if (renderer === undefined) {
    throw new Error(`Missing ${rendererName} build chunk.`);
  }
  const rendererBytes = await readFile(`dist/${renderer.file}`);
  const evidence = evaluateKpLispFunctionApplicationBundle({
    manifest,
    rendererBytes
  });
  const diskBytes = (await stat(`dist/${renderer.file}`)).size;
  if (diskBytes !== evidence.rendererRawBytes) {
    throw new Error("Renderer size evidence disagrees with the emitted file.");
  }
  console.info(
    `Lisp tutorial bundle budget passed (${evidence.rendererRawBytes} raw bytes, ` +
    `${evidence.rendererGzipBytes} gzip bytes).`
  );
}

if (process.argv[1]?.endsWith("check-lisp-function-application-budgets.ts")) {
  await main();
}
