import source from "../content/authoring/algebra/what-counts.json" with { type: "json" };
import { compile } from "../src/authoring/algebra/compile.ts";
import { bindAnchoredCommentary, AnchoredAlgebraGap } from "../src/reader/app/what-counts-commentary.ts";
import { composedAlgebraEndpointsV2 } from "../src/reader/app/algebra-presentation-endpoints.ts";
import { compileKpEquationExemplarLessonModel } from "../src/reader/compiler/equation-exemplar-lesson-model.ts";
import { compileKpStaticLessonProse } from "../src/reader/compiler/static-prose-compiler.ts";
import { compileKpEquationExemplarPage } from "../src/reader/compiler/equation-exemplar-page.ts";
import { serializeKpReaderHydrationManifest } from "../src/reader/compiler/hydration-manifest.ts";

/** One reviewed score projected through the existing reader, with no card shell. */
export function compileWhatCountsLesson(url = "http://localhost/reader/what-counts/") {
  const draft = compile(source), commentary = bindAnchoredCommentary(draft);
  const revision = new URL(url, "http://localhost").searchParams.get("revision");
  if (revision !== null && revision !== draft.revisionId)
    throw new AnchoredAlgebraGap("location.revision", "This link names a different explanation revision. Open /reader/what-counts/ for the current explanation.");
  const titles = ["The repeated whole", "Combine the counts", "Look inside", "Every contribution"];
  const beats = source.states.flatMap((state, index) => [
    { id: `passage.${state.id}`, title: titles[index]!, content: state.narration, progressPermille: Math.round(index * 1000 / 3), focusRefs: [state.id] },
    { id: state.id, title: `Notice: ${titles[index]!.toLowerCase()}`, content: commentary.stops[index]!.notes.map(note => `${note.text} ${note.detail}`).join(" "), progressPermille: Math.round(index * 1000 / 3), focusRefs: [state.id] }
  ]);
  const markdown = `# ${source.editorial.title}\n\n${source.editorial.setup}\n\n\`\`\`kp-animation-story\n${JSON.stringify({
    id: "story.what-counts", asset: { id: draft.animation.id, version: "1" }, presentation: "scroll-scrub", beats
  })}\n\`\`\`\n\n${source.editorial.summary}\n`;
  const model = compileKpEquationExemplarLessonModel({ animation: draft.animation, sourceId: "content/authoring/algebra/what-counts.json",
    documentId: source.id, version: "1", title: source.editorial.title, language: "en", markdown, diagnosticLabel: "What counts" });
  const prose = compileKpStaticLessonProse(model.document, { staticMath: model.staticMath, documentTheater: {
    annotations: new Map(commentary.stops.map(stop => [stop.stateId, stop.stateId])),
    operations: new Map(draft.animation.transformations.map((operation, index) => [`passage.${source.states[index + 1]!.id}`,
      { transformationId: operation.id, start: Math.round(index * 1000 / 3), end: Math.round((index + 1) * 1000 / 3) }]))
  } });
  const endpoints = composedAlgebraEndpointsV2(draft), presentation = model.hydration.blocks[0]?.equationPresentation;
  if (!presentation) throw new AnchoredAlgebraGap("reader.presentation", "Require the equation presentation capability.");
  return compileKpEquationExemplarPage({ projection: "document-theater", accessibilityOwner: "stage", animation: draft.animation, equationSource: draft.checked.source,
    title: source.editorial.title, description: source.editorial.setup, documentId: model.document.id, documentVersion: "1",
    lessonVariant: "authored-algebra", palette: "nocturne", modeLink: { href: "/reader/solve-fractional-linear/", label: "Read the fractional equation" },
    tocHtml: prose.tocHtml, articleHtml: prose.articleHtml, hydrationJson: serializeKpReaderHydrationManifest(model.hydration),
    equationPresentation: presentation, annotateState: state => endpoints.find(endpoint => endpoint.stateId === state.id)?.annotated });
}
