import { buildLocalReader } from "./local-reader-build.ts";

export function buildAlgebraReader(mode: "edition" | "editor" = "edition", sourcemap = false) {
  return buildLocalReader(`src/experiments/composed-algebra-intuition/${mode === "edition" ? "edition-reader" : "entry"}.ts`, sourcemap);
}
