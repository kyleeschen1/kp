import { readFileSync } from "node:fs";
import source from "../content/authoring/algebra/what-counts.json" with { type: "json" };
import readings from "../content/authoring/algebra/what-counts-readings.json" with { type: "json" };
import { compile } from "../src/authoring/algebra/compile.ts";
import { bindAnchoredCommentary, AnchoredAlgebraGap } from "../src/reader/app/what-counts-commentary.ts";
import { composedAlgebraEndpointsV2 } from "../src/reader/app/algebra-presentation-endpoints.ts";
import { compileKpEquationExemplarLessonModel } from "../src/reader/compiler/equation-exemplar-lesson-model.ts";
import { compileKpStaticLessonProse } from "../src/reader/compiler/static-prose-compiler.ts";
import { compileKpEquationExemplarPage } from "../src/reader/compiler/equation-exemplar-page.ts";
import { serializeKpReaderHydrationManifest } from "../src/reader/compiler/hydration-manifest.ts";
import { decodeKpReaderSessionUrl } from "../src/reader/runtime/lesson-url-codec.ts";

// Two editorial readings share checked mathematics, not a document revision.
// Only registered local files may be selected by the development URL.
export function registerWhatCountsReadings(input: Readonly<Record<string, (typeof readings)[keyof typeof readings]>>) {
  const versions = new Set<string>();
  for (const [id, reading] of Object.entries(input)) {
    if (!reading.version.trim() || versions.has(reading.version))
      throw new AnchoredAlgebraGap(`readings.${id}.version`, "Each reading requires its own nonempty document revision.");
    versions.add(reading.version);
  }
  return new Map(Object.entries(input));
}
const readingRegistry = registerWhatCountsReadings(readings);

/** Explanation copy has its own Article; checked algebra still owns every move. */
export function compileWhatCountsLesson(url = "http://localhost/reader/what-counts/") {
  const draft = compile(source), commentary = bindAnchoredCommentary(draft);
  const location = new URL(url, "http://localhost");
  const reading = location.searchParams.get("reading") ?? "whole";
  const registration = readingRegistry.get(reading);
  if (!registration) throw new AnchoredAlgebraGap("location.reading", "Choose a registered reading from what-counts-readings.json.");
  const { articlePath, version: documentVersion, title, description } = registration;
  const currentHref = `/reader/what-counts/${reading === "whole" ? "" : `?reading=${encodeURIComponent(reading)}`}`;
  const revision = location.searchParams.get("revision");
  if (revision !== null && revision !== draft.revisionId)
    throw new AnchoredAlgebraGap("location.revision", `This link names a different explanation revision. Open ${currentHref} for the current explanation.`);
  // Reject stale reading coordinates before hydration can partially mount them.
  try { decodeKpReaderSessionUrl(location, { documentId: source.id, documentVersion }); }
  catch (error) {
    throw new AnchoredAlgebraGap("location.document", `${error instanceof Error ? error.message : String(error)}. Open ${currentHref} for the current explanation.`);
  }
  const markdown = readFileSync(new URL(`../${articlePath}`, import.meta.url), "utf8");
  const model = compileKpEquationExemplarLessonModel({ animation: draft.animation, sourceId: articlePath,
    documentId: source.id, version: documentVersion, title, language: "en", markdown, diagnosticLabel: "What counts" });
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
    lessonVariant: "authored-algebra", palette: "nocturne", modeLink: reading !== "whole"
      ? { href: "/reader/what-counts/", label: "Return to the original explanation" }
      : { href: "/reader/solve-fractional-linear/", label: "Read the fractional equation" },
    tocHtml: prose.tocHtml, articleHtml: prose.articleHtml, hydrationJson: serializeKpReaderHydrationManifest(model.hydration),
    equationPresentation: presentation, annotateState: state => endpoints.find(endpoint => endpoint.stateId === state.id)?.annotated });
}
