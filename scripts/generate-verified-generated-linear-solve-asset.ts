import { writeFile } from "node:fs/promises";

import {
  createKpVerifiedGeneratedLinearSolveSession
} from "../src/tutorial/verified-generated-linear-solve-session.ts";

const animation = createKpVerifiedGeneratedLinearSolveSession()
  .animation.animation;
await writeFile(
  new URL(
    "../src/animation/verified-generated-linear-solve-asset.generated.json",
    import.meta.url
  ),
  `${JSON.stringify(animation, null, 2)}\n`,
  "utf8"
);
console.log(`generated ${animation.id}`);
