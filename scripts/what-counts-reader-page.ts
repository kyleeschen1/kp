import source from "../content/authoring/algebra/what-counts.json" with { type: "json" };
import readings from "../content/authoring/algebra/what-counts-readings.json" with { type: "json" };
import { readWhatCountsArticle, registerWhatCountsReadings, type ReadingRevision, type ReadingRegistration } from "./what-counts-readings.ts";
export { readWhatCountsArticle, registerWhatCountsReadings } from "./what-counts-readings.ts";
import { compile } from "../src/authoring/algebra/compile.ts";
import { bindAnchoredCommentary, AnchoredAlgebraGap } from "../src/reader/app/what-counts-commentary.ts";
import { composedAlgebraEndpointsV2 } from "../src/reader/app/algebra-presentation-endpoints.ts";
import { compileKpEquationExemplarLessonModel } from "../src/reader/compiler/equation-exemplar-lesson-model.ts";
import { compileKpStaticLessonProse } from "../src/reader/compiler/static-prose-compiler.ts";
import { compileKpEquationExemplarPage } from "../src/reader/compiler/equation-exemplar-page.ts";
import { serializeKpReaderHydrationManifest } from "../src/reader/compiler/hydration-manifest.ts";
import { decodeKpReaderSessionUrl } from "../src/reader/runtime/lesson-url-codec.ts";

/** Reading identity and document revision are resolved together. Old coordinates
 * may select retained prose, but can never be applied to a different revision. */
function resolveReading(location: URL, readingRegistry: ReadonlyMap<string, ReadingRegistration>, path = "location.document") {
  const id = location.searchParams.get("reading") ?? "whole";
  const current = readingRegistry.get(id);
  if (!current) throw new AnchoredAlgebraGap("location.reading", "Choose a registered reading from what-counts-readings.json.");
  const version = location.searchParams.get("kpVersion") ?? current.version;
  const revision = version === current.version ? current : current.previous?.find(item => item.version === version);
  if (!revision) throw new AnchoredAlgebraGap(path, `Unknown revision ${version} for reading ${id}. Open /reader/what-counts/ for the current explanation.`);
  return { id, current, revision };
}

function readingModel(registration: ReadingRevision, draft: ReturnType<typeof compile>, readArticle: (revision: ReadingRevision) => string) {
  const markdown = readArticle(registration);
  return compileKpEquationExemplarLessonModel({ animation: draft.animation, sourceId: registration.articlePath,
    documentId: source.id, version: registration.version, title: registration.title, language: "en",
    markdown, diagnosticLabel: "What counts" });
}

/** A response can return to a checked address; it cannot invent its referent. */
function followUpReturn(location: URL, reading: string, draft: ReturnType<typeof compile>, registry: ReadonlyMap<string, ReadingRegistration>, readArticle: (revision: ReadingRevision) => string) {
  const requested = location.searchParams.get("returnTo");
  if (requested === null) return undefined;
  const gap = (reason: string) => new AnchoredAlgebraGap("location.returnTo", reason);
  if (reading === "whole" || !requested.startsWith("/reader/what-counts/"))
    throw gap("A follow-up reading requires the original reader's relative shared address.");
  const target = new URL(requested, "http://localhost");
  if (target.pathname !== "/reader/what-counts/" || target.searchParams.has("returnTo")
    || (target.searchParams.get("reading") ?? "whole") !== "whole")
    throw gap("Return directly to the original explanation, without nested responses.");
  let session;
  const originalReading = resolveReading(target, registry, "location.returnTo").revision;
  try { session = decodeKpReaderSessionUrl(target, { documentId: source.id, documentVersion: originalReading.version }); }
  catch (error) { throw gap(error instanceof Error ? error.message : String(error)); }
  const refs = new Set(draft.animation.bundle.objects.flatMap(object => [object.id, ...object.selectors.map(selector => selector.id)]));
  const readingPosition = target.searchParams.get("kpReading");
  const revision = target.searchParams.get("revision");
  if (!session || session.location.progressPermille === undefined || session.location.focusRefs.length === 0
    || session.location.focusRefs.some(ref => !refs.has(ref))
    || readingPosition === null || readingPosition.trim() === "" || !Number.isFinite(Number(readingPosition))
    || Number(readingPosition) < 0 || Number(readingPosition) > 1 || (revision !== null && revision !== draft.revisionId))
    throw gap("Retain the original reading position, checked source revision and a known focused referent.");
  const original = readingModel(originalReading, draft, readArticle);
  const beats = original.document.blocks.flatMap(block => block.kind === "animation-story" ? block.beats : []);
  const anchors = new Set([...original.document.blocks.map(block => block.id), ...beats.map(beat => beat.id)]);
  const checkpoints = new Set(beats.flatMap(beat => [beat.id, beat.checkpoint.id]));
  let anchor: string;
  try { anchor = decodeURIComponent(target.hash.slice(1)); }
  catch { throw gap("Use an intact original reading anchor."); }
  if ((anchor && !anchors.has(anchor)) || (session.location.checkpointId !== undefined && !checkpoints.has(session.location.checkpointId)))
    throw gap("Resolve the original beat and checkpoint before returning.");
  return target.pathname + target.search + target.hash;
}

/** Explanation copy has its own Article; checked algebra still owns every move. */
export function compileWhatCountsLesson(url = "http://localhost/reader/what-counts/", registrations: unknown = readings,
  readArticle: (revision: ReadingRevision) => string = readWhatCountsArticle) {
  const registry = registerWhatCountsReadings(registrations);
  const draft = compile(source), commentary = bindAnchoredCommentary(draft);
  const location = new URL(url, "http://localhost");
  const { id: reading, current, revision: registration } = resolveReading(location, registry);
  const { version: documentVersion, description } = registration;
  const currentHref = `/reader/what-counts/${reading === "whole" ? "" : `?reading=${encodeURIComponent(reading)}`}`;
  const revision = location.searchParams.get("revision");
  if (revision !== null && revision !== draft.revisionId)
    throw new AnchoredAlgebraGap("location.revision", `This link names a different explanation revision. Open ${currentHref} for the current explanation.`);
  // Reject stale reading coordinates before hydration can partially mount them.
  try { decodeKpReaderSessionUrl(location, { documentId: source.id, documentVersion }); }
  catch (error) {
    throw new AnchoredAlgebraGap("location.document", `${error instanceof Error ? error.message : String(error)}. Open ${currentHref} for the current explanation.`);
  }
  const returnHref = followUpReturn(location, reading, draft, registry, readArticle);
  const model = readingModel(registration, draft, readArticle);
  const story = model.document.blocks.find(block => block.kind === "animation-story");
  if (!story) throw new AnchoredAlgebraGap("reader.story", "Require the checked algebra story.");
  const beatIds = new Set(story.beats.map(beat => beat.id));
  const prose = compileKpStaticLessonProse(model.document, { staticMath: model.staticMath, documentTheater: {
    annotations: new Map(commentary.stops.filter(stop => beatIds.has(stop.stateId)).map(stop => [stop.stateId, stop.stateId])),
    operations: new Map(draft.animation.transformations.map((operation, index) => [`passage.${source.states[index + 1]!.id}`,
      { transformationId: operation.id, start: Math.round(index * 1000 / 3), end: Math.round((index + 1) * 1000 / 3) }]))
  } });
  const endpoints = composedAlgebraEndpointsV2(draft), presentation = model.hydration.blocks[0]?.equationPresentation;
  if (!presentation) throw new AnchoredAlgebraGap("reader.presentation", "Require the equation presentation capability.");
  return compileKpEquationExemplarPage({ projection: "document-theater", accessibilityOwner: "stage", animation: draft.animation, equationSource: draft.checked.source,
    title: model.document.title, description, documentId: model.document.id, documentVersion,
    lessonVariant: "authored-algebra", palette: "nocturne", modeLink: returnHref
      ? { href: returnHref, label: "Return to your question" }
      : registration.version !== current.version
      ? { href: currentHref, label: "Read the latest explanation" }
      : reading !== "whole"
      ? { href: "/reader/what-counts/", label: "Return to the original explanation" }
      : { href: "/reader/solve-fractional-linear/", label: "Read the fractional equation" },
    tocHtml: prose.tocHtml, articleHtml: prose.articleHtml, hydrationJson: serializeKpReaderHydrationManifest(model.hydration),
    equationPresentation: presentation, annotateState: state => endpoints.find(endpoint => endpoint.stateId === state.id)?.annotated });
}
