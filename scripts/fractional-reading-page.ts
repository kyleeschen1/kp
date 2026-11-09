import readings from '../content/authoring/algebra/fractional-linear-readings.json' with { type: 'json' };
import { readWhatCountsArticle, registerWhatCountsReadings, type ReadingRevision } from './what-counts-readings.ts';
import { AnchoredAlgebraGap } from '../src/reader/document/public-api.ts';
import { compileKpFractionalLinearEquationLesson } from '../src/reader/compiler/fractional-linear-equation-lesson.ts';
import { decodeKpReaderSessionUrl } from '../src/reader/runtime/lesson-url-codec.ts';

export const fractionalReadingOwner = {
  registryPath: 'content/authoring/algebra/fractional-linear-readings.json',
  route: '/reader/solve-fractional-linear/',
  archiveDirectory: 'content/authoring/algebra/readings/fractional-linear',
  compile: compileFractionalReading
};

/** Local alternative prose on the same checked equation and canonical host.
 * Retained version 1 also keeps its original source identity and generated IDs. */
export function compileFractionalReading(url: string, registrations: unknown = readings,
  readArticle: (revision: ReadingRevision) => string = readWhatCountsArticle) {
  const registry = registerWhatCountsReadings(registrations);
  const location = new URL(url, 'http://localhost');
  const id = location.searchParams.get('reading') ?? 'original';
  const current = registry.get(id);
  if (!current) throw new AnchoredAlgebraGap('location.reading', 'Choose a registered fractional-equation reading.');
  const version = location.searchParams.get('kpVersion') ?? current.version;
  const revision = version === current.version ? current : current.previous?.find(item => item.version === version);
  if (!revision) throw new AnchoredAlgebraGap('location.document', 'Open the exact registered reading version; saved positions cannot select different prose.');
  try { decodeKpReaderSessionUrl(location, { documentId: 'lesson.solve-x.fractional-linear', documentVersion: version }); }
  catch (error) { throw new AnchoredAlgebraGap('location.document', error instanceof Error ? error.message : String(error)); }
  return compileKpFractionalLinearEquationLesson(readArticle(revision), {
    sourceId: version === '1' ? 'content/lessons/solve-fractional-linear.md' : revision.articlePath,
    version, title: revision.title, description: revision.description
  }).html;
}
