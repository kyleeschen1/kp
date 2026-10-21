import { read as readKpComposedAlgebraSourceV2 } from "./algebra/source.ts";
import primary from "./examples/composed-algebra-intuition.json" with { type: "json" };

export function createKpComposedAlgebraExampleV2() { return readKpComposedAlgebraSourceV2(primary); }
