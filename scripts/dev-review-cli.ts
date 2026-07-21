import { isAbsolute, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import { kpDevReviewQueryInputSchema } from "../protocols/dev-review-operations-v2-schema.ts";
import type { KpDevReviewQueryInput } from "../protocols/dev-review-operations-v2.ts";
import type { KpDevReviewStatusV1 } from "../protocols/dev-review-v1.ts";
import { KpDevReviewRoundInboxService } from "../server/dev-review-round-inbox.ts";
import { KpDevReviewEventStore } from "../server/dev-review-store.ts";
import { KP_DEV_REVIEW_ROOT_ENV } from "../server/dev-review-config.ts";

export interface KpDevReviewCliIo {
  readonly write: (output: string) => void;
}

export async function runKpDevReviewCli(
  argv: readonly string[],
  environment: Readonly<Record<string, string | undefined>>,
  io: KpDevReviewCliIo
): Promise<void> {
  const { values, positionals } = parseArgs({
    args: [...argv],
    allowPositionals: true,
    strict: true,
    options: {
      root: { type: "string" },
      history: { type: "boolean", default: false },
      all: { type: "boolean", default: false },
      round: { type: "string" },
      status: { type: "string", multiple: true },
      route: { type: "string" },
      after: { type: "string" },
      unread: { type: "string" },
      limit: { type: "string" },
      detail: { type: "string" },
      help: { type: "boolean", short: "h", default: false }
    }
  });
  const command = positionals[0] ?? "query";
  if (values.help) {
    io.write(helpText);
    return;
  }
  if (positionals.length > 1 || command !== "query") {
    throw new Error(`Unknown dev-review command ${positionals.join(" ")}`);
  }
  const root = values.root ?? environment[KP_DEV_REVIEW_ROOT_ENV] ?? resolve(".kp/review-logs");
  if (!isAbsolute(root)) {
    throw new Error(`--root and ${KP_DEV_REVIEW_ROOT_ENV} must be absolute paths`);
  }
  if ([values.history, values.all, values.round !== undefined].filter(Boolean).length > 1) {
    throw new Error("Choose only one of --history, --all, or --round");
  }
  const query: KpDevReviewQueryInput = kpDevReviewQueryInputSchema.parse({
    ...(values.history ? { scope: "historical" } : {}),
    ...(values.all ? { scope: "all" } : {}),
    ...(values.round === undefined ? {} : { roundId: values.round }),
    ...(values.status === undefined
      ? {}
      : { statuses: values.status as readonly KpDevReviewStatusV1[] }),
    ...(values.route === undefined ? {} : { routePrefix: values.route }),
    ...(values.after === undefined ? {} : { afterSequence: integer(values.after, "--after") }),
    ...(values.unread === undefined ? {} : { unreadBy: values.unread }),
    ...(values.limit === undefined ? {} : { limit: integer(values.limit, "--limit") }),
    ...(values.detail === undefined ? {} : { detail: values.detail })
  });
  const service = new KpDevReviewRoundInboxService(await KpDevReviewEventStore.open(root));
  io.write(`${JSON.stringify(service.query(query), null, 2)}\n`);
}

function integer(value: string, option: string): number {
  if (!/^\d+$/.test(value)) throw new Error(`${option} must be a non-negative integer`);
  return Number(value);
}

const helpText = `Usage: npm run review:logs -- query [options]

Defaults to a bounded compact query of the current review round.

  --root <absolute-path>  Review store; defaults to KP_DEV_REVIEW_ROOT or .kp/review-logs
  --history              Query closed rounds explicitly
  --all                  Query current and historical rounds explicitly
  --round <id>           Query one explicit round
  --status <status>      Filter status; repeatable
  --route <prefix>       Filter captured route prefix
  --after <sequence>     Continue stable pagination
  --unread <consumer>    Return notes beyond the consumer's round cursor
  --limit <1-100>        Bound returned evidence; defaults to 20
  --detail summary|full  Include compact evidence or explicit full captures
`;

const entryPath = process.argv[1];
if (entryPath !== undefined && import.meta.url === pathToFileURL(entryPath).href) {
  runKpDevReviewCli(process.argv.slice(2), process.env, {
    write: (output) => process.stdout.write(output)
  }).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
