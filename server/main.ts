import { createAppServer } from "./app.ts";
import { createExactRationalLinearProblemProvider } from "../providers/linear-problems/public-api.ts";
import { createKpDevReviewServicesFromEnvironment } from "./dev-review-config.ts";
import { createKpArticleSourceStoreFromEnvironment } from
  "./kp-article-source-config.ts";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 8001;

const host = process.env["HOST"] ?? DEFAULT_HOST;
const port = readPort(process.env["PORT"]);
const devReviewServices = await createKpDevReviewServicesFromEnvironment(process.env);
const server = createAppServer({
  linearProblemProvider: createExactRationalLinearProblemProvider(),
  devReviewService: devReviewServices?.legacy,
  devReviewRoundService: devReviewServices?.rounds,
  devReviewScreenshotService: devReviewServices?.screenshots,
  articleSourceStore: createKpArticleSourceStoreFromEnvironment(process.env)
});

server.listen(port, host, () => {
  console.log(`[api] listening on http://${host}:${port}`);
  if (devReviewServices !== undefined) console.log("[api] local visual review inbox enabled");
  if (process.env["KP_ARTICLE_SOURCE_WRITE"] === "1") {
    console.log("[api] explicit lesson source writes enabled");
  }
});

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

function readPort(value: string | undefined): number {
  if (value === undefined || value.trim() === "") {
    return DEFAULT_PORT;
  }

  const portValue = Number.parseInt(value, 10);

  if (!Number.isInteger(portValue) || portValue < 1 || portValue > 65_535) {
    throw new Error(`Expected PORT to be an integer from 1 through 65535.`);
  }

  return portValue;
}

function shutdown(signal: NodeJS.Signals): void {
  console.log(`[api] received ${signal}; shutting down`);

  server.close((error) => {
    if (error !== undefined) {
      console.error(error);
      process.exitCode = 1;
    }

    process.exit();
  });
}
