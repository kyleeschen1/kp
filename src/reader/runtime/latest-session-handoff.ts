const kpReaderSessionHandoffToken: unique symbol =
  Symbol("kp.reader.session-handoff-token");

export interface KpReaderSessionHandoffToken {
  readonly [kpReaderSessionHandoffToken]: true;
  readonly revision: number;
}

export interface KpReaderLatestSessionHandoff {
  readonly issue: () => KpReaderSessionHandoffToken;
  readonly commit: (
    token: KpReaderSessionHandoffToken,
    publish: () => void
  ) => boolean;
  readonly invalidate: () => void;
}

export function createKpReaderLatestSessionHandoff():
  KpReaderLatestSessionHandoff {
  let revision = 0;
  let current: KpReaderSessionHandoffToken | undefined;
  return {
    issue() {
      revision += 1;
      const token: KpReaderSessionHandoffToken = Object.freeze({
        [kpReaderSessionHandoffToken]: true as const,
        revision
      });
      current = token;
      return token;
    },
    commit(token, publish) {
      if (token !== current) return false;
      current = undefined;
      publish();
      return true;
    },
    invalidate() {
      revision += 1;
      current = undefined;
    }
  };
}
