import { readKpComposedAlgebraSource } from "./composed-algebra-source.ts";
import primary from "./examples/composed-algebra-primary.json" with { type: "json" };

export function createKpComposedAlgebraExample() { return readKpComposedAlgebraSource(primary); }
