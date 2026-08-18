import "../../styles.css";
import "../animation-transformation-coverage.css";

import { mount, unmount } from "svelte";

import {
  createKpAnimationTransformationCoverageViewModel
} from "../animation-transformation-coverage-view-model.ts";
import KpAnimationTransformationCoverage from
  "./KpAnimationTransformationCoverage.svelte";

export function mountKpAnimationTransformationCoverage(input: {
  readonly root: HTMLElement;
}): () => void {
  const component = mount(KpAnimationTransformationCoverage, {
    target: input.root,
    props: {
      view: createKpAnimationTransformationCoverageViewModel()
    }
  });
  input.root.dataset["kpTransformationCoverage"] = "mounted";
  return () => {
    delete input.root.dataset["kpTransformationCoverage"];
    void unmount(component);
  };
}
