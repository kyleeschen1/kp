import { test } from "@playwright/test";

import {
  assertKpSemanticReaderConformance,
  type KpSemanticReaderConformanceDescriptor
} from "./support/semantic-reader-conformance.ts";

const readers: readonly KpSemanticReaderConformanceDescriptor[] = [
  {
    id: "solve-x",
    readerId: "semantic-document",
    documentId: "lesson.solve-x.x-plus-3",
    version: "1",
    progress: 517,
    beatId: "beat.cancel",
    route: (progress) => "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1" + `&kpProgress=${progress}`,
    stageSelector: "[data-kp-reader-equation-stage]",
    shareSelector: "[data-kp-reader-share]",
    fontReadyEvidence: "document-fonts",
    progressEvidence: { kind: "attribute", selector: "body", name: "data-kp-reader-progress" },
    searchableText: "x+3=7"
  },
  {
    id: "distribution-area",
    readerId: "distribution-area",
    documentId: "lesson.algebra.distribution-area",
    version: "1",
    progress: 720,
    beatId: "beat.distribute",
    route: (progress) => `/reader/distribution-area/?kpProgress=${progress}&kpDirection=forward`,
    stageSelector: "[data-kp-distribution-stage]",
    shareSelector: "[data-kp-distribution-share]",
    fontReadyEvidence: "body-attribute",
    progressEvidence: { kind: "value", selector: "[data-kp-distribution-scrubber]" },
    searchableText: "3(x+2)"
  }
];

for (const descriptor of readers) {
  test(`${descriptor.id} satisfies the shared semantic reader contract`, async ({ page, browser }) => {
    await assertKpSemanticReaderConformance({ page, browser, descriptor });
  });
}
