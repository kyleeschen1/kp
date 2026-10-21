import { compile } from './algebra/compile.ts';
import primary from './examples/composed-algebra-intuition.json' with { type: 'json' };

// Compatibility owns the historical no-argument example. Ordinary compilation
// uses algebra/compile.ts with explicit source and never imports this fixture.
export function prepareKpComposedAlgebraDraftV2(value: unknown = primary) { return compile(value); }
export { check as checkKpComposedAlgebraDraftV2, serialize as exportKpComposedAlgebraSourceV2 } from './algebra/compile.ts';
export { session as createKpComposedAlgebraAuthoringSessionV2 } from './algebra/session.ts';
