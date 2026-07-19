import type { KpConceptRoomCommand } from "../../src/kernel/public-api.ts";

export function commandKind(command: KpConceptRoomCommand): KpConceptRoomCommand["kind"] {
  switch (command.kind) {
    case "seek":
    case "set-mode":
    case "set-projection":
    case "set-parameter":
    case "set-focus":
    case "set-branch":
    case "set-provider":
    case "set-snapshot-identity":
    case "restore-snapshot":
      return command.kind;
    default: {
      const exhaustive: never = command;
      return exhaustive;
    }
  }
}

// @ts-expect-error hover is ephemeral view state, not a replayable room command.
export const hoverCommand: KpConceptRoomCommand = { kind: "hover", semanticRef: "term.two-x" };
