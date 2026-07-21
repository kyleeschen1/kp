import { isAbsolute, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import {
  kpDevReviewAdvanceCursorOperationV2Schema,
  kpDevReviewQueryInputSchema,
  kpDevReviewSetStatusOperationV2Schema
} from "../protocols/dev-review-operations-v2-schema.ts";
import type { KpDevReviewQueryInput } from "../protocols/dev-review-operations-v2.ts";
import type { KpDevReviewStatusV1 } from "../protocols/dev-review-v1.ts";
import { KpDevReviewRoundInboxService } from "../server/dev-review-round-inbox.ts";
import { validateKpDevReviewLifecycleTransition } from "../server/dev-review-lifecycle.ts";
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
      note: { type: "string" },
      to: { type: "string" },
      reason: { type: "string" },
      consumer: { type: "string" },
      through: { type: "string" },
      "dry-run": { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false }
    }
  });
  const command = positionals[0] ?? "query";
  if (values.help) {
    io.write(helpText);
    return;
  }
  if (positionals.length > 1 || !["query", "status", "cursor"].includes(command)) {
    throw new Error(`Unknown dev-review command ${positionals.join(" ")}`);
  }
  const root = values.root ?? environment[KP_DEV_REVIEW_ROOT_ENV] ?? resolve(".kp/review-logs");
  if (!isAbsolute(root)) {
    throw new Error(`--root and ${KP_DEV_REVIEW_ROOT_ENV} must be absolute paths`);
  }
  const service = new KpDevReviewRoundInboxService(await KpDevReviewEventStore.open(root));
  if (command === "status") {
    const operation = kpDevReviewSetStatusOperationV2Schema.parse({
      noteId: values.note,
      status: values.to,
      reason: values.reason
    });
    const note = service.read().notes.find((candidate) => candidate.id === operation.noteId);
    if (note === undefined) throw new Error(`Unknown review note ${operation.noteId}`);
    const transition = validateKpDevReviewLifecycleTransition(
      note.status,
      operation.status,
      operation.reason
    );
    if (!values["dry-run"]) {
      await service.setStatus(operation.noteId, operation.status, operation.reason);
    }
    writeJson(io, { ok: true, dryRun: values["dry-run"], operation: "status", noteId: note.id, transition });
    return;
  }
  if (command === "cursor") {
    const operation = kpDevReviewAdvanceCursorOperationV2Schema.parse({
      consumerId: values.consumer,
      roundId: values.round,
      throughSequence: values.through === undefined
        ? undefined
        : integer(values.through, "--through")
    });
    const inbox = service.read();
    if (!inbox.rounds.some((round) => round.id === operation.roundId)) {
      throw new Error(`Unknown review round ${operation.roundId}`);
    }
    const previous = inbox.cursors[operation.consumerId]?.[operation.roundId] ?? 0;
    const maximum = inbox.notes.filter((note) => note.roundId === operation.roundId).at(-1)?.sequence ?? 0;
    if (operation.throughSequence < previous || operation.throughSequence > maximum) {
      throw new RangeError(`Cursor must advance from ${previous} through at most ${maximum}`);
    }
    if (!values["dry-run"]) {
      await service.advanceCursor(
        operation.consumerId,
        operation.roundId,
        operation.throughSequence
      );
    }
    writeJson(io, {
      ok: true,
      dryRun: values["dry-run"],
      operation: "cursor",
      consumerId: operation.consumerId,
      roundId: operation.roundId,
      from: previous,
      through: operation.throughSequence
    });
    return;
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
  writeJson(io, service.query(query));
}

function writeJson(io: KpDevReviewCliIo, value: unknown): void {
  io.write(`${JSON.stringify(value, null, 2)}\n`);
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

Mutation commands are explicit and support validation without append:

  status --note <id> --to <status> [--reason <text>] [--dry-run]
  cursor --consumer <id> --round <id> --through <sequence> [--dry-run]
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
