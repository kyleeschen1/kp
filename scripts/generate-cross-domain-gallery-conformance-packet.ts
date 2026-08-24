import { readFile, writeFile } from "node:fs/promises";

import { createKpCrossDomainGalleryConformancePacket } from
  "./cross-domain-gallery-conformance-packet.ts";

const target = new URL(
  "../src/architecture/cross-domain-gallery-conformance-packet.generated.json",
  import.meta.url
);
const output = `${JSON.stringify(
  createKpCrossDomainGalleryConformancePacket(),
  null,
  2
)}\n`;

if (process.argv.includes("--check")) {
  const current = await readFile(target, "utf8").catch(() => "");
  if (current !== output) throw new Error(
    "Cross-domain gallery conformance packet is stale. Run " +
    "npm run generate:cross-domain-gallery-conformance."
  );
  console.log("cross-domain gallery conformance packet is current");
} else {
  await writeFile(target, output, "utf8");
  console.log("generated cross-domain gallery conformance packet");
}
