import "../../styles.css";
import "../kp-tutorial-scrub-bar.css";
import "./lisp-function-application-tutorial.css";

import lessonMarkdown from
  "../../../content/lessons/programming-lisp-function-application.md?raw";
import { mount, unmount } from "svelte";

import { createKpLispBotanicalPresentationPlan } from "../../animation/lisp-botanical-presentation-plan.ts";
import { createKpLispLambdaApplicationAnimationAsset } from "../../animation/lisp-lambda-application-adapter.ts";
import { sampleKpLispLambdaApplicationRuntimeFrame } from "../../animation/lisp-lambda-application-runtime-frame.ts";
import { createKpAnimationCatalogueReviewHost } from "../../editor/animation-catalogue-review-host.ts";
import { createKpEditorAnimationLibrary } from "../../editor/animation-library.ts";
import {
  kpLispBotanicalStageCss,
  renderKpLispBotanicalStageHtml
} from "../../rendering/lisp-botanical-stage-html.ts";
import { createKpLispLambdaApplicationAsset } from "../../semantic/lisp-lambda-application-asset.ts";
import { defineKpTutorialScrubBar } from "../kp-tutorial-scrub-bar.ts";
import { defineKpTutorialToc } from "../kp-tutorial-toc-element.ts";
import KpLispFunctionApplicationTutorial from "./KpLispFunctionApplicationTutorial.svelte";
import {
  createKpLispLessonMotionController
} from "./lisp-function-application-motion-controller.ts";
import { compileKpLispFunctionApplicationPublication } from "./lisp-function-application-publication.ts";

export async function mountKpLispFunctionApplicationTutorial(input: {
  readonly root: HTMLElement;
}): Promise<() => void> {
  defineKpTutorialScrubBar();
  defineKpTutorialToc();
  const source = createKpLispLambdaApplicationAsset();
  const plan = createKpLispBotanicalPresentationPlan(source);
  const animation = createKpLispLambdaApplicationAnimationAsset();
  const publication = compileKpLispFunctionApplicationPublication(lessonMarkdown);
  const style = input.root.ownerDocument.createElement("style");
  style.dataset["kpLispBotanicalStageStyles"] = "true";
  style.textContent = kpLispBotanicalStageCss;
  input.root.ownerDocument.head.append(style);
  const stageHtml = renderKpLispBotanicalStageHtml({
    frame: sampleKpLispLambdaApplicationRuntimeFrame({ asset: source, progress: 0 }),
    plan
  });
  const component = mount(KpLispFunctionApplicationTutorial, {
    target: input.root,
    props: {
      lesson: publication.lesson,
      tocHtml: publication.tocHtml,
      motionScrubBarHtml: publication.motionScrubBarHtml,
      stageHtml,
      animationId: animation.id
    }
  });
  const descriptor = createKpEditorAnimationLibrary().find(
    ({ animationId }) => animationId === animation.id
  );
  if (descriptor === undefined) {
    throw new Error("Lisp tutorial animation descriptor is not catalogued.");
  }
  const motion = createKpLispLessonMotionController({
    root: input.root,
    animation,
    descriptor,
    source,
    plan
  });
  const reviewHost = createKpAnimationCatalogueReviewHost();
  input.root.dataset["kpLispFunctionApplicationTutorialMounted"] = "true";
  void reviewHost.mount();

  return () => {
    motion.dispose();
    reviewHost.dispose();
    style.remove();
    delete input.root.dataset["kpLispFunctionApplicationTutorialMounted"];
    void unmount(component);
  };
}
