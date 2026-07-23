import type {
  KpCanonicalAnimationIdentity
} from "./semantic-animation-workbench-identity.ts";
import type {
  KpAnimationReviewAdapterResult
} from "./semantic-animation-workbench-review-adapter.ts";

export type KpAnimationWorkbenchReviewLoader = (
  identities: readonly KpCanonicalAnimationIdentity[]
) => Promise<KpAnimationReviewAdapterResult>;

// Keep the dynamic imports behind a module-scope DEV branch so production
// builds erase the review client, endpoint, protocol parsers, and adapter.
export const loadKpAnimationWorkbenchReviewEvidence:
  KpAnimationWorkbenchReviewLoader | undefined = import.meta.env.DEV
    ? async (identities) => {
        const [{ KpDevReviewClient }, { projectKpAnimationReviewEvidence }] =
          await Promise.all([
            import("../dev-review/client.ts"),
            import("./semantic-animation-workbench-review-adapter.ts")
          ]);
        const client = new KpDevReviewClient();
        const notes = [];
        let afterSequence: number | undefined;
        let currentRoundId: string | undefined;

        do {
          const result = await client.query({
            scope: "all",
            detail: "full",
            limit: 100,
            ...(afterSequence === undefined ? {} : { afterSequence })
          });
          notes.push(...result.page.notes);
          currentRoundId ??= result.rounds.find(
            (round) => round.status === "open"
          )?.id;
          afterSequence = result.page.hasMore
            ? result.page.nextAfterSequence
            : undefined;
        } while (afterSequence !== undefined);

        return projectKpAnimationReviewEvidence({
          identities,
          notes,
          ...(currentRoundId === undefined ? {} : { currentRoundId })
        });
      }
    : undefined;
