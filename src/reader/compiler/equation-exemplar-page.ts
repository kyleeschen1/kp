import type { KpAnimationAsset } from "../../animation/asset.ts";
import type { KpSemanticAssetObject } from "../../semantic/asset.ts";
import type { KpSelectorAnnotatedLatex } from "../../rendering/selector-annotated-latex.ts";
import { renderKpEquationPageTemplate } from "../../rendering/equation-stage-template.ts";
import type { KpReaderEquationPresentationCapability, KpReaderEvaluationControlsKind } from "../document/public-api.ts";
import { compileKpReaderPageShell } from "./reader-page-shell.ts";

export interface KpEquationExemplarPageInput {
  readonly equationSource?: unknown;
  readonly animation: KpAnimationAsset;
  readonly title: string;
  readonly description: string;
  readonly documentId: string;
  readonly documentVersion: string;
  readonly lessonVariant: string;
  readonly palette?: "nocturne";
  readonly readerControls?: KpReaderEvaluationControlsKind | undefined;
  readonly modeLink: { readonly href: string; readonly label: string };
  readonly tocHtml: string;
  readonly articleHtml: string;
  readonly hydrationJson: string;
  readonly equationPresentation: KpReaderEquationPresentationCapability;
  readonly presentationAnimations?: readonly KpAnimationAsset[] | undefined;
  readonly showEquationProfileControl?: boolean | undefined;
  readonly annotateState: (
    state: KpSemanticAssetObject
  ) => KpSelectorAnnotatedLatex | undefined;
}

export function compileKpEquationExemplarPage(
  input: KpEquationExemplarPageInput
): string {
  const template = renderKpEquationPageTemplate(input.animation, input.annotateState, {
      presentationAnimations: input.presentationAnimations,
      equationPresentation: input.equationPresentation,
      showEquationProfileControl: input.showEquationProfileControl
      ,
      readerControls: input.readerControls
  });
  return compileKpReaderPageShell({
    title: input.title,
    description: input.description,
    stylesheetHref: input.lessonVariant === 'fractional-linear'
      ? '/src/reader/app/fractional-exemplar.css' : '/src/reader/app/exemplar.css',
    bodyAttributes: [
      ...(input.palette === undefined ? [] : [{ name: "data-kp-reader-palette", value: input.palette }]),
      ...(input.equationSource === undefined ? [] : [{ name: "data-kp-reader-equation-source", value: JSON.stringify(input.equationSource) }]),
      { name: "data-kp-reader", value: "semantic-document" },
      { name: "data-kp-reader-document-id", value: input.documentId },
      { name: "data-kp-reader-document-version", value: input.documentVersion },
      { name: "data-kp-reader-lesson-variant", value: input.lessonVariant },
      { name: "data-kp-reader-equation-profile-default", value: input.equationPresentation.defaultProfileId },
      { name: "data-kp-reader-equation-profiles", value: input.equationPresentation.profileIds.join(",") }
    ],
    modeLink: input.modeLink,
    shareLink: {
      href: `#${input.documentId}`,
      label: "Link this moment",
      dataAttribute: "data-kp-reader-share"
    },
    tocHtml: input.tocHtml,
    articleHtml: input.articleHtml,
    afterMainHtml: [template],
    hydration: { dataAttribute: "data-kp-hydration", json: input.hydrationJson },
    entryScriptSrc: "/src/reader/app/exemplar-entry.ts"
  });
}
