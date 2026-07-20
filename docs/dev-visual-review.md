# Development visual review inbox

The visual review inbox is a private development aid for collecting high-fidelity comments while an animation is running. `npm run dev` enables it and stores its append-only event log under `.kp/review-logs/`.

The directory is intentionally different from `tmp/codex/`: review comments survive server restarts and Codex sessions until the developer deliberately archives or removes them. It is gitignored because comments can contain unfinished observations and route state that do not belong in source control.

The v1 retention policy is deliberately conservative:

- never expire, compact, upload, or convert comments into source or Theseus events automatically;
- append note, status, and consumer-cursor events instead of rewriting prior observations;
- reject corrupt or unknown event lines rather than silently dropping them;
- keep production servers and production bundles unaware of the local inbox;
- let the developer explicitly archive or delete `.kp/review-logs/` when its history is no longer useful.

The repository CLI and `kp-review-logs` skill are the supported ways to review and triage this history. Direct editing of the JSONL file is unsupported.
