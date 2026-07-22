import { test } from "@playwright/test";
import { kpReaderRouteManifest } from "../src/reader/compiler/reader-route-manifest.ts";

import {
  assertKpSemanticReaderConformance,
  createKpSemanticReaderConformanceDescriptor
} from "./support/semantic-reader-conformance.ts";

const readers = kpReaderRouteManifest.map(
  createKpSemanticReaderConformanceDescriptor
);

for (const descriptor of readers) {
  test(`${descriptor.id} satisfies the shared semantic reader contract`, async ({ page, browser }) => {
    await assertKpSemanticReaderConformance({ page, browser, descriptor });
  });
}
