/** Complete bounded authoring convenience API. For plain-data consumers use
 * algebra/source.ts; for compilation alone use algebra/compile.ts. */
export { compile, check, serialize, type Presentation } from './algebra/compile.ts';
export { session } from './algebra/session.ts';
export { read, parse, Repair, type Source } from './algebra/source.ts';
