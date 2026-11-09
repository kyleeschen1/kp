import { readFileSync, statSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { reviseAlgebraReading, reviseWhatCountsReading, whatCountsDraftLimit } from './what-counts-revision.ts';
import { fractionalReadingOwner } from './fractional-reading-page.ts';

try {
  const { values } = parseArgs({ options: {
    lesson: { type: 'string', default: 'what-counts' }, reading: { type: 'string' }, source: { type: 'string' }, title: { type: 'string' }, description: { type: 'string' },
    apply: { type: 'boolean', default: false }, expect: { type: 'string' }, help: { type: 'boolean' }
  } });
  if (values.lesson !== 'what-counts' && values.lesson !== 'fractional-linear') throw new Error('revision.lesson: choose what-counts or fractional-linear.');
  if (values.help) {
    console.log(`Check: npm run author:${values.lesson === 'what-counts' ? 'what-counts' : 'fractional-reading'} -- --reading <registered-id> --source <draft.md> [--title <text>] [--description <text>]\nApply: repeat with --apply --expect <basis from check>. Check proposes a URL; only apply makes it available. Old addresses retain their source. No editorial approval or publication is implied.`);
  } else {
    if (!values.reading || !values.source || (values.apply && !values.expect) || (!values.apply && values.expect))
      throw new Error('revision.arguments: require --reading and --source; --apply requires --expect from the previous check.');
    const stat = statSync(values.source);
    if (!stat.isFile() || stat.size > whatCountsDraftLimit) throw new Error(`revision.draft: require a file within ${whatCountsDraftLimit} bytes.`);
    const revise = values.lesson === 'what-counts' ? reviseWhatCountsReading
      : (input: Parameters<typeof reviseAlgebraReading>[0]) => reviseAlgebraReading(input, fractionalReadingOwner);
    const result = revise({ reading: values.reading, markdown: readFileSync(values.source, 'utf8'),
      ...(values.title === undefined ? {} : { title: values.title }),
      ...(values.description === undefined ? {} : { description: values.description }),
      mode: values.apply ? { kind: 'apply', expectedBasis: values.expect! } : { kind: 'check' } });
    console.log(JSON.stringify(result, null, 2));
  }
} catch (error) {
  console.error(JSON.stringify({ status: 'repair-gap', code: 'kp.anchored-algebra.repair-gap',
    path: error instanceof Error && 'path' in error ? error.path : 'revision',
    message: error instanceof Error ? error.message : String(error) }));
  process.exitCode = 1;
}
